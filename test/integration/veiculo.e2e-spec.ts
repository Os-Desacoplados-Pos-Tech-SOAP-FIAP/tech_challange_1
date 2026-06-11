import { INestApplication } from '@nestjs/common';
import { PerfilAcesso } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import request from 'supertest';

import { createTestApp, TestContext } from '../helpers/setup';

interface SeededUser {
  id: string;
  email: string;
  senha: string;
  perfil: PerfilAcesso;
}

async function seedUser(prisma: any, perfil: PerfilAcesso): Promise<SeededUser> {
  const senha = 'senha123';
  const email = `${perfil.toLowerCase()}-${randomUUID().slice(0, 8)}@teste.local`;
  const id = randomUUID();
  await prisma.usuario.create({
    data: { id, nome: `${perfil} Teste`, email, senha: await bcrypt.hash(senha, 8), perfil },
  });
  return { id, email, senha, perfil };
}

async function login(app: INestApplication, user: SeededUser): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: user.email, senha: user.senha });
  expect(res.status).toBe(200);
  return res.body.accessToken;
}

const calcDigit = (base: string, factor: number) => {
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * (factor - i);
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
};
let cpfSeed = 400000000;
const proximoCpfValido = (): string => {
  while (true) {
    const base = String(cpfSeed++).padStart(9, '0');
    if (/^(\d)\1{8}$/.test(base)) continue;
    const d1 = calcDigit(base, 10);
    const d2 = calcDigit(base + d1, 11);
    const cpf = `${base}${d1}${d2}`;
    if (/^(\d)\1{10}$/.test(cpf)) continue;
    return cpf;
  }
};

describe('Veiculo CRUD (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let token: string;
  let clienteId: string;
  const placas = ['AAA1A11', 'BBB2B22', 'CCC3C33', 'DDD4D44', 'EEE5E55', 'FFF6F66', 'GGG7G77'];
  let placaIdx = 0;
  const proximaPlaca = () => placas[placaIdx++];

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
    const atendente = await seedUser(ctx.prisma, PerfilAcesso.ATENDENTE);
    token = await login(app, atendente);

    const cliente = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: proximoCpfValido(), nome: 'Cliente Veículo', email: 'veiculo@teste.local' });
    expect(cliente.status).toBe(201);
    clienteId = cliente.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lista veículos vazia inicialmente', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/veiculos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('cadastra veículo vinculado ao cliente', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({ placa: proximaPlaca(), marca: 'VW', modelo: 'Gol', ano: 2020, clienteId });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.clienteId).toBe(clienteId);
    expect(res.body.marca).toBe('VW');
  });

  it('lista veículos após cadastro', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/veiculos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('lista veículos filtrados por clienteId', async () => {
    const outroCliente = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: proximoCpfValido(), nome: 'Outro', email: 'outro@teste.local' });
    expect(outroCliente.status).toBe(201);

    await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({ placa: proximaPlaca(), marca: 'Fiat', modelo: 'Uno', ano: 2019, clienteId: outroCliente.body.id });

    const res = await request(app.getHttpServer())
      .get(`/api/veiculos?clienteId=${clienteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.every((v: any) => v.clienteId === clienteId)).toBe(true);
  });

  it('busca veículo por ID', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({ placa: proximaPlaca(), marca: 'Toyota', modelo: 'Corolla', ano: 2021, clienteId });
    expect(created.status).toBe(201);

    const res = await request(app.getHttpServer())
      .get(`/api/veiculos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.modelo).toBe('Corolla');
  });

  it('retorna 404 ao buscar veículo inexistente por ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/veiculos/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('busca veículo por placa', async () => {
    const placa = proximaPlaca();
    const created = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({ placa, marca: 'Honda', modelo: 'Civic', ano: 2022, clienteId });
    expect(created.status).toBe(201);

    const res = await request(app.getHttpServer())
      .get(`/api/veiculos/placa/${placa}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.modelo).toBe('Civic');
  });

  it('retorna 404 ao buscar placa inexistente', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/veiculos/placa/ZZZ9Z99')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('atualiza dados do veículo', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({ placa: proximaPlaca(), marca: 'Ford', modelo: 'Ka', ano: 2018, clienteId });
    expect(created.status).toBe(201);

    const res = await request(app.getHttpServer())
      .put(`/api/veiculos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ marca: 'Ford Atualizado', modelo: 'Ka+', ano: 2019 });
    expect(res.status).toBe(200);
    expect(res.body.marca).toBe('Ford Atualizado');
    expect(res.body.modelo).toBe('Ka+');
    expect(res.body.ano).toBe(2019);
  });

  it('retorna 409 ao cadastrar placa duplicada', async () => {
    const placa = proximaPlaca();
    const first = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({ placa, marca: 'VW', modelo: 'Polo', ano: 2023, clienteId });
    expect(first.status).toBe(201);

    const dup = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({ placa, marca: 'Fiat', modelo: 'Fastback', ano: 2023, clienteId });
    expect(dup.status).toBe(409);
  });
});

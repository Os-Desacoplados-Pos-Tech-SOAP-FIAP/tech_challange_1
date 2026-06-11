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
let cpfSeed = 300000000;
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

describe('Cliente CRUD (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let token: string;
  let mecanicoToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
    const atendente = await seedUser(ctx.prisma, PerfilAcesso.ATENDENTE);
    const mecanico = await seedUser(ctx.prisma, PerfilAcesso.MECANICO);
    token = await login(app, atendente);
    mecanicoToken = await login(app, mecanico);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lista clientes vazia inicialmente', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/clientes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('cadastra cliente PF com CPF válido', async () => {
    const cpf = proximoCpfValido();
    const res = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: cpf, nome: 'João Silva', email: 'joao@silva.local' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.tipo).toBe('PF');
    expect(res.body.nome).toBe('João Silva');
    expect(res.body.email).toBe('joao@silva.local');
  });

  it('cadastra cliente PJ com CNPJ válido', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PJ', documento: '11222333000181', nome: 'Empresa Ltda', email: 'empresa@ltda.local' });
    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('PJ');
    expect(res.body.nome).toBe('Empresa Ltda');
  });

  it('lista retorna clientes cadastrados', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/clientes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('busca cliente por ID', async () => {
    const cpf = proximoCpfValido();
    const created = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: cpf, nome: 'Maria Santos', email: 'maria@santos.local' });
    expect(created.status).toBe(201);

    const res = await request(app.getHttpServer())
      .get(`/api/clientes/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.nome).toBe('Maria Santos');
  });

  it('retorna 404 ao buscar cliente inexistente por ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/clientes/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('busca cliente por documento', async () => {
    const cpf = proximoCpfValido();
    const created = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: cpf, nome: 'Pedro Alves', email: 'pedro@alves.local' });
    expect(created.status).toBe(201);

    const res = await request(app.getHttpServer())
      .get(`/api/clientes/documento/${cpf}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Pedro Alves');
  });

  it('retorna 404 ao buscar documento inexistente', async () => {
    const cpf = proximoCpfValido();
    const res = await request(app.getHttpServer())
      .get(`/api/clientes/documento/${cpf}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('atualiza nome, email e telefone do cliente', async () => {
    const cpf = proximoCpfValido();
    const created = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: cpf, nome: 'Ana Souza', email: 'ana@souza.local' });
    expect(created.status).toBe(201);

    const res = await request(app.getHttpServer())
      .put(`/api/clientes/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Ana Souza Atualizada', email: 'ana.nova@souza.local', telefone: '11999990000' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Ana Souza Atualizada');
    expect(res.body.email).toBe('ana.nova@souza.local');
  });

  it('retorna 404 ao atualizar cliente inexistente', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/clientes/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Inexistente' });
    expect(res.status).toBe(404);
  });

  it('retorna 409 ao cadastrar documento duplicado', async () => {
    const cpf = proximoCpfValido();
    const first = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: cpf, nome: 'Primeiro', email: 'primeiro@teste.local' });
    expect(first.status).toBe(201);

    const dup = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: cpf, nome: 'Segundo', email: 'segundo@teste.local' });
    expect(dup.status).toBe(409);
  });

  it('retorna 422 para CPF inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: '11111111111', nome: 'Inválido', email: 'invalido@teste.local' });
    expect(res.status).toBe(422);
  });

  it('MECANICO não pode acessar /clientes → 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/clientes')
      .set('Authorization', `Bearer ${mecanicoToken}`);
    expect(res.status).toBe(403);
  });
});

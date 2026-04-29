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
    data: {
      id,
      nome: `${perfil} Teste`,
      email,
      senha: await bcrypt.hash(senha, 8),
      perfil,
    },
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
let cpfSeed = 200000000;
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

describe('POST /ordens-de-servico/:id/itens — incremento de item duplicado (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let token: string;
  let placaIdx = 0;
  const placas = ['ZZA1A11', 'ZZB2B22', 'ZZC3C33', 'ZZD4D44', 'ZZE5E55', 'ZZF6F66'];

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
    const admin = await seedUser(ctx.prisma, PerfilAcesso.ADMINISTRADOR);
    token = await login(app, admin);
  });

  afterAll(async () => {
    await app.close();
  });

  async function criarOS(): Promise<string> {
    const documento = proximoCpfValido();
    const placa = placas[placaIdx++ % placas.length];
    const cliente = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'PF',
        documento,
        nome: 'Cliente Dup',
        email: `dup-${documento}@teste.local`,
      });
    expect(cliente.status).toBe(201);
    const veiculo = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa,
        marca: 'VW',
        modelo: 'Polo',
        ano: 2024,
        clienteId: cliente.body.id,
      });
    expect(veiculo.status).toBe(201);
    const os = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: cliente.body.id, veiculoId: veiculo.body.id });
    expect(os.status).toBe(201);
    return os.body.id;
  }

  it('incrementa quantidade do mesmo serviço em vez de duplicar linha', async () => {
    const servico = await request(app.getHttpServer())
      .post('/api/servicos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Alinhamento', descricao: 'Alinhar rodas', valorPadrao: 100 });
    expect(servico.status).toBe(201);

    const osId = await criarOS();

    const r1 = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/itens`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'SERVICO', servicoId: servico.body.id, quantidade: 2 });
    expect(r1.status).toBe(201);
    expect(r1.body.itensOrcamento).toHaveLength(1);

    const r2 = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/itens`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'SERVICO', servicoId: servico.body.id, quantidade: 3 });
    expect(r2.status).toBe(201);
    expect(r2.body.itensOrcamento).toHaveLength(1);
    expect(r2.body.itensOrcamento[0].quantidade).toBe(5);
    expect(r2.body.itensOrcamento[0].valorTotal).toBe(500);
    expect(r2.body.valorEstimado).toBe(500);
  });

  it('incrementa quantidade do mesmo insumo e acumula reserva de estoque', async () => {
    const insumo = await request(app.getHttpServer())
      .post('/api/insumos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        codigo: 'PEC-DUP',
        nome: 'Filtro de óleo',
        tipo: 'PECA',
        valorUnitario: 30,
        quantidadeEstoque: 10,
      });
    expect(insumo.status).toBe(201);

    const osId = await criarOS();

    const r1 = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/itens`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'INSUMO', insumoId: insumo.body.id, quantidade: 1 });
    expect(r1.status).toBe(201);

    const r2 = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/itens`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'INSUMO', insumoId: insumo.body.id, quantidade: 4 });
    expect(r2.status).toBe(201);
    expect(r2.body.itensOrcamento).toHaveLength(1);
    expect(r2.body.itensOrcamento[0].quantidade).toBe(5);
    expect(r2.body.itensOrcamento[0].tipo).toBe('INSUMO');

    const insumoRow = await ctx.prisma.insumo.findUnique({ where: { id: insumo.body.id } });
    expect(insumoRow.quantidadeReservada).toBe(5);
  });
});

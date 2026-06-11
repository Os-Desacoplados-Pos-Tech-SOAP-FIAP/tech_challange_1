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

describe('Catálogo — Serviços e Insumos (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let adminToken: string;
  let atendenteToken: string;
  let mecanicoToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
    const admin = await seedUser(ctx.prisma, PerfilAcesso.ADMINISTRADOR);
    const atendente = await seedUser(ctx.prisma, PerfilAcesso.ATENDENTE);
    const mecanico = await seedUser(ctx.prisma, PerfilAcesso.MECANICO);
    adminToken = await login(app, admin);
    atendenteToken = await login(app, atendente);
    mecanicoToken = await login(app, mecanico);
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Serviços ──────────────────────────────────────────────────────────────

  it('MECANICO não pode cadastrar serviço → 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/servicos')
      .set('Authorization', `Bearer ${mecanicoToken}`)
      .send({ nome: 'Alinhamento', descricao: 'Alinhar rodas', valorPadrao: 80 });
    expect(res.status).toBe(403);
  });

  it('ATENDENTE não pode cadastrar serviço → 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/servicos')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({ nome: 'Alinhamento', descricao: 'Alinhar rodas', valorPadrao: 80 });
    expect(res.status).toBe(403);
  });

  it('ADMIN cadastra serviço', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/servicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Alinhamento', descricao: 'Alinha rodas dianteiras e traseiras', valorPadrao: 80 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.nome).toBe('Alinhamento');
    expect(res.body.valorPadrao).toBe(80);
    expect(res.body.ativo).toBe(true);
  });

  it('ATENDENTE pode listar serviços', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/servicos')
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('MECANICO pode listar serviços', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/servicos')
      .set('Authorization', `Bearer ${mecanicoToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('ADMIN atualiza serviço', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/servicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Balanceamento', descricao: 'Balancear pneus', valorPadrao: 60 });
    expect(created.status).toBe(201);

    const res = await request(app.getHttpServer())
      .put(`/api/servicos/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Balanceamento Premium', valorPadrao: 90, ativo: false });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Balanceamento Premium');
    expect(res.body.valorPadrao).toBe(90);
    expect(res.body.ativo).toBe(false);
  });

  it('retorna 404 ao atualizar serviço inexistente', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/servicos/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Inexistente' });
    expect(res.status).toBe(404);
  });

  // ── Insumos ───────────────────────────────────────────────────────────────

  it('ATENDENTE não pode cadastrar insumo → 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/insumos')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({ codigo: 'PEC-001', nome: 'Filtro de óleo', tipo: 'PECA', valorUnitario: 25, quantidadeEstoque: 10 });
    expect(res.status).toBe(403);
  });

  it('MECANICO pode cadastrar insumo', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/insumos')
      .set('Authorization', `Bearer ${mecanicoToken}`)
      .send({ codigo: 'PEC-MEC-01', nome: 'Vela de ignição', tipo: 'PECA', valorUnitario: 15, quantidadeEstoque: 20 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.codigo).toBe('PEC-MEC-01');
    expect(res.body.quantidadeEstoque).toBe(20);
    expect(res.body.quantidadeReservada).toBe(0);
    expect(res.body.quantidadeDisponivel).toBe(20);
  });

  it('ADMIN cadastra insumo do tipo INSUMO', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/insumos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: 'INS-001', nome: 'Óleo 5W30', tipo: 'INSUMO', valorUnitario: 8.5, quantidadeEstoque: 50 });
    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('INSUMO');
  });

  it('todos os perfis podem listar insumos', async () => {
    const [resAdmin, resAtend, resMec] = await Promise.all([
      request(app.getHttpServer()).get('/api/insumos').set('Authorization', `Bearer ${adminToken}`),
      request(app.getHttpServer()).get('/api/insumos').set('Authorization', `Bearer ${atendenteToken}`),
      request(app.getHttpServer()).get('/api/insumos').set('Authorization', `Bearer ${mecanicoToken}`),
    ]);
    expect(resAdmin.status).toBe(200);
    expect(resAtend.status).toBe(200);
    expect(resMec.status).toBe(200);
    expect(resAdmin.body.length).toBeGreaterThanOrEqual(2);
  });

  it('ADMIN atualiza estoque do insumo', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/insumos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: 'PEC-EST-01', nome: 'Pastilha de freio', tipo: 'PECA', valorUnitario: 45, quantidadeEstoque: 5 });
    expect(created.status).toBe(201);

    const res = await request(app.getHttpServer())
      .patch(`/api/insumos/${created.body.id}/estoque`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantidade: 30 });
    expect(res.status).toBe(200);
    expect(res.body.quantidadeEstoque).toBe(30);
  });

  it('retorna 404 ao atualizar estoque de insumo inexistente', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/insumos/${randomUUID()}/estoque`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantidade: 10 });
    expect(res.status).toBe(404);
  });

  it('retorna 409 ao cadastrar código de insumo duplicado', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/insumos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: 'COD-DUP', nome: 'Peça Original', tipo: 'PECA', valorUnitario: 100, quantidadeEstoque: 2 });
    expect(first.status).toBe(201);

    const dup = await request(app.getHttpServer())
      .post('/api/insumos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: 'COD-DUP', nome: 'Peça Cópia', tipo: 'PECA', valorUnitario: 50, quantidadeEstoque: 5 });
    expect(dup.status).toBe(409);
  });
});

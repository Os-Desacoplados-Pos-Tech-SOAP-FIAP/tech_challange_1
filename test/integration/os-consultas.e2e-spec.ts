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
let cpfSeed = 600000000;
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
let placaIdx = 0;
const proximaPlaca = () => {
  const idx = placaIdx++;
  const letter = String.fromCharCode(65 + (idx % 26));
  return `OC${letter}${String(idx).padStart(4, '0')}`;
};

describe('OS — consultas, listagem e rotas públicas (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let adminToken: string;
  let atendenteToken: string;
  let admin: SeededUser;
  let atendente: SeededUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
    admin = await seedUser(ctx.prisma, PerfilAcesso.ADMINISTRADOR);
    atendente = await seedUser(ctx.prisma, PerfilAcesso.ATENDENTE);
    adminToken = await login(app, admin);
    atendenteToken = await login(app, atendente);
  });

  afterAll(async () => {
    await app.close();
  });

  async function criarOS(token: string): Promise<{ id: string; numero: number }> {
    const cliente = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'PF', documento: proximoCpfValido(), nome: 'Cliente OS', email: `os-${randomUUID().slice(0, 6)}@teste.local` });
    expect(cliente.status).toBe(201);

    const veiculo = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({ placa: proximaPlaca(), marca: 'VW', modelo: 'Gol', ano: 2020, clienteId: cliente.body.id });
    expect(veiculo.status).toBe(201);

    const os = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${token}`)
      .send({ clienteId: cliente.body.id, veiculoId: veiculo.body.id, observacoes: 'Revisão' });
    expect(os.status).toBe(201);
    return { id: os.body.id, numero: os.body.numero };
  }

  async function criarOSAguardandoAprovacao(token: string): Promise<{ id: string; numero: number }> {
    const { id, numero } = await criarOS(token);

    const servico = await request(app.getHttpServer())
      .post('/api/servicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: `Serviço-${randomUUID().slice(0, 6)}`, descricao: 'Desc', valorPadrao: 100 });
    expect(servico.status).toBe(201);

    const item = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${id}/itens`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'SERVICO', servicoId: servico.body.id, quantidade: 1 });
    expect(item.status).toBe(201);

    const avancar = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${id}/status`)
      .set('Authorization', `Bearer ${token}`);
    expect(avancar.status).toBe(200);
    expect(avancar.body.status).toBe('AGUARDANDO_APROVACAO');

    return { id, numero };
  }

  // ── Listar OS ─────────────────────────────────────────────────────────────

  it('lista OS retorna array vazio quando não há OS', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('lista OS retorna OS criadas em status RECEBIDA', async () => {
    await criarOS(atendenteToken);
    await criarOS(atendenteToken);

    const res = await request(app.getHttpServer())
      .get('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.every((o: any) => o.status === 'RECEBIDA')).toBe(true);
  });

  it('lista OS não retorna OS em status FINALIZADA', async () => {
    const osId = randomUUID();
    await ctx.prisma.ordemDeServico.upsert({
      where: { id: osId },
      create: {
        id: osId,
        numero: 9001,
        clienteId: randomUUID(),
        veiculoId: randomUUID(),
        status: 'FINALIZADA',
        valorEstimado: 0,
      },
      update: {},
    });

    const res = await request(app.getHttpServer())
      .get('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(200);
    expect(res.body.every((o: any) => o.status !== 'FINALIZADA')).toBe(true);
  });

  it('lista OS respeita ordenação: EM_EXECUCAO > AGUARDANDO_APROVACAO > EM_DIAGNOSTICO > RECEBIDA', async () => {
    const statusOrdenados = ['RECEBIDA', 'EM_DIAGNOSTICO', 'AGUARDANDO_APROVACAO', 'EM_EXECUCAO'] as const;
    const ids: Record<string, string> = {};

    for (let i = 0; i < statusOrdenados.length; i++) {
      const status = statusOrdenados[i];
      const id = randomUUID();
      ids[status] = id;
      await ctx.prisma.ordemDeServico.upsert({
        where: { id },
        create: { id, numero: 8000 + i, clienteId: randomUUID(), veiculoId: randomUUID(), status, valorEstimado: 0 },
        update: {},
      });
    }

    const res = await request(app.getHttpServer())
      .get('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(200);

    const positions = res.body.map((o: any) => o.id);
    const pos = (status: string) => positions.indexOf(ids[status]);

    expect(pos('EM_EXECUCAO')).toBeLessThan(pos('AGUARDANDO_APROVACAO'));
    expect(pos('AGUARDANDO_APROVACAO')).toBeLessThan(pos('EM_DIAGNOSTICO'));
    expect(pos('EM_DIAGNOSTICO')).toBeLessThan(pos('RECEBIDA'));
  });

  it('MECANICO não pode listar OS → 403', async () => {
    const mecanico = await seedUser(ctx.prisma, PerfilAcesso.MECANICO);
    const mecToken = await login(app, mecanico);
    const res = await request(app.getHttpServer())
      .get('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${mecToken}`);
    expect(res.status).toBe(403);
  });

  // ── Buscar OS ─────────────────────────────────────────────────────────────

  it('busca OS por ID', async () => {
    const { id } = await criarOS(atendenteToken);
    const res = await request(app.getHttpServer())
      .get(`/api/ordens-de-servico/${id}`)
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.status).toBe('RECEBIDA');
    expect(res.body.itensOrcamento).toEqual([]);
  });

  it('retorna 404 ao buscar OS inexistente por ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/ordens-de-servico/${randomUUID()}`)
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(404);
  });

  it('busca OS por número', async () => {
    const { id, numero } = await criarOS(atendenteToken);
    const res = await request(app.getHttpServer())
      .get(`/api/ordens-de-servico/numero/${numero}`)
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.numero).toBe(numero);
  });

  it('retorna 404 ao buscar OS por número inexistente', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/ordens-de-servico/numero/99999')
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(404);
  });

  // ── Rotas públicas ────────────────────────────────────────────────────────

  it('GET /publico/os/:numero/status — rota pública, sem autenticação', async () => {
    const { numero } = await criarOS(atendenteToken);

    const res = await request(app.getHttpServer())
      .get(`/api/publico/os/${numero}/status`);
    expect(res.status).toBe(200);
    expect(res.body.numero).toBe(numero);
    expect(res.body.status).toBe('RECEBIDA');
    expect(res.body.valorEstimado).toBeDefined();
  });

  it('GET /publico/os/:numero/status → 404 para OS inexistente', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/publico/os/99998/status');
    expect(res.status).toBe(404);
  });

  it('GET /publico/os/:numero/orcamento?token — retorna itens do orçamento', async () => {
    const { id, numero } = await criarOSAguardandoAprovacao(atendenteToken);
    const token = randomUUID();
    await ctx.prisma.orcamentoToken.create({
      data: { id: randomUUID(), ordemDeServicoId: id, token, usado: false },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/publico/os/${numero}/orcamento?token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.numero).toBe(numero);
    expect(res.body.status).toBe('AGUARDANDO_APROVACAO');
    expect(Array.isArray(res.body.itens)).toBe(true);
    expect(res.body.itens.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /publico/os/:numero/orcamento → 401 quando token já foi usado', async () => {
    const { id, numero } = await criarOSAguardandoAprovacao(atendenteToken);
    const token = randomUUID();
    await ctx.prisma.orcamentoToken.create({
      data: { id: randomUUID(), ordemDeServicoId: id, token, usado: true },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/publico/os/${numero}/orcamento?token=${token}`);
    expect(res.status).toBe(401);
  });

  it('POST /publico/os/:numero/orcamento/decisao → aprova orçamento', async () => {
    const { id, numero } = await criarOSAguardandoAprovacao(atendenteToken);
    const token = randomUUID();
    await ctx.prisma.orcamentoToken.create({
      data: { id: randomUUID(), ordemDeServicoId: id, token, usado: false },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/publico/os/${numero}/orcamento/decisao`)
      .send({ token, decisao: 'APROVADA' });
    expect(res.status).toBe(201);
    expect(res.body.numero).toBe(numero);
    expect(res.body.status).toBe('APROVADA');
  });

  it('POST /publico/os/:numero/orcamento/decisao → reprova orçamento', async () => {
    const { id, numero } = await criarOSAguardandoAprovacao(atendenteToken);
    const token = randomUUID();
    await ctx.prisma.orcamentoToken.create({
      data: { id: randomUUID(), ordemDeServicoId: id, token, usado: false },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/publico/os/${numero}/orcamento/decisao`)
      .send({ token, decisao: 'REPROVADA' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('REPROVADA');
  });

  it('POST decisão → 401 quando token já foi usado', async () => {
    const { id, numero } = await criarOSAguardandoAprovacao(atendenteToken);
    const token = randomUUID();
    await ctx.prisma.orcamentoToken.create({
      data: { id: randomUUID(), ordemDeServicoId: id, token, usado: true },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/publico/os/${numero}/orcamento/decisao`)
      .send({ token, decisao: 'APROVADA' });
    expect(res.status).toBe(401);
  });

  // ── Métricas ──────────────────────────────────────────────────────────────

  it('GET /metricas/tempo-medio retorna tempo médio (ADMIN)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/ordens-de-servico/metricas/tempo-medio')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.tempoMedioMinutos).toBe('number');
  });

  it('GET /metricas/tempo-medio-por-servico retorna lista (ADMIN)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/ordens-de-servico/metricas/tempo-medio-por-servico')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('ATENDENTE não pode acessar métricas → 403', async () => {
    const [r1, r2] = await Promise.all([
      request(app.getHttpServer())
        .get('/api/ordens-de-servico/metricas/tempo-medio')
        .set('Authorization', `Bearer ${atendenteToken}`),
      request(app.getHttpServer())
        .get('/api/ordens-de-servico/metricas/tempo-medio-por-servico')
        .set('Authorization', `Bearer ${atendenteToken}`),
    ]);
    expect(r1.status).toBe(403);
    expect(r2.status).toBe(403);
  });
});

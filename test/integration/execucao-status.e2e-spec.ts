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

describe('Execução por item + avanço de status (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let atendente: SeededUser;
  let mecanico: SeededUser;
  let atendenteToken: string;
  let mecanicoToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
    atendente = await seedUser(ctx.prisma, PerfilAcesso.ATENDENTE);
    mecanico = await seedUser(ctx.prisma, PerfilAcesso.MECANICO);
    atendenteToken = await login(app, atendente);
    mecanicoToken = await login(app, mecanico);
  });

  afterAll(async () => {
    await app.close();
  });

  // Gera CPFs válidos sob demanda — evita depender de strings hardcoded
  const calcDigit = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * (factor - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  let cpfSeed = 100000000;
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
  const placas = ['ABC1A23', 'DEF2B34', 'GHI3C45', 'JKL4D56', 'MNO5E67', 'PQR6F78', 'STU7G89', 'VWX8H90'];
  let placaIdx = 0;

  async function criarOSComItemServico(): Promise<{ osId: string; itemId: string }> {
    const documento = proximoCpfValido();
    const placa = placas[placaIdx++ % placas.length];
    const cliente = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({
        tipo: 'PF',
        documento,
        nome: 'Cliente Fluxo',
        email: `cliente-${documento}@teste.local`,
      });
    expect(cliente.status).toBe(201);

    const veiculo = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({
        placa,
        marca: 'Fiat',
        modelo: 'Strada',
        ano: 2024,
        clienteId: cliente.body.id,
      });
    expect(veiculo.status).toBe(201);

    const os = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({
        clienteId: cliente.body.id,
        veiculoId: veiculo.body.id,
        observacoes: 'fluxo',
      });
    expect(os.status).toBe(201);
    expect(os.body.status).toBe('RECEBIDA');

    // O endpoint de adicionarItem exige Servico cadastrado; ao invés de
    // simular o catálogo no mock, enxertamos o item direto via prisma para
    // não acoplar este teste ao módulo de Servico.
    const itemId = randomUUID();
    await ctx.prisma.itemOrcamento.upsert({
      where: { id: itemId },
      create: {
        id: itemId,
        ordemDeServicoId: os.body.id,
        tipo: 'SERVICO',
        referenciaId: randomUUID(),
        descricao: 'Alinhamento',
        quantidade: 1,
        valorUnitario: 100,
        valorTotal: 100,
      },
    });
    // Avança status para EM_DIAGNOSTICO simulando o que adicionarItem faria
    // (ajuste direto no mock — o agregado já trata isso quando passa pela API).
    const osRow = await ctx.prisma.ordemDeServico.findUnique({ where: { id: os.body.id } });
    if (osRow) osRow.status = 'EM_DIAGNOSTICO';

    return { osId: os.body.id, itemId };
  }

  it('avanca EM_DIAGNOSTICO → AGUARDANDO_APROVACAO via POST /status', async () => {
    const { osId } = await criarOSComItemServico();

    const res = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/status`)
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('AGUARDANDO_APROVACAO');
  });

  it('rejeita avanço quando OS está em estado sem caminho manual (RECEBIDA)', async () => {
    const documento = proximoCpfValido();
    const placa = placas[placaIdx++ % placas.length];
    const cliente = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({
        tipo: 'PF',
        documento,
        nome: 'Cliente Sem Item',
        email: `sem-item-${documento}@teste.local`,
      });
    expect(cliente.status).toBe(201);
    const veiculo = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({
        placa,
        marca: 'VW',
        modelo: 'Saveiro',
        ano: 2020,
        clienteId: cliente.body.id,
      });
    expect(veiculo.status).toBe(201);
    const os = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({ clienteId: cliente.body.id, veiculoId: veiculo.body.id });
    expect(os.status).toBe(201);

    const res = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${os.body.id}/status`)
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('OS_SEM_AVANCO_DISPONIVEL');
  });

  it('endpoint /itens-de-orcamento/:id/execucoes — fluxo completo', async () => {
    const { osId, itemId } = await criarOSComItemServico();

    // Avança para AGUARDANDO_APROVACAO via API
    await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/status`)
      .set('Authorization', `Bearer ${atendenteToken}`);

    // Cliente aprova manualmente (no mock)
    const osRow = await ctx.prisma.ordemDeServico.findUnique({ where: { id: osId } });
    if (osRow) osRow.status = 'APROVADA';

    // 1ª chamada — registra inicio + auto-transição para EM_EXECUCAO
    const inicio = await request(app.getHttpServer())
      .post(`/api/itens-de-orcamento/${itemId}/execucoes`)
      .set('Authorization', `Bearer ${mecanicoToken}`);
    expect(inicio.status).toBe(200);
    expect(inicio.body.status).toBe('EM_EXECUCAO');
    expect(inicio.body.execucoes).toHaveLength(1);
    expect(inicio.body.execucoes[0].fim).toBeFalsy();
    expect(inicio.body.execucoes[0].mecanicoId).toBe(mecanico.id);

    // 2ª chamada — registra fim + auto-transição para FINALIZADA
    const fim = await request(app.getHttpServer())
      .post(`/api/itens-de-orcamento/${itemId}/execucoes`)
      .set('Authorization', `Bearer ${mecanicoToken}`);
    expect(fim.status).toBe(200);
    expect(fim.body.status).toBe('FINALIZADA');
    expect(fim.body.execucoes[0].fim).toBeTruthy();

    // 3ª chamada — falha porque já finalizou
    const trd = await request(app.getHttpServer())
      .post(`/api/itens-de-orcamento/${itemId}/execucoes`)
      .set('Authorization', `Bearer ${mecanicoToken}`);
    expect(trd.status).toBe(422);
    expect(trd.body.code).toBe('EXECUCAO_JA_FINALIZADA');

    // FINALIZADA → ENTREGUE via avancar
    const entregue = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/status`)
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(entregue.status).toBe(200);
    expect(entregue.body.status).toBe('ENTREGUE');
  });

  it('endpoint /execucoes recusa item INSUMO com 422', async () => {
    const documento = proximoCpfValido();
    const placa = placas[placaIdx++ % placas.length];
    const cliente = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({
        tipo: 'PF',
        documento,
        nome: 'Cliente Insumo',
        email: `insumo-${documento}@teste.local`,
      });
    const veiculo = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({
        placa,
        marca: 'VW',
        modelo: 'Polo',
        ano: 2023,
        clienteId: cliente.body.id,
      });
    const os = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${atendenteToken}`)
      .send({ clienteId: cliente.body.id, veiculoId: veiculo.body.id });

    const itemId = randomUUID();
    await ctx.prisma.itemOrcamento.upsert({
      where: { id: itemId },
      create: {
        id: itemId,
        ordemDeServicoId: os.body.id,
        tipo: 'INSUMO',
        referenciaId: randomUUID(),
        descricao: 'Filtro',
        quantidade: 1,
        valorUnitario: 30,
        valorTotal: 30,
      },
    });
    const osRow = await ctx.prisma.ordemDeServico.findUnique({ where: { id: os.body.id } });
    if (osRow) osRow.status = 'APROVADA';

    const res = await request(app.getHttpServer())
      .post(`/api/itens-de-orcamento/${itemId}/execucoes`)
      .set('Authorization', `Bearer ${mecanicoToken}`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('EXECUCAO_TIPO_INVALIDO');
  });

  it('endpoint /execucoes recusa atendente com 403', async () => {
    const { itemId } = await criarOSComItemServico();
    const res = await request(app.getHttpServer())
      .post(`/api/itens-de-orcamento/${itemId}/execucoes`)
      .set('Authorization', `Bearer ${atendenteToken}`);
    expect(res.status).toBe(403);
  });

  it('endpoint /status aceita qualquer perfil autenticado', async () => {
    const { osId } = await criarOSComItemServico();
    const res = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/status`)
      .set('Authorization', `Bearer ${mecanicoToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('AGUARDANDO_APROVACAO');
  });
});

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

// Gera CPFs válidos sob demanda — evita depender de strings hardcoded.
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

describe('Fluxo completo da OS: abertura → orçamento → execução → entrega (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let adminToken: string;
  let mecanicoToken: string;
  let servicoId: string;
  let insumoId: string;

  const placas = ['FCA1A23', 'FCB2B34', 'FCC3C45', 'FCD4D56', 'FCE5E67', 'FCF6F78'];
  let placaIdx = 0;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;

    const admin = await seedUser(ctx.prisma, PerfilAcesso.ADMINISTRADOR);
    const mecanico = await seedUser(ctx.prisma, PerfilAcesso.MECANICO);
    adminToken = await login(app, admin);
    mecanicoToken = await login(app, mecanico);

    // Catálogo compartilhado por todos os cenários deste arquivo.
    const servico = await request(app.getHttpServer())
      .post('/api/servicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Troca de óleo', descricao: 'Troca completa', valorPadrao: 100 });
    expect(servico.status).toBe(201);
    servicoId = servico.body.id;

    const insumo = await request(app.getHttpServer())
      .post('/api/insumos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigo: 'INS-OLEO',
        nome: 'Óleo 5W30',
        tipo: 'PECA',
        valorUnitario: 30,
        quantidadeEstoque: 100,
      });
    expect(insumo.status).toBe(201);
    insumoId = insumo.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  async function criarClienteEVeiculo(): Promise<{ clienteId: string; veiculoId: string }> {
    const documento = proximoCpfValido();
    const placa = placas[placaIdx++ % placas.length];
    const cliente = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipo: 'PF',
        documento,
        nome: 'Cliente Fluxo Completo',
        email: `cliente-${documento}@teste.local`,
      });
    expect(cliente.status).toBe(201);

    const veiculo = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ placa, marca: 'Fiat', modelo: 'Strada', ano: 2024, clienteId: cliente.body.id });
    expect(veiculo.status).toBe(201);

    return { clienteId: cliente.body.id, veiculoId: veiculo.body.id };
  }

  it('percorre o ciclo de vida completo e some da listagem após a entrega', async () => {
    const { clienteId, veiculoId } = await criarClienteEVeiculo();

    // 1) Abertura da OS — começa RECEBIDA.
    const abertura = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clienteId, veiculoId, observacoes: 'Cliente relatou barulho na suspensão' });
    expect(abertura.status).toBe(201);
    expect(abertura.body.status).toBe('RECEBIDA');
    const osId: string = abertura.body.id;
    const numero: number = abertura.body.numero;

    // 2) Itens (serviço + insumo) — o primeiro item leva a OS para EM_DIAGNOSTICO.
    const comServico = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/itens`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tipo: 'SERVICO', servicoId, quantidade: 1 });
    expect(comServico.status).toBe(201);
    expect(comServico.body.status).toBe('EM_DIAGNOSTICO');

    const comInsumo = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/itens`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tipo: 'INSUMO', insumoId, quantidade: 2 });
    expect(comInsumo.status).toBe(201);
    expect(comInsumo.body.status).toBe('EM_DIAGNOSTICO');
    expect(comInsumo.body.itensOrcamento).toHaveLength(2);
    expect(comInsumo.body.valorEstimado).toBe(160); // 100 (serviço) + 2 × 30 (insumo)

    const itemServico = comInsumo.body.itensOrcamento.find((i: any) => i.tipo === 'SERVICO');
    expect(itemServico).toBeTruthy();

    // 3) Avança para AGUARDANDO_APROVACAO — o evento gera token + dispara email.
    const aguardando = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/status`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(aguardando.status).toBe(200);
    expect(aguardando.body.status).toBe('AGUARDANDO_APROVACAO');

    // O cliente receberia o token por email; aqui o lemos da persistência —
    // sua existência comprova que o handler de OrcamentoEnviado executou.
    const tokenRecord = await ctx.prisma.orcamentoToken.findFirst({
      where: { ordemDeServicoId: osId },
    });
    expect(tokenRecord).toBeTruthy();
    const token: string = tokenRecord.token;

    // 4) Consulta pública do orçamento com o token (rota aberta).
    const orcamento = await request(app.getHttpServer())
      .get(`/api/publico/os/${numero}/orcamento`)
      .query({ token });
    expect(orcamento.status).toBe(200);
    expect(orcamento.body.numero).toBe(numero);
    expect(orcamento.body.status).toBe('AGUARDANDO_APROVACAO');
    expect(orcamento.body.valorEstimado).toBe(160);
    expect(orcamento.body.itens).toHaveLength(2);

    // 5) Decisão pública: APROVADA → status APROVADA, token é consumido.
    const decisao = await request(app.getHttpServer())
      .post(`/api/publico/os/${numero}/orcamento/decisao`)
      .send({ token, decisao: 'APROVADA' });
    expect(decisao.status).toBe(201);
    expect(decisao.body.status).toBe('APROVADA');

    // Token de uso único: a segunda tentativa é rejeitada (401).
    const reuso = await request(app.getHttpServer())
      .post(`/api/publico/os/${numero}/orcamento/decisao`)
      .send({ token, decisao: 'APROVADA' });
    expect(reuso.status).toBe(401);

    // 6) Execução do item de serviço: início (EM_EXECUCAO) e fim (FINALIZADA).
    const inicio = await request(app.getHttpServer())
      .post(`/api/itens-de-orcamento/${itemServico.id}/execucoes`)
      .set('Authorization', `Bearer ${mecanicoToken}`);
    expect(inicio.status).toBe(200);
    expect(inicio.body.status).toBe('EM_EXECUCAO');

    const fim = await request(app.getHttpServer())
      .post(`/api/itens-de-orcamento/${itemServico.id}/execucoes`)
      .set('Authorization', `Bearer ${mecanicoToken}`);
    expect(fim.status).toBe(200);
    expect(fim.body.status).toBe('FINALIZADA');

    // 7) Entrega: FINALIZADA → ENTREGUE.
    const entregue = await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osId}/status`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(entregue.status).toBe(200);
    expect(entregue.body.status).toBe('ENTREGUE');

    // 8) A OS entregue some da listagem operacional (exclusão lógica).
    const lista = await request(app.getHttpServer())
      .get('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(lista.status).toBe(200);
    expect(lista.body.map((os: any) => os.id)).not.toContain(osId);
  });

  it('ordena a listagem por status e exclui Finalizada/Entregue', async () => {
    // Cria três OS em estados distintos para validar a ordenação fixa.
    const recebida = await criarClienteEVeiculo();
    const osRecebida = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(recebida);
    expect(osRecebida.status).toBe(201);

    const diagnostico = await criarClienteEVeiculo();
    const osDiagnostico = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(diagnostico);
    await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osDiagnostico.body.id}/itens`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tipo: 'SERVICO', servicoId, quantidade: 1 });

    const aprovacao = await criarClienteEVeiculo();
    const osAprovacao = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(aprovacao);
    await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osAprovacao.body.id}/itens`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tipo: 'SERVICO', servicoId, quantidade: 1 });
    await request(app.getHttpServer())
      .post(`/api/ordens-de-servico/${osAprovacao.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`);

    const lista = await request(app.getHttpServer())
      .get('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(lista.status).toBe(200);

    const ids: string[] = lista.body.map((os: any) => os.id);
    const posAprovacao = ids.indexOf(osAprovacao.body.id);
    const posDiagnostico = ids.indexOf(osDiagnostico.body.id);
    const posRecebida = ids.indexOf(osRecebida.body.id);

    // Todas presentes (nenhuma oculta) e na ordem de peso:
    // AGUARDANDO_APROVACAO < EM_DIAGNOSTICO < RECEBIDA.
    expect(posAprovacao).toBeGreaterThanOrEqual(0);
    expect(posDiagnostico).toBeGreaterThanOrEqual(0);
    expect(posRecebida).toBeGreaterThanOrEqual(0);
    expect(posAprovacao).toBeLessThan(posDiagnostico);
    expect(posDiagnostico).toBeLessThan(posRecebida);
  });
});

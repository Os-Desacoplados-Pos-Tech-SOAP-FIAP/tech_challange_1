import { INestApplication } from '@nestjs/common';
import { PerfilAcesso } from '@prisma/client';
import request from 'supertest';

import { createTestApp, TestContext } from '../helpers/setup';

describe('OrdemDeServico (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;

    await request(app.getHttpServer()).post('/api/auth/registrar').send({
      nome: 'Atendente Teste',
      email: 'atendente@teste.local',
      senha: 'senha123',
      perfil: PerfilAcesso.ATENDENTE,
    });

    const login = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'atendente@teste.local',
      senha: 'senha123',
    });
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('fluxo completo: cadastra cliente, veículo e cria OS', async () => {
    const cliente = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'PF',
        cpfCnpj: '52998224725',
        nome: 'Cliente E2E',
        email: 'cliente@e2e.local',
      });
    expect(cliente.status).toBe(201);

    const veiculo = await request(app.getHttpServer())
      .post('/api/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: 'ABC1D23',
        marca: 'VW',
        modelo: 'Gol',
        ano: 2022,
        clienteId: cliente.body.id,
      });
    expect(veiculo.status).toBe(201);

    const os = await request(app.getHttpServer())
      .post('/api/ordens-de-servico')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteId: cliente.body.id,
        veiculoId: veiculo.body.id,
        observacoes: 'Barulho no motor',
      });
    expect(os.status).toBe(201);
    expect(os.body.status).toBe('RECEBIDA');
    expect(os.body.numero).toBe(1);
  });

  it('rejeita CPF inválido com 422', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'PF',
        cpfCnpj: '11111111111',
        nome: 'Invalido',
        email: 'invalido@teste.local',
      });
    expect(res.status).toBe(422);
  });
});

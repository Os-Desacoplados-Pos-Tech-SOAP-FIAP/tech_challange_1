import { INestApplication } from '@nestjs/common';
import { PerfilAcesso } from '@prisma/client';
import request from 'supertest';

import { createTestApp, TestContext } from '../helpers/setup';

describe('Auth (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra primeiro usuário (público) e faz login', async () => {
    const registrar = await request(app.getHttpServer())
      .post('/api/auth/registrar')
      .send({
        nome: 'Admin Teste',
        email: 'admin@teste.local',
        senha: 'senha123',
        perfil: PerfilAcesso.ADMINISTRADOR,
      });
    expect(registrar.status).toBe(201);
    expect(registrar.body.email).toBe('admin@teste.local');

    const login = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'admin@teste.local',
      senha: 'senha123',
    });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeDefined();
    expect(login.body.usuario.perfil).toBe(PerfilAcesso.ADMINISTRADOR);
  });

  it('retorna 401 em login com credenciais inválidas', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'naoexiste@teste.local',
      senha: 'errada',
    });
    expect(res.status).toBe(401);
  });

  it('rota protegida sem token retorna 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/clientes');
    expect(res.status).toBe(401);
  });
});

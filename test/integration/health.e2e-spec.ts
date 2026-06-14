import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp, TestContext } from '../helpers/setup';

describe('Health (e2e)', () => {
  let ctx: TestContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health responde 200 sem token', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

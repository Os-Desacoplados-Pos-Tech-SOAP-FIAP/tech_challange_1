import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { DomainExceptionFilter } from '../../src/common/filters/domain-exception.filter';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';
import { createPrismaMock } from './prisma-mock';

export interface TestContext {
  app: INestApplication;
  prisma: ReturnType<typeof createPrismaMock>;
}

export async function createTestApp(): Promise<TestContext> {
  const prisma = createPrismaMock();
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(), new DomainExceptionFilter());
  await app.init();
  return { app, prisma };
}

// OTel precisa ser carregado antes de qualquer módulo instrumentado.
import './tracing';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap(): Promise<void> {
  // bufferLogs: segura os logs do boot até o logger pino assumir.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

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

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Oficina Mecânica API')
    .setDescription('Sistema de Gestão de Oficina Mecânica — MVP')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
  app.get(Logger).log(`Oficina API rodando em http://localhost:${port}/api`);
}

bootstrap();

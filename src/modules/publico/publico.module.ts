import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { ConsultarOrcamentoPublicoUseCase } from '../../application/ordem-de-servico/consultar-orcamento-publico/ConsultarOrcamentoPublicoUseCase';
import { ConsultarOSUseCase } from '../../application/ordem-de-servico/consultar-os/ConsultarOSUseCase';
import { DecidirOrcamentoUseCase } from '../../application/ordem-de-servico/decidir-orcamento/DecidirOrcamentoUseCase';
import { ClienteJwtGuard } from '../../common/guards/cliente-jwt.guard';
import { PublicoController } from './publico.controller';

@Module({
  imports: [
    // Valida o JWT de escopo CLIENTE emitido pela lambda de auth por CPF.
    // Mesmo secret (e mesmo fallback) usados pela JwtStrategy dos funcionários.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'default-secret',
      }),
    }),
  ],
  controllers: [PublicoController],
  providers: [
    ConsultarOSUseCase,
    DecidirOrcamentoUseCase,
    ConsultarOrcamentoPublicoUseCase,
    ClienteJwtGuard,
  ],
})
export class PublicoModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { RolesGuard } from './common/guards/roles.guard';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { OrdemDeServicoModule } from './modules/ordem-de-servico/ordem-de-servico.module';
import { PecaInsumoModule } from './modules/peca-insumo/peca-insumo.module';
import { PublicoModule } from './modules/publico/publico.module';
import { ServicoModule } from './modules/servico/servico.module';
import { VeiculoModule } from './modules/veiculo/veiculo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InfrastructureModule,
    AuthModule,
    ClienteModule,
    VeiculoModule,
    ServicoModule,
    PecaInsumoModule,
    OrdemDeServicoModule,
    PublicoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

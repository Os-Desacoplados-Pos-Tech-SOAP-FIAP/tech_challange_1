import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { RolesGuard } from './common/guards/roles.guard';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { EventsModule } from './infrastructure/events/events.module';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { HealthModule } from './modules/health/health.module';
import { OrdemDeServicoModule } from './modules/ordem-de-servico/ordem-de-servico.module';
import { InsumoModule } from './modules/insumo/insumo.module';
import { PublicoModule } from './modules/publico/publico.module';
import { ServicoModule } from './modules/servico/servico.module';
import { VeiculoModule } from './modules/veiculo/veiculo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventsModule,
    InfrastructureModule,
    HealthModule,
    AuthModule,
    ClienteModule,
    VeiculoModule,
    ServicoModule,
    InsumoModule,
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

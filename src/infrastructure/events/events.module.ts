import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { EventDispatcher } from './EventDispatcher';
import { BaixarEstoqueAoFinalizarHandler } from './handlers/BaixarEstoqueAoFinalizarHandler';
import { GerarTokenOrcamentoHandler } from './handlers/GerarTokenOrcamentoHandler';
import { LiberarReservasAoReprovarHandler } from './handlers/LiberarReservasAoReprovarHandler';
import { LogDomainEventHandler } from './LogDomainEventHandler';
import { PendingEventsRegistry } from './PendingEventsRegistry';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    EventDispatcher,
    LogDomainEventHandler,
    PendingEventsRegistry,
    BaixarEstoqueAoFinalizarHandler,
    LiberarReservasAoReprovarHandler,
    GerarTokenOrcamentoHandler,
  ],
  exports: [EventDispatcher, PendingEventsRegistry],
})
export class EventsModule {}

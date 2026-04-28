import { Injectable, Logger } from '@nestjs/common';

import { DomainEvent } from '../../domain/shared/DomainEvent';
import { EVENTS } from '../../domain/shared/events/EventNames';
import { OnDomainEvent } from './OnDomainEvent.decorator';

@Injectable()
export class LogDomainEventHandler {
  private readonly logger = new Logger('DomainEvents');

  @OnDomainEvent(EVENTS.OS_CRIADA)
  onOsCriada(event: DomainEvent): void {
    this.log(event);
  }

  @OnDomainEvent(EVENTS.OS_ORCAMENTO_APROVADO)
  onOsAprovada(event: DomainEvent): void {
    this.log(event);
  }

  @OnDomainEvent(EVENTS.OS_ORCAMENTO_RECUSADO)
  onOsReprovada(event: DomainEvent): void {
    this.log(event);
  }

  @OnDomainEvent(EVENTS.OS_FINALIZADA)
  onOsFinalizada(event: DomainEvent): void {
    this.log(event);
  }

  @OnDomainEvent(EVENTS.OS_ENTREGUE)
  onOsEntregue(event: DomainEvent): void {
    this.log(event);
  }

  @OnDomainEvent(EVENTS.ESTOQUE_BAIXADO)
  onEstoqueBaixado(event: DomainEvent): void {
    this.log(event);
  }

  @OnDomainEvent(EVENTS.ESTOQUE_RESERVADO)
  onEstoqueReservado(event: DomainEvent): void {
    this.log(event);
  }

  @OnDomainEvent(EVENTS.ESTOQUE_RESERVA_LIBERADA)
  onEstoqueLiberado(event: DomainEvent): void {
    this.log(event);
  }

  private log(event: DomainEvent): void {
    this.logger.log(
      `[${event.eventName}] id=${event.eventId} aggregate=${event.aggregateId.toValue()} @ ${event.ocorridoEm.toISOString()}`,
    );
  }
}

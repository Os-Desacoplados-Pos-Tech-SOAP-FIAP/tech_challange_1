import { BaseDomainEvent } from '../../shared/DomainEvent';
import { EVENTS } from '../../shared/events/EventNames';
import { UniqueID } from '../../shared/UniqueID';

export class OrcamentoRecusado extends BaseDomainEvent {
  constructor(
    aggregateId: UniqueID,
    public readonly motivo: 'TOTAL',
  ) {
    super(aggregateId, EVENTS.OS_ORCAMENTO_RECUSADO, 'OrcamentoRecusado');
  }
}

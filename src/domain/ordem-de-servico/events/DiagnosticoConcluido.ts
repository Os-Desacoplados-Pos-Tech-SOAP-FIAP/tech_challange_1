import { BaseDomainEvent } from '../../shared/DomainEvent';
import { EVENTS } from '../../shared/events/EventNames';
import { UniqueID } from '../../shared/UniqueID';

export class DiagnosticoConcluido extends BaseDomainEvent {
  constructor(aggregateId: UniqueID) {
    super(aggregateId, EVENTS.OS_DIAGNOSTICO_CONCLUIDO, 'DiagnosticoConcluido');
  }
}

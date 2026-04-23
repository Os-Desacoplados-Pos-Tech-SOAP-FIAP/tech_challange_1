import { BaseDomainEvent } from '../../shared/DomainEvent';
import { EVENTS } from '../../shared/events/EventNames';
import { UniqueID } from '../../shared/UniqueID';

export class ServicoExecutado extends BaseDomainEvent {
  constructor(
    aggregateId: UniqueID,
    public readonly execucaoId: UniqueID,
  ) {
    super(aggregateId, EVENTS.OS_SERVICO_EXECUTADO, 'ServicoExecutado');
  }
}

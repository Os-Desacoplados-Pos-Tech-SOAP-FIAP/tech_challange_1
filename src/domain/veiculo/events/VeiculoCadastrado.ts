import { BaseDomainEvent } from '../../shared/DomainEvent';
import { EVENTS } from '../../shared/events/EventNames';
import { UniqueID } from '../../shared/UniqueID';

export class VeiculoCadastrado extends BaseDomainEvent {
  constructor(aggregateId: UniqueID) {
    super(aggregateId, EVENTS.VEICULO_CADASTRADO, 'VeiculoCadastrado');
  }
}

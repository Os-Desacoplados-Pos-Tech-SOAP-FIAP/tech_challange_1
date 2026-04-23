import { BaseDomainEvent } from '../../shared/DomainEvent';
import { EVENTS } from '../../shared/events/EventNames';
import { UniqueID } from '../../shared/UniqueID';

export class OSFinalizada extends BaseDomainEvent {
  constructor(aggregateId: UniqueID) {
    super(aggregateId, EVENTS.OS_FINALIZADA, 'OSFinalizada');
  }
}

import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class OSCriada implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'OSCriada';
  constructor(public readonly aggregateId: UniqueID) {
    this.ocorridoEm = new Date();
  }
}

import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class OSFinalizada implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'OSFinalizada';
  constructor(public readonly aggregateId: UniqueID) {
    this.ocorridoEm = new Date();
  }
}

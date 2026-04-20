import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class OSEntregue implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'OSEntregue';
  constructor(public readonly aggregateId: UniqueID) {
    this.ocorridoEm = new Date();
  }
}

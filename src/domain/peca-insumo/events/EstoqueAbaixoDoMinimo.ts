import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class EstoqueAbaixoDoMinimo implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'EstoqueAbaixoDoMinimo';

  constructor(public readonly aggregateId: UniqueID) {
    this.ocorridoEm = new Date();
  }
}

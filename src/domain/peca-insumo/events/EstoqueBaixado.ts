import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class EstoqueBaixado implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'EstoqueBaixado';

  constructor(
    public readonly aggregateId: UniqueID,
    public readonly quantidade: number,
  ) {
    this.ocorridoEm = new Date();
  }
}

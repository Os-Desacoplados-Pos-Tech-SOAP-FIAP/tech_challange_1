import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class OrcamentoAprovado implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'OrcamentoAprovado';
  constructor(public readonly aggregateId: UniqueID) {
    this.ocorridoEm = new Date();
  }
}

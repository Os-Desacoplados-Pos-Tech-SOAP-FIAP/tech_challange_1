import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class OrcamentoEnviado implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'OrcamentoEnviado';
  constructor(public readonly aggregateId: UniqueID) {
    this.ocorridoEm = new Date();
  }
}

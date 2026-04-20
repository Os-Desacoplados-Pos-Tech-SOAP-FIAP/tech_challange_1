import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class OrcamentoRecusado implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'OrcamentoRecusado';
  constructor(
    public readonly aggregateId: UniqueID,
    public readonly motivo: 'TOTAL' | 'PARCIAL',
  ) {
    this.ocorridoEm = new Date();
  }
}

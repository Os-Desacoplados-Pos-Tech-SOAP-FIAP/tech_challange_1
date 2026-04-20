import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class ServicoExecutado implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'ServicoExecutado';
  constructor(
    public readonly aggregateId: UniqueID,
    public readonly execucaoId: UniqueID,
  ) {
    this.ocorridoEm = new Date();
  }
}

import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class ClienteCadastrado implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'ClienteCadastrado';

  constructor(public readonly aggregateId: UniqueID) {
    this.ocorridoEm = new Date();
  }
}

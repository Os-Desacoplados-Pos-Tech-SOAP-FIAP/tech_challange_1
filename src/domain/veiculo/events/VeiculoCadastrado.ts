import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class VeiculoCadastrado implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'VeiculoCadastrado';

  constructor(public readonly aggregateId: UniqueID) {
    this.ocorridoEm = new Date();
  }
}

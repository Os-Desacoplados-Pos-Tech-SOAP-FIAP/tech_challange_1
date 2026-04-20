import { DomainEvent } from '../../shared/DomainEvent';
import { UniqueID } from '../../shared/UniqueID';

export class DiagnosticoConcluido implements DomainEvent {
  public readonly ocorridoEm: Date;
  public readonly eventName = 'DiagnosticoConcluido';
  constructor(public readonly aggregateId: UniqueID) {
    this.ocorridoEm = new Date();
  }
}

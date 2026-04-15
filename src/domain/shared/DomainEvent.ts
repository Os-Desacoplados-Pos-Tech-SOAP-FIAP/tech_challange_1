import { UniqueID } from './UniqueID';

export interface DomainEvent {
  readonly ocorridoEm: Date;
  readonly aggregateId: UniqueID;
  readonly eventName: string;
}

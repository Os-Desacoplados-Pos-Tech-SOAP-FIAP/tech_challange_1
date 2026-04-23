import { Injectable } from '@nestjs/common';

import { AggregateRoot } from '../../domain/shared/AggregateRoot';
import { EntityProps } from '../../domain/shared/Entity';

@Injectable()
export class PendingEventsRegistry {
  private readonly tracked = new Set<AggregateRoot<EntityProps>>();

  public track(aggregate: AggregateRoot<EntityProps>): void {
    this.tracked.add(aggregate);
  }

  public drain() {
    const events = [] as ReturnType<AggregateRoot<EntityProps>['pullEvents']>;
    for (const aggregate of this.tracked) {
      events.push(...aggregate.pullEvents());
    }
    this.tracked.clear();
    return events;
  }
}

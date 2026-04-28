import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';

import { DomainEvent } from '../../domain/shared/DomainEvent';
import { EVENT_HANDLER_METADATA } from './OnDomainEvent.decorator';

type Handler = (event: DomainEvent) => Promise<void> | void;

@Injectable()
export class EventDispatcher implements OnModuleInit {
  private readonly logger = new Logger(EventDispatcher.name);
  private readonly handlers = new Map<symbol, Handler[]>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onModuleInit(): void {
    const providers = this.discovery.getProviders();
    for (const wrapper of providers) {
      const instance = wrapper.instance;
      if (!instance || typeof instance !== 'object') continue;
      const prototype = Object.getPrototypeOf(instance);
      if (!prototype) continue;
      this.metadataScanner.getAllMethodNames(prototype).forEach((methodName: string) => {
        const meta: symbol | undefined = Reflect.getMetadata(
          EVENT_HANDLER_METADATA,
          instance,
          methodName,
        );
        if (meta) {
          const bound = (instance as Record<string, Function>)[methodName].bind(instance);
          this.register(meta, bound as Handler);
        }
      });
    }
  }

  public register(eventName: symbol, handler: Handler): void {
    const list = this.handlers.get(eventName) ?? [];
    list.push(handler);
    this.handlers.set(eventName, list);
  }

  public async publish(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      const list = this.handlers.get(event.name) ?? [];
      for (const handler of list) {
        try {
          await handler(event);
        } catch (err) {
          this.logger.error(
            `Handler falhou para evento ${event.eventName} (id=${event.eventId}): ${
              (err as Error).message
            }`,
          );
        }
      }
    }
  }
}

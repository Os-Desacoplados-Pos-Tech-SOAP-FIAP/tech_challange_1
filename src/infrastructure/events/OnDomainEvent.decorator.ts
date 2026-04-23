export const EVENT_HANDLER_METADATA = Symbol('domain-event-handler');

export function OnDomainEvent(eventName: symbol): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, eventName, target, propertyKey);
  };
}

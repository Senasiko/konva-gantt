import { computed } from 'vue';

export interface GanttEvent<T extends (...args: any[]) => void = () => void> {
  on: (cb: T) => void;
  off: (cb: T) => void;
  trigger: (...args: Parameters<T>) => void;
}

export function GanttEventDecorator() {
  // @ts-ignore
  return (target: any, propertyKey: string) => {
    const symbol = Symbol(propertyKey);
    Reflect.defineProperty(target, propertyKey, {
      get() {
        if (this[symbol] === undefined) {
          const listeners = new Set<(...args: unknown[]) => void>();
          this[symbol] = {
            on(a: any) {
              listeners.add(a);
            },
            trigger(...args: unknown[]) {
              listeners.forEach((listener) => listener(...args));
            },
            off(a: any) {
              listeners.delete(a);
            },
          };
        }
        return this[symbol];
      },
    })!;
  };
}

export function ComputedGet() {
  return (__: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const symbol = Symbol(propertyKey);
    const origin = descriptor.get;

    descriptor.get = function com() {
      if ((this as any)[symbol] === undefined) {
        (this as any)[symbol] = computed(() => origin!.call(this));
      }
      return (this as any)[symbol].value;
    };
  };
}

export * from './store';

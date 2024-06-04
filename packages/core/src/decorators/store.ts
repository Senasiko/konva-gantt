import type {
  StateTree, StoreDefinition, _ActionsTree, _GettersTree,
} from 'pinia';
import { watchEffect } from 'vue';
import type { IStoreSubscribable } from '../interfaces';

const symbol = Symbol('disposable');

type StoreWatchMap = Map<string, Function>;

export function GanttEffectComponent<D extends StateTree, G extends _GettersTree<D>, A extends _ActionsTree>(useStore: StoreDefinition<any, D, G, A>) {
  return function Factory<C extends new(...args: any[]) => IStoreSubscribable<D>>(OriginConstructor: C) {
    return class extends OriginConstructor {
      constructor(...args: any[]) {
        super(...args);

        const stops: StoreWatchMap = new Map();
        // define store subscribe
        Reflect.defineProperty(this, symbol, {
          get() {
            return stops;
          },
        });

        Reflect.defineProperty(this, 'store', {
          value: useStore(),
        });

        // remove callback
        const unmount = Reflect.get(this, 'unmount');
        const proxy = (...unmountArgs: unknown[]) => {
          stops.forEach((s) => {
            s();
          });
          unmount.apply(this, unmountArgs);
        };
        Reflect.defineProperty(this, 'unmount', {
          get() {
            return proxy;
          },
        });
      }
    };
  };
}

export function GanttEffectUpdate() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originFn = Reflect.get(target, propertyKey);

    function run(this: any, ...args: any[]) {
      const stops = Reflect.get(this, symbol) as StoreWatchMap;
      const lastStop = stops.get(propertyKey);
      lastStop?.();
      stops.delete(propertyKey);
      const stop = watchEffect(() => originFn.apply(this, args));
      stops.set(propertyKey, stop);
    }

    descriptor.value = run;
  };
}

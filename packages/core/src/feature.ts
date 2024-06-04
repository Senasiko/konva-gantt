import type { IAssembleInputFactory, IAssembledComponent } from './interfaces';
import type { GanttStore } from './store';
import { useStore } from './store';

type SetResolver<T> = T extends Set<infer S> ? S : never;

export function useHook<T extends keyof GanttStore['hooks']>(key: T, fn: SetResolver<GanttStore['hooks'][T]>) {
  const store = useStore();
  store.hooks[key].add(fn as any);
}

export function useAssembleInput<T extends IAssembledComponent>(name: string, input: IAssembleInputFactory<T>) {
  const store = useStore();
  if (!store.assembleInputFactories.has(name)) {
    store.assembleInputFactories.set(name, []);
  }
  store.assembleInputFactories.get(name)?.push(input);
}

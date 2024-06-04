import type { IAssembledComponent, IAssembleInput, IAssembleInputFactory } from '../interfaces';
import { useStore } from '../store';

export function createAssemblePipeline<T extends IAssembledComponent>(name: string, instance: T) {
  const store = useStore();
  const inputFactories = store.assembleInputFactories.get(name) as IAssembleInputFactory<T>[];
  const inputs = inputFactories?.map((inputFactory) => inputFactory(instance));
  return {
    mount: (...args: unknown[]) => { inputs?.forEach((input) => input.mount(...args)); },
    unmount: (...args: unknown[]) => { inputs?.forEach((input) => input.unmount(...args)); },
    update: (...args: unknown[]) => { inputs?.forEach((input) => input.update(...args)); },
  } as IAssembleInput<T>;
}

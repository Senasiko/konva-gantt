import type { StateTree, Store } from 'pinia';

export interface IStoreSubscribable<D extends StateTree> {
  store: Store<any, D>;
  mount(...args: unknown[]): void;
  unmount(...args: unknown[]): void;
}

export interface IGanttComponent {
  mount(...args: unknown[]): void;
  unmount(...args: unknown[]): void;
  update(...args: unknown[]): void;
}

export interface IAssembledComponent extends IGanttComponent {
  pipeline: IGanttComponent;
}

export type IAssembleInput<T extends IAssembledComponent> = T extends { pipeline: infer P } ? P : never;

export type IAssembleInputFactory<T extends IAssembledComponent> = (instance: T) => IAssembleInput<T>;

export * from './data';

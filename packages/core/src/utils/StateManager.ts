import _ from 'lodash';
import type { Ref } from 'vue';
import { ref } from 'vue';

export type CurrentState<S> = { id: number; from: S | undefined, to: S };

export class StateManager<S> {
  private static id = 1;

  private _prevState?: CurrentState<S>;

  private _activeState: Ref<CurrentState<S>>;

  get activeState() {
    return this._activeState.value.to;
  }

  constructor(defaultState: S) {
    this._activeState = ref({
      from: undefined,
      to: defaultState,
    }) as Ref<CurrentState<S>>;
  }

  to(from: S | S[] | undefined, to: S, canRevoke: boolean = true): CurrentState<S> | undefined {
    const { activeState } = this;
    if (from === undefined || _.castArray(from).includes(this.activeState)) {
      this._prevState = canRevoke ? _.clone(this._activeState.value) : undefined;
      this._activeState.value = {
        id: ++StateManager.id,
        from: activeState,
        to,
      };
      this.trigger();
    } else {
      return undefined;
    }
    return this._activeState.value;
  }

  revoke(state: CurrentState<S> | undefined): boolean {
    if (state === undefined) {
      return false;
    }
    if (this._activeState.value.id === state.id && this._prevState) {
      this._activeState.value = this._prevState;
      this.trigger();
    }
    return true;
  }

  validate(state: CurrentState<S> | undefined): boolean {
    if (state === undefined) {
      return false;
    }
    return this._activeState.value.id === state.id;
  }

  listeners: Map<S, Set<() => void>> = new Map();

  on(state: S, cb: () => void) {
    if (!this.listeners.has(state)) {
      this.listeners.set(state, new Set());
    }
    this.listeners.get(state)!.add(cb);
  }

  private trigger() {
    if (this.listeners.has(this.activeState)) {
      this.listeners.get(this.activeState)!.forEach((cb) => cb());
    }
  }
}

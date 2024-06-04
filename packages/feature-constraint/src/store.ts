import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ConstraintMode = 'start' | 'end';
export type ConstraintItem = `${string}-${'start' | 'end'}`;

function splitConstraintItem(item: ConstraintItem) {
  const result = item.match(/(.+)-(.+)?$/)!;
  return [result[1], result[2]] as [string, ConstraintMode];
}

export const useConstraintStore = defineStore('constraint', () => {
  // state
  const constrainMap = ref(new Map<ConstraintItem, Set<ConstraintItem>>());
  const constrainedMap = ref(new Map<ConstraintItem, Set<ConstraintItem>>());

  // getters
  const hasConstrain = (item: string) => constrainMap.value.has(`${item}-start`) || constrainMap.value.has(`${item}-end`);
  const hasConstrained = (item: string) => constrainedMap.value.has(`${item}-start`) || constrainedMap.value.has(`${item}-end`);
  const getConstrain = (item: ConstraintItem) => constrainedMap.value.get(item);
  const getConstrained = (item: ConstraintItem) => constrainMap.value.get(item);
  const getMode = (item: ConstraintItem) => splitConstraintItem(item)[1] as ConstraintMode;
  const getKey = (item: ConstraintItem) => splitConstraintItem(item)[0];

  function addConstraint(constrainItem: ConstraintItem, constrainedItem: ConstraintItem) {
    if (!constrainMap.value.has(constrainItem)) {
      constrainMap.value.set(constrainItem, new Set());
    }
    if (!constrainedMap.value.has(constrainedItem)) {
      constrainedMap.value.set(constrainedItem, new Set());
    }
    constrainMap.value.get(constrainItem)!.add(constrainedItem);
    constrainedMap.value.get(constrainedItem)!.add(constrainItem);
  }

  function validateConstraint(constrainItem: ConstraintItem, constrainedItem: ConstraintItem) {
    const constrainKey = getKey(constrainItem);
    const constrainedKey = getKey(constrainedItem);
    const items = [`${constrainKey}-start`, `${constrainKey}-end`, `${constrainedKey}-start`, `${constrainedKey}-end`] as const;

    for (const item of items) {
      for (const otherItem of items) {
        if (item !== otherItem) {
          if (((constrainMap.value.get(item)?.has(otherItem)) ?? false) || ((constrainedMap.value.get(item)?.has(otherItem)) ?? false)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  return {
    constrainMap,
    constrainedMap,

    hasConstrain,
    hasConstrained,
    getConstrain,
    getConstrained,
    getMode,
    getKey,

    addConstraint,
    validateConstraint,
  };
});

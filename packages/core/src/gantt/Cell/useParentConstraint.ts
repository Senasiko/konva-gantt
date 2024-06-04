import { computed } from 'vue';
import type { GanttCell } from '.';
import { GanttCellParentConstraint } from '../CellParentConstraint';

export function useParentConstraint(cellGantt: GanttCell) {
  const startConstraint = new GanttCellParentConstraint(cellGantt.key, 'start');
  const endConstraint = new GanttCellParentConstraint(cellGantt.key, 'end');

  const hasParentConstraint = computed(() => cellGantt.store.blockTree[cellGantt.block.key]?.length > 0);

  return {
    update() {
      if (hasParentConstraint.value) {
        startConstraint.mount(cellGantt.wrapperNode);
        endConstraint.mount(cellGantt.wrapperNode);

        startConstraint.update(cellGantt.state.activeState === 'hovering');
        endConstraint.update(cellGantt.state.activeState === 'hovering');
      } else {
        startConstraint.unmount();
        endConstraint.unmount();
      }
    },
  };
}

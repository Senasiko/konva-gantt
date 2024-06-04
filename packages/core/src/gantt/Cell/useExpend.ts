import type Konva from 'konva';
import { reactive } from 'vue';
import type { GanttCell, CellCurrentState } from '.';
import { GanttCellExpend } from '../CellExpend';

export function useExpend(cellGantt: GanttCell) {
  const expends = {
    left: new GanttCellExpend({ direction: 'left' }),
    right: new GanttCellExpend({ direction: 'right' }),
  };

  const expendState = reactive({
    left: 0,
    right: 0,
  });

  let state: CellCurrentState;

  function dragStart() {
    state = cellGantt.state.to(['normal', 'hovering'], 'expending');
    if (state === undefined) return;
    expendState.left = 0;
    expendState.right = 0;
    cellGantt.update();
  }

  function dragExpend(direction: 'left' | 'right', dx: number) {
    if (!cellGantt.state.validate(state)) return;
    if (direction === 'left') {
      expendState.left += dx;
    } else {
      expendState.right += dx;
    }
    cellGantt.update();
  }

  function dragEnd() {
    const currentState = {
      left: cellGantt.cellPosition.x,
      right: cellGantt.cellPosition.x + cellGantt.cellWidth,
    };
    const r = cellGantt.state.revoke(state);
    if (!r) return;
    state = undefined;
    expendState.left = 0;
    expendState.right = 0;

    const startDate = cellGantt.store.getDateByX(currentState.left);

    cellGantt.store.changeBlockTime(cellGantt.key, startDate.format('YYYY-MM-DD'), cellGantt.block.endTime!);

    const originPosition = cellGantt.store.interactionModule.getCellGantt(cellGantt.key)?.cellPosition;
    if (originPosition === undefined) return;
    if (currentState.right !== originPosition.x + cellGantt.cellWidth) {
      const endDate = cellGantt.store.getDateByX(currentState.right - 1);
      cellGantt.store.changeBlockTime(cellGantt.key, cellGantt.block.startTime!, endDate.format('YYYY-MM-DD'));
    }
    cellGantt.update();
  }

  expends.left.draStartEvent.on(dragStart);
  expends.left.dragEvent.on(dragExpend);
  expends.left.dragEndEvent.on(dragEnd);

  expends.right.draStartEvent.on(dragStart);
  expends.right.dragEvent.on(dragExpend);
  expends.right.dragEndEvent.on(dragEnd);

  cellGantt.wrapperNode.on('mouseenter', () => {
    expends.left.show();
    expends.right.show();
  });
  cellGantt.wrapperNode.on('mouseleave', () => {
    expends.left.hide();
    expends.right.hide();
  });

  return {
    update() {
      expends.left.update();
      expends.right.update();
    },
    mount(parentNode: Konva.Group) {
      expends.left.mount(parentNode);
      expends.right.mount(parentNode);
    },
    state: expendState,
  };
}

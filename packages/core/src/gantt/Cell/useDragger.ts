import Konva from 'konva';
import dayjs from 'dayjs';
import { reactive } from 'vue';
import type { GanttCell, CellCurrentState } from '.';
import { useStore } from '../../store';

export function useDragger(cellGantt: GanttCell) {
  const store = useStore();
  const lineParent = cellGantt.rootContainer.constraintContainerNode;
  const lineNode = new Konva.Rect({
    x: 0,
    y: 0,
    width: lineParent.width(),
    height: 1,
    fill: store.colorStyles.Primary,
  });

  const dragState = reactive({
    x: 0,
    y: 0,
  });
  let state: CellCurrentState | undefined;
  cellGantt.wrapperNode.on('dragstart', () => {
    dragState.x = 0;
    dragState.y = 0;
    state = cellGantt.state.to(['hovering', 'normal'], 'dragging');
  });
  cellGantt.wrapperNode.on('dragmove', (e) => {
    if (!cellGantt.state.validate(state)) return;
    dragState.x += e.evt.movementX;
    dragState.y += e.evt.movementY;
    const targetBlock = cellGantt.store.interactionModule.getIntersectionBlockNode(lineParent!.getRelativePointerPosition()!);
    if (targetBlock && targetBlock?.block.key !== cellGantt.block.key) {
      lineNode.y(targetBlock.wrapperNode.y() + targetBlock.wrapperNode.height());
      lineNode.width(lineParent.width());
      lineParent.add(lineNode);
    } else {
      lineNode.remove();
    }
  });
  cellGantt.wrapperNode.on('dragend', () => {
    if (!cellGantt.state.validate(state)) return;
    const startDate = cellGantt.store.getDateByX(cellGantt.cellPosition.x);
    const diff = dayjs(cellGantt.block.endTime).diff(dayjs(cellGantt.block.startTime));

    cellGantt.store.changeBlockTime(cellGantt.key, startDate.format('YYYY-MM-DD'), startDate.add(diff).format('YYYY-MM-DD'));

    const targetBlock = cellGantt.store.interactionModule.getIntersectionBlockNode(lineParent!.getRelativePointerPosition()!);
    if (targetBlock && targetBlock?.block.key !== cellGantt.block.key) {
      cellGantt.store.changeBlockIndex(cellGantt.key, targetBlock.block.index + 1);
    }

    if (targetBlock && targetBlock?.block.parentKey === undefined) {
      cellGantt.store.changeBlockParent(cellGantt.key, '');
    }

    if (Boolean(targetBlock?.block.parentKey) && targetBlock?.block.parentKey !== cellGantt.block.parentKey) {
      cellGantt.store.changeBlockParent(cellGantt.key, targetBlock!.block.parentKey!);
    }

    if (cellGantt.store.viewConfig.sortMode === 'group') {
      const targetGroup = cellGantt.store.interactionModule.getIntersectionGroupNode(lineParent!.getRelativePointerPosition()!);
      if (targetGroup && targetGroup?.key !== cellGantt.block.groupKey) {
        cellGantt.store.changeBlockGroup(cellGantt.key, targetGroup.key);
      }
    }

    cellGantt.state.to('dragging', 'normal', false);
    state = undefined;
    dragState.x = 0;
    dragState.y = 0;
    lineNode.remove();
  });

  return dragState;
}

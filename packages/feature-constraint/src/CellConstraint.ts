import Konva from 'konva';
import type { GanttEvent, GanttStore } from '@konva-gantt/core';
import type { GanttCell } from '@konva-gantt/core/gantt';
import { GanttEventDecorator, GanttEffectComponent, useStore } from '@konva-gantt/core';
import { useConstraintStore, type ConstraintItem } from './store';

@GanttEffectComponent(useStore)
export class GanttCellConstraint {
  declare store: GanttStore;

  node: Konva.Shape;

  wrapperNode: Konva.Rect;

  parentNode?: Konva.Group;

  constructor(private cellGantt: GanttCell, private config: { mode: 'start' | 'end' }) {
    this.node = new Konva.Circle({
      radius: 4,
      fill: '#fff',
      strokeWidth: 1,
      opacity: 0,
      draggable: false,
      listening: true,
    });
    this.node.on('mousedown', () => {
      this.startEvent.trigger();
    });
    this.wrapperNode = new Konva.Rect({
      name: 'GanttCellConstraint',
      width: 8,
      height: 0,
      opacity: 0,
      draggable: false,
    });
  }

  mount(parentNode: Konva.Group) {
    parentNode.add(this.wrapperNode);
    parentNode.add(this.node);
    this.parentNode = parentNode;
  }

  update() {
    if (this.parentNode) {
      this.wrapperNode.y(0);
      this.wrapperNode.x(this.config.mode === 'start' ? 0 : this.parentNode.width());
      this.wrapperNode.height(this.parentNode.height());
      this.node.opacity(this.cellGantt.state.activeState !== 'normal' ? 1 : 0);
      this.node.y(this.parentNode.height() / 2);
      this.node.x(this.config.mode === 'start' ? -2 - this.node.width() / 2 : this.parentNode.width() + this.node.width() / 2 + 2);

      const { colorStyles } = this.store;
      this.wrapperNode.fill(colorStyles.PrimaryPressed);
      this.node.fill(colorStyles.PrimaryPressed);
    }
  }

  unmount() {
    this.wrapperNode.remove();
    this.node.remove();
  }

  @GanttEventDecorator()
  declare startEvent: GanttEvent;
}

export function createConstraintLine(cellGantt: GanttCell, mode: 'start' | 'end') {
  const store = useStore();
  const constraintTrigger = new GanttCellConstraint(cellGantt, { mode });
  const containerNode = cellGantt.rootContainer.constraintContainerNode;

  let constraintNode: Konva.Arrow;

  function getPointerConstrainedItem() {
    const { x, y } = containerNode.getRelativePointerPosition()!;
    const targetBlock = cellGantt.store.interactionModule.getIntersectionBlockNode({ x, y });

    if (targetBlock !== null) {
      const xInBlock = targetBlock!.wrapperNode.getRelativePointerPosition()!.x;
      const constrainedMode = xInBlock < targetBlock!.wrapperNode.width() / 2 ? 'start' : 'end';
      return `${targetBlock.key}-${constrainedMode}` as ConstraintItem;
    }
    return undefined;
  }

  function drawEvent() {
    const constrainModule = useConstraintStore();
    const { x, y } = containerNode.getRelativePointerPosition()!;
    const triggerPosition = constraintTrigger.node.getAbsolutePosition();
    const containerPosition = containerNode.getAbsolutePosition();
    constraintNode.points([triggerPosition.x - containerPosition.x, triggerPosition.y - containerPosition.y, x, y]);
    const item = getPointerConstrainedItem();
    let fill = store.colorStyles.BorderDark;
    if (item !== undefined) {
      const constrainItem = `${cellGantt.block.key}-${mode}` as ConstraintItem;
      if (!constrainModule.validateConstraint(constrainItem, item)) {
        fill = store.colorStyles.Error;
      }
    }
    constraintNode.fill(fill);
    constraintNode.stroke(fill);
  }

  function drawEnd() {
    const constrainModule = useConstraintStore();
    containerNode.off('mouseup', drawEnd);
    containerNode.off('mousemove', drawEvent);
    constraintNode.remove();
    const item = getPointerConstrainedItem();

    if (item !== undefined) {
      const constrainItem: ConstraintItem = `${cellGantt.block.key}-${mode}`;
      const constrainedItem: ConstraintItem = item;

      constrainModule.validateConstraint(constrainItem, constrainedItem);
      constrainModule.addConstraint(constrainItem, constrainedItem);
    }
  }

  constraintTrigger.startEvent.on(() => {
    constraintNode = new Konva.Arrow({
      points: [0, 0, 0, 0],
      fill: store.colorStyles.BorderDark,
      pointerLength: 10,
      pointerWidth: 10,
      strokeWidth: 2,
      stroke: store.colorStyles.BorderDark,
      dashEnabled: true,
      dash: [5, 5],
      opacity: 1,
    });
    containerNode.add(constraintNode);

    containerNode.on('mousemove', drawEvent);
    containerNode.on('mouseup', drawEnd);
  });

  return constraintTrigger;
}

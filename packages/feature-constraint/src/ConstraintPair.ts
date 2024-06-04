import Konva from 'konva';
import type { GanttStore } from '@konva-gantt/core';
import {
  GanttEffectComponent, useStore, GanttEffectUpdate,
} from '@konva-gantt/core';
import { useConstraintStore, type ConstraintItem } from './store';
import type { GanttCellConstraint } from './CellConstraint';

function isInSection(a: number, b: number, c: number) {
  return (a - b) * (a - c) < 0;
}

function getPoints(startPoint: [number, number], startBarrierPoint: [number, number], endPoint: [number, number], endBarrierPoint: [number, number]) {
  const paddingX = 22;
  const startPreparePoint = [startPoint[0] + (startPoint[0] < startBarrierPoint[0] ? -1 : 1) * paddingX, startPoint[1]];
  const startPoints = [...startPoint, ...startPreparePoint];
  {
    // attempt one corner
    const preparePoint = [startPreparePoint[0], endPoint[1]];

    if (
      isInSection(endPoint[0], preparePoint[0], endBarrierPoint[0])
      && (preparePoint[0] < endPoint[0] - paddingX || preparePoint[0] > endPoint[0] + paddingX)
    ) {
      return [...startPoints, ...preparePoint, ...endPoint];
    }
  }

  {
    // attempt two corner
    const preparePoint1 = [endPoint[0] + (endPoint[0] < startPreparePoint[0] ? -1 : 1) * paddingX, startPreparePoint[1]];
    if (isInSection(startPreparePoint[0], preparePoint1[0], startBarrierPoint[0])) {
      const preparePoint2 = [preparePoint1[0], endPoint[1]];
      if (isInSection(endPoint[0], preparePoint2[0], endBarrierPoint[0])) {
        return [...startPoints, ...preparePoint1, ...preparePoint2, ...endPoint];
      }
    }
  }

  // attempt three corner
  const preparePoint1 = [startPreparePoint[0], endPoint[1] + (endPoint[1] > startPreparePoint[1] ? -1 : 1) * 16];
  const preparePoint2 = [endPoint[0] + (endPoint[0] > endBarrierPoint[0] ? 1 : -1) * paddingX, preparePoint1[1]];
  const preparePoint3 = [preparePoint2[0], endPoint[1]];
  return [...startPoints, ...preparePoint1, ...preparePoint2, ...preparePoint3, ...endPoint];
}

function coordSubtract(a: { x: number, y: number }, b: { x: number, y: number }): [number, number] {
  return [a.x - b.x, a.y - b.y];
}

@GanttEffectComponent(useStore)
export class GanttConstraintPair {
  declare store: GanttStore;

  node: Konva.Arrow;

  parentNode?: Konva.Group;

  get constrainModule() {
    return useConstraintStore();
  }

  get constrainMode() {
    return this.constrainModule.getMode(this.constrain);
  }

  get constrainBlock() {
    return this.store.getBlockByKey(this.constrainModule.getKey(this.constrain));
  }

  get constrainedBlock() {
    return this.store.getBlockByKey(this.constrainModule.getKey(this.constrained));
  }

  get constrainedMode() {
    return this.constrainModule.getMode(this.constrained);
  }

  constructor(public constrain: ConstraintItem, private constrained: ConstraintItem, private getConstraintNodes: (key: string) => { start: GanttCellConstraint, end: GanttCellConstraint } | undefined) {
    this.node = new Konva.Arrow({
      pointerLength: 10,
      pointerWidth: 10,
      strokeWidth: 1,
      draggable: false,
      listening: true,
      points: [],
    });
  }

  mount(parentNode: Konva.Group) {
    this.parentNode = parentNode;
    parentNode.add(this.node);
  }

  @GanttEffectUpdate()
  update() {
    // let startPoint: [number, number] = [0, 0];
    // let endPoint: [number, number] = [0, 0];
    const constrainInstance = this.getConstraintNodes(this.constrainBlock.key);
    const constrainedInstance = this.getConstraintNodes(this.constrainedBlock.key);
    if (!constrainInstance || !constrainedInstance) {
      return;
    }
    const parentPosition = this.parentNode!.getAbsolutePosition();

    const constrainPositions = [constrainInstance.start.node.getAbsolutePosition(), constrainInstance.end.node.getAbsolutePosition()];
    const constrainedPositions = [constrainedInstance.start.node.getAbsolutePosition(), constrainedInstance.end.node.getAbsolutePosition()];

    const startPoint = coordSubtract(this.constrainMode === 'start' ? constrainPositions[0] : constrainPositions[1], parentPosition);
    const endPoint = coordSubtract(this.constrainedMode === 'start' ? constrainedPositions[0] : constrainedPositions[1], parentPosition);
    const startBarrierPoint = coordSubtract(this.constrainMode === 'start' ? constrainPositions[1] : constrainPositions[0], parentPosition);
    const endBarrierPoint = coordSubtract(this.constrainedMode === 'start' ? constrainedPositions[1] : constrainedPositions[0], parentPosition);

    const { colorStyles } = this.store;

    this.node.points(getPoints(startPoint, startBarrierPoint, endPoint, endBarrierPoint));
    this.node.fill(colorStyles.BorderDark);
    this.node.stroke(colorStyles.BorderDark);
  }

  unmount() {
  }
}

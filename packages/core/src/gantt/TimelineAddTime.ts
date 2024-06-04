import Konva from 'konva';

import { ShapeAdd } from '../shapes/Add';
import type { GanttEvent } from '../decorators';
import { GanttEventDecorator, GanttEffectComponent } from '../decorators';
import type { GanttStore } from '../store';
import { useStore } from '../store';

@GanttEffectComponent(useStore)
export class GanttTimelineAddTime {
  declare store: GanttStore;

  private blockWrapper: Konva.Group;

  private triggerRectNode: Konva.Rect;

  private addNodeWrapper = new Konva.Group({
    name: 'TimelineAddBlockRow',
  });

  private newBlockNode = new Konva.Rect({
    cornerRadius: 6,
    strokeWidth: 2,
    dashEnabled: true,
    dash: [5, 5],
  });

  private addNode = new ShapeAdd({
    width: 16,
    height: 16,
  });

  constructor() {
    this.blockWrapper = new Konva.Group({
      name: 'TimelineAddBlockWrapper',
      listening: true,
    });

    this.triggerRectNode = new Konva.Rect({
      name: 'TimelineAddBlockTrigger',
    });

    this.addNodeWrapper.on('click', () => {
      const { store } = this;
      const date = store.getDateByX(this.addNodeWrapper.x());
      this.addBlockEvent.trigger(date.format('YYYY-MM-DD'), date.format('YYYY-MM-DD'));
    });

    this.blockWrapper.on('mousemove', () => {
      this.updateAddNode();
    });

    this.blockWrapper.on('mouseleave', () => {
      this.addNodeWrapper.remove();
    });

    this.blockWrapper.on('mouseenter', () => {
      this.addNodeWrapper.add(this.newBlockNode);
      this.addNodeWrapper.add(this.addNode);
      this.blockWrapper.add(this.addNodeWrapper);
    });
  }

  get mounted() {
    return Boolean(this.blockWrapper.parent);
  }

  mount(parentNode: Konva.Group) {
    parentNode.add(this.blockWrapper);
    this.blockWrapper.add(this.triggerRectNode);
  }

  private updateAddNode() {
    const { store } = this;
    if (!this.addNodeWrapper.parent) return;
    const { x: offsetX } = this.blockWrapper.getRelativePointerPosition() ?? {};
    if (offsetX === undefined) return;
    const date = store.getDateByX(offsetX);
    const x = store.getBlockXByDate(date);
    this.addNodeWrapper.x(x + 1);
    this.addNodeWrapper.y(0);

    this.newBlockNode.width(this.store.currentTimeCellWidth - 2);
    this.newBlockNode.height(this.store.viewConfig.lineHeight);
    this.newBlockNode.stroke(this.store.colorStyles.Grey);

    this.addNode.x(this.newBlockNode.width() / 2 - this.addNode.width() / 2);
    this.addNode.y(this.newBlockNode.height() / 2 - this.addNode.height() / 2);
  }

  update(y: number) {
    this.blockWrapper.y(y);
    this.blockWrapper.height(this.store.viewConfig.lineHeight);
    this.blockWrapper.width(this.blockWrapper.parent!.width());

    this.triggerRectNode.width(this.blockWrapper.width());
    this.triggerRectNode.height(this.blockWrapper.height());

    this.updateAddNode();
  }

  unmount() {
    this.blockWrapper.remove();
  }

  @GanttEventDecorator()
  declare addBlockEvent: GanttEvent<(startTime: string, endTime: string) => void>;
}

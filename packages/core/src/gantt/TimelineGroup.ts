import Konva from 'konva';
import { ShapeBorder } from '../shapes/Border';
import { GanttGround } from './Ground';
import type { GanttStore } from '../store';
import { useStore } from '../store';
import { GanttEffectComponent, GanttEffectUpdate } from '../decorators';
import type { IGanttCellParentContainer } from './Cell';
import { GanttTimelineBlock } from './TimelineBlock';

import { GanttTimelineAddTime } from './TimelineAddTime';

@GanttEffectComponent(useStore)
export class GanttTimelineGroup implements IGanttCellParentContainer {
  declare store: GanttStore;

  wrapperNode: Konva.Group;

  private borderNode: ShapeBorder;

  private groundGantt: GanttGround;

  parentNode?: Konva.Group;

  addBlockGantt: GanttTimelineAddTime;

  get constraintContainerNode() {
    return this.parentNode!;
  }

  get blocks() {
    return this.store.groupMap[this.key];
  }

  constructor(public key: string, public blockGanttMap: Map<string, GanttTimelineBlock>) {
    this.wrapperNode = new Konva.Group({
      name: 'TimelineGroupWrapper',
    });
    this.borderNode = new ShapeBorder(this.wrapperNode, {
      top: 1,
      bottom: 1,
      right: 1,
    });
    this.groundGantt = new GanttGround();

    this.addBlockGantt = new GanttTimelineAddTime();
    this.addBlockGantt.addBlockEvent.on((startTime, endTime) => {
      this.store.addBlock({
        groupKey: this.key,
        startTime,
        endTime,
      });
    });
  }

  mount(parentNode: Konva.Group) {
    this.parentNode = parentNode;
    parentNode.add(this.wrapperNode);
    this.wrapperNode.add(this.borderNode);
    this.groundGantt.mount(this.wrapperNode);
    this.addBlockGantt.mount(this.wrapperNode);

    this.store.interactionModule.setGroupNode(this.key, this);
  }

  @GanttEffectUpdate()
  update(y: number) {
    this.wrapperNode.y(y);
    this.wrapperNode.width(this.parentNode!.width());
    let height = 0;
    const cachedBlockKey = new Set<string>();
    this.blocks.forEach((item) => {
      let block = this.blockGanttMap.get(item.key);
      if (!block) {
        block = new GanttTimelineBlock(item.key, this);
        this.blockGanttMap.set(item.key, block);
        block.mount(this.parentNode!);
      }
      block.update(this.wrapperNode.y() + height);
      height += this.store.viewConfig.lineHeight;
      cachedBlockKey.add(item.key);
    });

    this.addBlockGantt.update(height);

    height += this.store.viewConfig.lineHeight;
    this.wrapperNode.height(height);
    this.wrapperNode.zIndex(1);

    this.borderNode.update({ color: this.store.colorStyles.Border });
    this.groundGantt.update();

    return height;
  }

  unmount() {
    this.wrapperNode.remove();
  }
}

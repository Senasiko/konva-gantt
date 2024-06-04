import Konva from 'konva';
import { ShapeBorder } from '../shapes/Border';
import type { GanttStore } from '../store';
import { useStore } from '../store';
import { GanttEffectComponent, GanttEffectUpdate } from '../decorators';

import { GanttTableCell } from './TableCell';
import { GanttTableAddBlock } from './TableAddBlock';

@GanttEffectComponent(useStore)
export class GanttTableGroup {
  declare store: GanttStore;

  wrapperNode: Konva.Group;

  private borderNode: ShapeBorder;

  parentNode?: Konva.Group;

  blockGantts = new Map<string, GanttTableCell>();

  addBlockGantt: GanttTableAddBlock;

  shadowNode: Konva.Rect;

  get constraintContainer() {
    return this.parentNode!;
  }

  get blocks() {
    return this.store.groupMap[this.key];
  }

  constructor(public key: string, private blockNodeMap: Map<string, GanttTableCell>) {
    this.wrapperNode = new Konva.Group({
      name: 'TimelineTableGroupWrapper',
    });
    this.borderNode = new ShapeBorder(this.wrapperNode, {
      bottom: 1,
      top: 1,
      left: 1,
    });

    this.addBlockGantt = new GanttTableAddBlock();

    this.addBlockGantt.addBlockEvent.on(() => {
      this.store.addBlock({
        groupKey: this.key,
      });
    });

    this.shadowNode = new Konva.Rect({
      name: 'TimelineTableGroupShadow',
      shadowColor: 'black',
      shadowEnabled: true,
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 5,
      shadowOpacity: 1,
    });
  }

  mount(parentNode: Konva.Group) {
    this.parentNode = parentNode;
    parentNode.add(this.wrapperNode);

    this.wrapperNode.add(this.borderNode);
    this.wrapperNode.add(this.shadowNode);
    this.addBlockGantt.mount(this.wrapperNode);
  }

  @GanttEffectUpdate()
  update(y: number) {
    this.wrapperNode.y(y);
    this.wrapperNode.x(10);
    this.wrapperNode.width(this.parentNode!.width() - 10);
    let height = 0;
    this.blocks.forEach((item) => {
      let block = this.blockNodeMap.get(item.key);
      if (!block) {
        block = new GanttTableCell(item.key);
        this.blockNodeMap.set(item.key, block);
        block.mount(this.parentNode!);
      }
      block.update(y + height, 10);
      height += this.store.viewConfig.lineHeight;
    });
    this.addBlockGantt.update(height);
    height += this.store.viewConfig.lineHeight;

    this.wrapperNode.height(height);

    this.shadowNode.x(0);
    this.shadowNode.width(this.wrapperNode.width());
    this.shadowNode.height(this.wrapperNode.height());

    this.borderNode.update({ color: this.store.colorStyles.Border });
  }

  unmount() {
    this.wrapperNode.remove();
  }
}

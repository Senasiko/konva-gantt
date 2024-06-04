import Konva from 'konva';
import { nextTick, watch } from 'vue';
import type { GanttEvent } from '../../decorators';
import { GanttEventDecorator, GanttEffectComponent, GanttEffectUpdate } from '../../decorators';
import type { GanttStore } from '../../store';
import { useStore } from '../../store';
import type { IGanttCellParentContainer } from '../Cell';
import { GanttCell } from '../Cell';
import { GanttTimelineAddTime } from '../TimelineAddTime';
import { useDateJump } from './useDateJump';
import { updateWithValidate } from '../../utils/node';

function useAddTime(blockGantt: GanttTimelineBlock) {
  let addTimeGantt: GanttTimelineAddTime | undefined;

  nextTick(() => {
    watch(() => [blockGantt.block.startTime, blockGantt.block.endTime], () => {
      if (!blockGantt.block.startTime || !blockGantt.block.endTime) {
        if (addTimeGantt === undefined) {
          addTimeGantt = new GanttTimelineAddTime();
        }
        addTimeGantt.addBlockEvent.on((startTime, endTime) => {
          blockGantt.store.changeBlockTime(blockGantt.key, startTime, endTime);
        });

        addTimeGantt.mount(blockGantt.wrapperNode);
        addTimeGantt.update(0);
      } else {
        addTimeGantt?.unmount();
        addTimeGantt = undefined;
      }
    }, {
      immediate: true,
    });
  });

  return {
    update() {
      addTimeGantt?.update(0);
    },
  };
}

@GanttEffectComponent(useStore)
export class GanttTimelineBlock {
  declare store: GanttStore;

  private addTimeGantt: ReturnType<typeof useAddTime>;

  cellGantt: GanttCell;

  wrapperNode: Konva.Group;

  private parentNode?: Konva.Group;

  private dateJump: ReturnType<typeof useDateJump>;

  get block() {
    return this.store.getBlockByKey(this.key);
  }

  get position() {
    return this.wrapperNode.position()!;
  }

  get isShowCell() {
    return Boolean(this.block.startTime && this.block.endTime);
  }

  constructor(public key: string, private containerNode: IGanttCellParentContainer) {
    this.cellGantt = new GanttCell(this.key, this.containerNode);
    this.wrapperNode = new Konva.Group({
      name: `TimelineBlockWrapper-${key}`,
    });

    this.cellGantt.updatedEvent.on(() => {
      this.updatedEvent.trigger();
    });

    this.addTimeGantt = useAddTime(this);

    this.dateJump = useDateJump(this);
  }

  mount(parentNode: Konva.Group) {
    this.parentNode = parentNode;
    this.parentNode.add(this.wrapperNode);
    this.store.interactionModule.setBlockNode(this.key, this);
  }

  @GanttEffectUpdate()
  update(y: number) {
    this.wrapperNode.y(y);
    this.wrapperNode.width(this.parentNode!.width());
    this.wrapperNode.height(this.store.viewConfig.lineHeight);
    updateWithValidate(() => this.isShowCell, this.cellGantt, this.wrapperNode);

    if (this.cellGantt.state.activeState === 'dragging') {
      this.wrapperNode.zIndex(this.store.blocks.length);
    } else {
      // this.wrapperNode.zIndex(this.block.index);
    }

    this.addTimeGantt.update();
    this.dateJump.update();
  }

  unmount() {
    this.wrapperNode.remove();
    this.cellGantt.unmount();
  }

  @GanttEventDecorator()
  declare updatedEvent: GanttEvent;
}

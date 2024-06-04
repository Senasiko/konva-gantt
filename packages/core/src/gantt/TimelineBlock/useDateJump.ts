import Konva from 'konva';
import dayjs from 'dayjs';
import _ from 'lodash';
import type { GanttTimelineBlock } from '.';
import { GanttEffectComponent, GanttEffectUpdate } from '../../decorators';
import { updateWithValidate } from '../../utils/node';
import type { GanttStore } from '../../store';
import { useStore } from '../../store';
import { ShapeButton } from '../../shapes/Button';

@GanttEffectComponent(useStore)
class GanttDateJump {
  declare store: GanttStore;

  private arrowNode: Konva.Arrow;

  buttonNode: ShapeButton;

  private buttonSize = 20;

  constructor(private parent: GanttTimelineBlock, private mode: 'start' | 'end') {
    const padding = 4;
    const leftPoint = [padding, this.buttonSize / 2];
    const rightPoint = [this.buttonSize - padding, this.buttonSize / 2];
    this.arrowNode = new Konva.Arrow({
      points: this.mode === 'end' ? [...leftPoint, ...rightPoint] : [...rightPoint, ...leftPoint],
      strokeWidth: 1,
      pointerLength: 4,
      pointerWidth: 4,
    });

    this.buttonNode = new ShapeButton({
      mount: (node) => {
        node.add(this.arrowNode);
      },
      update: (backgroundNode, activeState) => {
        backgroundNode.width(this.buttonSize);
        backgroundNode.height(this.buttonSize);
        backgroundNode.cornerRadius(3);
        if (activeState === 'normal') {
          backgroundNode.fill(this.store.colorStyles.BackgroundDark);
        } else if (activeState === 'hovering') {
          backgroundNode.fill(this.store.colorStyles.Grey);
        }

        this.arrowNode.width(this.buttonSize);
        this.arrowNode.height(this.buttonSize);
        this.arrowNode.x(0);
        this.arrowNode.y(0);
        this.arrowNode.fill(this.store.colorStyles.GreyLight);
        this.arrowNode.stroke(this.store.colorStyles.GreyLight);
      },
      unmount: () => {
        this.arrowNode.remove();
      },
    });

    this.buttonNode.clickEvent.on(() => {
      const block = this.store.getBlockByKey(this.parent.key);
      if (this.mode === 'start') {
        const x = this.store.getScrollXByDate(dayjs(block.startTime).add(-3, this.store.viewConfig.mode));
        this.store.scrollX = _.max([x, 0])!;
      } else {
        const pageWidth = this.store.interactionModule.timelineContainerNode!.width();
        const x = this.store.getScrollXByDate(dayjs(block.endTime).add(4, this.store.viewConfig.mode)) - pageWidth;
        this.store.scrollX = _.min([x, this.store.contentWidth - pageWidth])!;
      }
    });
  }

  mount(parentNode: Konva.Group) {
    this.buttonNode.mount(parentNode);
  }

  @GanttEffectUpdate()
  update() {
    const y = (this.store.viewConfig.lineHeight - this.buttonSize) / 2;
    let x = 10;
    if (this.mode === 'end') {
      x = this.parent.wrapperNode.width() - this.buttonSize - 10;
    }
    this.buttonNode?.update(x, y);
  }

  unmount() {
    this.buttonNode.setActive(false);
    this.buttonNode?.unmount();
  }
}

export function useDateJump(blockGantt: GanttTimelineBlock) {
  const startDateJumpGantt = new GanttDateJump(blockGantt, 'start');
  const endDateJumpGantt = new GanttDateJump(blockGantt, 'end');
  return {
    update() {
      updateWithValidate(() => blockGantt.store.viewStartDate.diff(dayjs(blockGantt.block.startTime)) > 0, startDateJumpGantt, blockGantt.wrapperNode);
      updateWithValidate(() => blockGantt.store.viewEndDate.diff(dayjs(blockGantt.block.endTime)) < 0, endDateJumpGantt, blockGantt.wrapperNode);
    },
  };
}

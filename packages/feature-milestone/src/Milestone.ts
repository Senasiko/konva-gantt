import Konva from 'konva';
import dayjs from 'dayjs';
import _ from 'lodash';
import type { GanttStore } from '@konva-gantt/core';
import {
  GanttEffectComponent, ComputedGet, HeaderStyles, useStore, GanttEffectUpdate,
} from '@konva-gantt/core';
import { ShapeTextButton } from '@konva-gantt/core/shapes/TextButton';
import type { GanttDataMilestone } from '.';
import { DarkColorStyles, LightColorStyles } from './style';

@GanttEffectComponent(useStore)
export class GanttMilestone {
  declare store: GanttStore;

  private timeline: Konva.Rect;

  private parentNode?: Konva.Group;

  private titleButtonNode: ShapeTextButton;

  get milestone() {
    return this.getMilestoneData(this.key)!;
  }

  @ComputedGet()
  get position() {
    return {
      x: this.store.getBlockXByDate(dayjs(this.milestone.time)),
      y: HeaderStyles.height / 2,
    };
  }

  constructor(public key: string, private getMilestoneData: (key: string) => GanttDataMilestone | undefined) {
    this.timeline = new Konva.Rect({
      width: 2,
      listening: false,
    });
    this.titleButtonNode = new ShapeTextButton('');

    this.titleButtonNode.buttonStyle = (rectNode, textNode, activeState) => {
      const { viewConfig } = this.store;
      const colorStyles = viewConfig.theme === 'light' ? LightColorStyles : DarkColorStyles;
      textNode.ellipsis(true);
      textNode.height(20);
      textNode.fontSize(12);
      textNode.lineHeight(20);
      textNode.verticalAlign('middle');
      textNode.align('left');
      textNode.fill('#fff');
      textNode.wrap('none');

      const padding = 3;
      const textWidth = textNode.measureSize(this.milestone.text).width;

      const hasNextMilestone = Boolean(this.getMilestoneData(dayjs(this.key).add(1, this.store.viewConfig.mode).format('YYYY-MM-DD')));

      const width = _.clamp(
        textWidth + padding * 2,
        this.store.currentTimeCellWidth - 10,
        hasNextMilestone ? this.store.currentTimeCellWidth - 10 : this.store.currentTimeCellWidth * 2 - 10,
      );

      textNode.x(padding);
      textNode.y(0);
      textNode.width(width - padding * 2);
      textNode.text(this.milestone.text);

      rectNode.width(width);
      rectNode.height(20);
      rectNode.cornerRadius([0, 4, 4, 0]);

      if (activeState === 'normal') {
        rectNode.fill(colorStyles.MilestoneBackground);
      } else if (activeState === 'hovering') {
        rectNode.fill(colorStyles.MilestoneBackgroundLight);
      } else if (activeState === 'active') {
        rectNode.fill(colorStyles.MilestoneBackground);
      }
    };
  }

  mount(parentNode: Konva.Group) {
    this.parentNode = parentNode;

    parentNode.add(this.timeline);
    this.titleButtonNode.mount(parentNode);

    this.update();
  }

  @GanttEffectUpdate()
  update() {
    const { viewConfig } = this.store;
    const colorStyles = viewConfig.theme === 'light' ? LightColorStyles : DarkColorStyles;
    this.titleButtonNode.update(this.position.x, this.position.y);

    this.timeline.x(this.position.x);
    this.timeline.y(this.position.y);
    this.timeline.height(this.parentNode!.height() - this.position.y);
    this.timeline.fill(colorStyles.MilestoneBackground);
  }

  unmount() {
  }
}

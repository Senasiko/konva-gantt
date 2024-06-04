import Konva from 'konva';
import _ from 'lodash';
import type { GanttStore } from '../store';
import { useStore } from '../store';
import { GanttEffectComponent, GanttEffectUpdate } from '../decorators';

@GanttEffectComponent(useStore)
export class GanttGround {
  backgroundNode: Konva.Rect;

  declare store: GanttStore;

  parentNode?: Konva.Group;

  constructor() {
    this.backgroundNode = new Konva.Rect({
      listening: true,
      fillPriority: 'linear-gradient',
      fillLinearGradientStartPointX: 0,
      fillLinearGradientStartPointY: 0,
      fillLinearGradientEndPointY: 0,
    });
  }

  get offsetX() {
    return this.store.viewStartTimeCellIndex * this.store.currentTimeCellWidth - this.store.scrollX;
  }

  private getBackgroundStops() {
    const stops: (string | number)[] = [];
    const oddColor = this.store.colorStyles.BackgroundLight;
    const evenColor = this.store.colorStyles.BackgroundPrimary;

    _.range(this.store.viewStartTimeCellIndex, this.store.viewEndTimeCellIndex).forEach((index, indexInView) => {
      const percent = indexInView / (this.store.viewEndTimeCellIndex - this.store.viewStartTimeCellIndex + 1);
      if (index % 2 === 0) {
        stops.push(...[percent, oddColor, percent, evenColor]);
      } else {
        stops.push(...[percent, evenColor, percent, oddColor]);
      }
    });
    return stops;
  }

  mount(parentNode: Konva.Group) {
    this.parentNode = parentNode;
    this.parentNode.add(this.backgroundNode);
    this.update();
  }

  @GanttEffectUpdate()
  update() {
    if (!this.parentNode) {
      return;
    }
    this.backgroundNode.width((this.store.viewEndTimeCellIndex - this.store.viewStartTimeCellIndex + 1) * this.store.currentTimeCellWidth);
    this.backgroundNode.height(this.parentNode.height());
    this.backgroundNode.fillLinearGradientEndPointX(this.backgroundNode.width());
    this.backgroundNode.fillLinearGradientColorStops(this.getBackgroundStops());
    this.backgroundNode.x(this.offsetX);
    this.backgroundNode.zIndex(0);
  }

  unmount() {
    this.backgroundNode.remove();
  }
}

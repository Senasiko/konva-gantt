import Konva from 'konva';
import { GanttEffectComponent } from '../decorators';
import type { GanttStore } from '../store';
import { useStore } from '../store';
import { HeaderStyles } from '../styles';
import { ShapeBorder } from '../shapes/Border';

@GanttEffectComponent(useStore)
export class GanttTableHeader {
  groupNode = new Konva.Group();

  borderNode: ShapeBorder;

  declare store: GanttStore;

  constructor() {
    this.borderNode = new ShapeBorder(this.groupNode, { bottom: 1 });
  }

  mount(parentNode: Konva.Group) {
    parentNode.add(this.groupNode);
    this.groupNode.add(this.borderNode);
    this.update();
  }

  update() {
    this.groupNode.width(this.store.viewConfig.tableWidth);
    this.groupNode.height(HeaderStyles.height);
    this.borderNode.update({ color: this.store.colorStyles.Border, bottom: 1 });
  }

  unmount() {
  }
}

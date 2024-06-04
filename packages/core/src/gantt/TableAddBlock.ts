import Konva from 'konva';
import { ShapeAdd } from '../shapes/Add';
import type { GanttStore } from '../store';
import { useStore } from '../store';
import type { GanttEvent } from '../decorators';
import { GanttEventDecorator, GanttEffectComponent } from '../decorators';

@GanttEffectComponent(useStore)
export class GanttTableAddBlock {
  declare store: GanttStore;

  wrapperNode = new Konva.Group({
    name: 'TableAddRowGroup',
    listening: true,
  });

  addBlockNode = new ShapeAdd({ listening: false });

  addBlockRow = new Konva.Rect({
    listening: true,
  });

  constructor() {
    this.wrapperNode.on('click', () => {
      this.addBlockEvent.trigger();
    });
  }

  mount(parentNode: Konva.Group) {
    this.wrapperNode.add(this.addBlockRow);
    this.wrapperNode.add(this.addBlockNode);
    parentNode.add(this.wrapperNode);
  }

  update(y: number) {
    this.wrapperNode.y(y);
    this.wrapperNode.x(0);
    this.wrapperNode.width(this.wrapperNode.parent!.width());
    this.wrapperNode.height(this.store.viewConfig.lineHeight);

    this.addBlockRow.width(this.wrapperNode.width());
    this.addBlockRow.height(this.wrapperNode.height());

    this.addBlockNode.width(16);
    this.addBlockNode.height(16);
    this.addBlockNode.y(this.wrapperNode.height() / 2 - this.addBlockNode.height() / 2);
    this.addBlockNode.x(10);
  }

  unmount() {
    this.wrapperNode.remove();
  }

  @GanttEventDecorator()
  declare addBlockEvent: GanttEvent<() => void>;
}

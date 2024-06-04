import Konva from 'konva';
import type { GanttEvent } from '../decorators';
import { GanttEventDecorator } from '../decorators';
import { StateManager } from '../utils/StateManager';

export interface IShapeButtonSlot {
  mount(parentNode: Konva.Group): void;
  update(backgroundNode: Konva.Rect, activeState: 'normal' | 'hovering' | 'active'): void;
  unmount(): void;
}

export class ShapeButton {
  protected buttonNode: Konva.Group;

  private backgroundNode: Konva.Rect;

  private state = new StateManager<'normal' | 'hovering' | 'active'>('normal');

  constructor(private slot: IShapeButtonSlot) {
    this.backgroundNode = new Konva.Rect({
      cornerRadius: 6,
    });

    this.buttonNode = new Konva.Group({
    });

    this.buttonNode.on('mouseenter', () => {
      this.state.to('normal', 'hovering');
      document.body.style.cursor = 'pointer';
      this.update();
    });

    this.buttonNode.on('mouseleave', () => {
      this.state.to('hovering', 'normal', false);
      document.body.style.cursor = '';
      this.update();
    });

    this.buttonNode.on('click', () => {
      this.clickEvent.trigger();
    });
  }

  mount(parentNode: Konva.Group) {
    this.buttonNode.add(this.backgroundNode);
    this.slot.mount(this.buttonNode);
    parentNode.add(this.buttonNode);
  }

  update(x?: number, y?: number) {
    this.buttonNode.x(x ?? this.buttonNode.x());
    this.buttonNode.y(y ?? this.buttonNode.y());

    this.slot.update(this.backgroundNode, this.state.activeState);
    this.buttonNode.width(this.backgroundNode.width());
    this.buttonNode.height(this.backgroundNode.height());
  }

  unmount() {
    this.slot.unmount();
    this.backgroundNode.remove();
    this.buttonNode.remove();
  }

  width() {
    return this.buttonNode.width();
  }

  setActive(isActive: boolean) {
    if (isActive) {
      this.state.to(['normal', 'hovering'], 'active');
    } else {
      this.state.to(undefined, 'normal', false);
    }
    this.update();
  }

  @GanttEventDecorator()
  declare clickEvent: GanttEvent;
}

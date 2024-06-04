import Konva from 'konva';
import type { GanttEvent } from '../decorators';
import { GanttEventDecorator, GanttEffectComponent } from '../decorators';
import { useTweenGroup } from '../utils/tween';
import type { GanttStore } from '../store';
import { useStore } from '../store';

@GanttEffectComponent(useStore)
export class GanttCellExpend {
  declare store: GanttStore;

  node: Konva.Shape;

  wrapperNode: Konva.Group;

  collisionNode: Konva.Rect;

  parentNode?: Konva.Group;

  state: 'pending' | 'dragging' = 'pending';

  show: () => void;

  hide: () => void;

  constructor(private config: { direction: 'left' | 'right' }) {
    const padding = 8;
    this.wrapperNode = new Konva.Group({
      width: 10,
      opacity: 0,
    });
    this.collisionNode = new Konva.Rect({
      listening: true,
      draggable: true,
      dragBoundFunc: (pos) => {
        pos.y = this.collisionNode.absolutePosition().y;
        return pos;
      },
      cornerRadius: config.direction === 'left' ? [6, 0, 0, 6] : [0, 6, 6, 0],
    });
    this.node = new Konva.Shape({
      width: 6,
      height: 0,
      listening: false,
      sceneFunc(con, shape) {
        con.save();
        con.strokeStyle = '#fff';
        con.beginPath();
        con.moveTo(shape.width() / 2 - 1, padding);
        con.lineTo(shape.width() / 2 - 1, shape.height() - padding);
        con.stroke();
        con.closePath();

        con.beginPath();
        con.moveTo(shape.width() / 2 + 1, padding);
        con.lineTo(shape.width() / 2 + 1, shape.height() - padding);
        con.stroke();
        con.closePath();
        con.restore();
      },
    });

    this.collisionNode.on('mouseenter', () => {
      document.body.style.cursor = 'ew-resize';
    });

    this.collisionNode.on('mouseleave', () => {
      if (this.state !== 'dragging') {
        document.body.style.cursor = '';
      }
    });

    this.collisionNode.on('dragstart', () => {
      this.state = 'dragging';
      this.draStartEvent.trigger(this.config.direction);
    });

    this.collisionNode.on('dragmove', (e) => {
      this.dragEvent.trigger(this.config.direction, e.evt.movementX);
    });

    this.collisionNode.on('dragend', () => {
      this.state = 'pending';
      document.body.style.cursor = '';
      this.dragEndEvent.trigger(this.config.direction);
    });

    const visibleTweenGroup = useTweenGroup({
      node: this.wrapperNode,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
    this.show = () => {
      visibleTweenGroup.play({ opacity: 1 });
    };
    this.hide = () => {
      visibleTweenGroup.play({ opacity: 0 });
    };
  }

  mount(parentNode: Konva.Group) {
    this.parentNode = parentNode;
    parentNode.add(this.wrapperNode);
    this.wrapperNode.add(this.collisionNode);
    this.wrapperNode.add(this.node);
    this.update();
  }

  update() {
    if (!this.parentNode) return;
    const x = this.config.direction === 'left' ? 0 : this.parentNode.width() - this.wrapperNode.width();
    this.wrapperNode.x(x);
    this.wrapperNode.height(this.parentNode.height());

    this.node.width(this.wrapperNode.width());
    this.node.height(this.wrapperNode.height());

    this.collisionNode.x(0);
    this.collisionNode.width(this.wrapperNode.width());
    this.collisionNode.height(this.wrapperNode.height());
    this.collisionNode.fill(this.store.colorStyles.PrimaryPressed);
  }

  unmount() {
  }

  @GanttEventDecorator()
  declare draStartEvent: GanttEvent<(direction: 'left' | 'right') => void>;

  @GanttEventDecorator()
  declare dragEvent: GanttEvent<(direction: 'left' | 'right', dx: number) => void>;

  @GanttEventDecorator()
  declare dragEndEvent: GanttEvent<(direction: 'left' | 'right') => void>;
}

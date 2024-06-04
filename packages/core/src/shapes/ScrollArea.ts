import Konva from 'konva';
import _, { clamp } from 'lodash';
import { GanttEffectComponent, GanttEffectUpdate } from '../decorators';
import type { GanttStore } from '../store';
import { useStore } from '../store';

@GanttEffectComponent(useStore)
export class ScrollArea {
  declare store: GanttStore;

  verticalBar: Konva.Rect;

  horizontalBar: Konva.Rect;

  groupNode: Konva.Group;

  get maxY() {
    return this.groupNode.height() - this.verticalBar.height();
  }

  get maxX() {
    return this.groupNode.width() - this.horizontalBar.width();
  }

  get verticalRatio() {
    return (this.groupNode.height() - this.verticalBar.height()) / (this.store.contentHeight - this.containerNode.height());
  }

  get horizontalRatio() {
    return (this.groupNode.width() - this.horizontalBar.width()) / (this.store.contentWidth - this.containerNode.width());
  }

  constructor(private containerNode: Konva.Group, private config: { padding: number }) {
    this.groupNode = new Konva.Group({
      listening: false,
    });
    const verticalBar = new Konva.Rect({
      width: 10,
      height: 100,
      fill: 'grey',
      opacity: 0.8,
      x: this.groupNode.width() - this.config.padding - 10,
      y: 0,
      draggable: true,
      dragBoundFunc: (pos) => {
        const startPosition = this.groupNode.getAbsolutePosition();
        pos.x = this.verticalBar.absolutePosition().x;
        pos.y = _.clamp(pos.y, startPosition.y, startPosition.y + this.maxY);
        return pos;
      },
    });
    // layer.add(verticalBar);
    this.groupNode.add(verticalBar);

    verticalBar.on('dragmove', () => {
      // delta in %
      const delta = (verticalBar.y() / this.groupNode.height()) * this.store.contentHeight;

      this.store.scrollY = delta;
      // content.y(-(HEIGHT - this.groupNode.height()) * delta);
    });

    const horizontalBar = new Konva.Rect({
      width: 100,
      height: 10,
      fill: 'grey',
      opacity: 0.8,
      x: 0,
      y: this.groupNode.height() - this.config.padding - 10,
      draggable: true,
      dragBoundFunc: (pos) => {
        const startPosition = this.groupNode.getAbsolutePosition();
        pos.x = _.clamp(pos.x, startPosition.x, startPosition.x + this.maxX);
        pos.y = this.horizontalBar.absolutePosition().y;

        return pos;
      },
    });
    this.groupNode.add(horizontalBar);

    horizontalBar.on('dragmove', () => {
      // delta in %
      const delta = (horizontalBar.x() / this.groupNode.width()) * this.store.contentWidth;
      this.store.scrollX = delta;
    });

    this.containerNode.add(this.groupNode);

    this.containerNode.on('wheel', (e) => {
      // prevent parentNode scrolling
      e.evt.preventDefault();
      const dx = e.evt.deltaX / this.horizontalRatio;
      const dy = e.evt.deltaY / this.verticalRatio;

      this.store.scrollX = _.clamp(this.store.scrollX + dx, 0, this.store.contentWidth - this.containerNode.width());
      this.store.scrollY = _.clamp(this.store.scrollY + dy / 10, 0, this.store.contentHeight - this.containerNode.height());
    });

    this.verticalBar = verticalBar;
    this.horizontalBar = horizontalBar;
  }

  mount() {
    this.update();
  }

  @GanttEffectUpdate()
  update() {
    this.groupNode.width(this.containerNode!.width());
    this.groupNode.height(this.containerNode!.height());

    this.verticalBar.height(clamp(this.store.contentHeight / this.store.height / 10, 10, this.store.height - 50));
    this.horizontalBar.width(clamp((this.store.contentWidth / this.store.width) * 3, 10, this.store.width - 50));
    const vy = this.store.scrollY * this.verticalRatio;
    this.verticalBar.y(vy);
    this.verticalBar.x(this.groupNode.width() - this.config.padding - this.verticalBar.width());

    const hx = this.store.scrollX * this.horizontalRatio;
    this.horizontalBar.x(hx);
    this.horizontalBar.y(this.groupNode.height() - this.config.padding - this.horizontalBar.height());
    this.groupNode.zIndex(this.groupNode.parent!.children.length - 1);
  }

  unmount() {
    this.groupNode.remove();
  }
}

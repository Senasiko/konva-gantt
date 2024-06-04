import Konva from 'konva';
import { GanttEffectComponent, GanttEffectUpdate } from '../../decorators';
import type { GanttStore } from '../../store';
import { useStore } from '../../store';

import { useNodeEdit } from './useNodeEdit';

@GanttEffectComponent(useStore)
export class GanttTableCell {
  declare store: GanttStore;

  cellNode: Konva.Group;

  indexNode: Konva.Text;

  childBorderNode: Konva.Shape;

  textNode: Konva.Text;

  parentNode?: Konva.Group;

  styles = {
    indexWidth: 30,
    childBorderRadius: 8,
  };

  get block() {
    return this.store.getBlockByKey(this.key);
  }

  get isChild() {
    return !!this.block.parentKey!;
  }

  get isLastChild() {
    if (!this.isChild) return this.isChild;

    const children = this.store.blockTree[this.block.parentKey!];
    return children[children.length - 1]?.key === this.block.key;
  }

  constructor(private key: string) {
    const store = useStore();
    const block = store.getBlockByKey(key);
    this.cellNode = new Konva.Group();
    this.indexNode = new Konva.Text({
      text: (block.index + 1).toString(),
      x: 0,
      y: 0,
      verticalAlign: 'middle',
      align: 'center',
      width: this.styles.indexWidth,
    });
    this.textNode = new Konva.Text({
      text: block.text,
      x: 0,
      y: 0,
      ellipsis: true,
      fontSize: 12,
    });

    this.childBorderNode = new Konva.Shape({
      listening: false,
      sceneFunc: (ctx, shape) => {
        if (!this.isChild) {
          ctx.save();
          ctx.strokeStyle = this.store.colorStyles.Border;
          ctx.moveTo(0, shape.height());
          ctx.lineTo(shape.width(), shape.height());
          ctx.stroke();
          ctx.closePath();
          ctx.restore();
          return;
        }
        const radius = this.styles.childBorderRadius;
        ctx.save();

        ctx.fillStyle = this.store.colorStyles.BackgroundPrimary;
        ctx.fillRect(0, 0, shape.width(), shape.height());

        ctx.strokeStyle = this.store.colorStyles.Border;
        ctx.beginPath();
        ctx.moveTo(this.indexNode.width() / 2, 0);
        ctx.lineTo(this.indexNode.width() / 2, shape.height() - radius);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.indexNode.width() / 2 + radius, shape.height() - radius, radius, Math.PI / 2, Math.PI, false);
        ctx.stroke();
        ctx.closePath();

        if (!this.isLastChild) {
          ctx.beginPath();
          ctx.moveTo(this.indexNode.width() / 2, shape.height() - radius);
          ctx.lineTo(this.indexNode.width() / 2, shape.height());
          ctx.stroke();
          ctx.closePath();
        }

        ctx.beginPath();
        ctx.moveTo(this.isLastChild ? 0 : this.indexNode.width() / 2 + radius, shape.height());
        ctx.lineTo(shape.width(), shape.height());
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
      },
    });

    useNodeEdit(this.textNode, (value) => {
      block.text = value;
    });
  }

  mount(parentNode: Konva.Group) {
    this.parentNode = parentNode;
    this.cellNode.add(this.childBorderNode);
    this.cellNode.add(this.indexNode);
    this.cellNode.add(this.textNode);
    parentNode.add(this.cellNode);
  }

  renderIndex() {
    if (this.isChild) {
      this.indexNode.visible(false);
    } else {
      this.indexNode.visible(true);
      this.indexNode.fill(this.store.colorStyles.TextPrimary);
      this.indexNode.text((this.block.index + 1).toString());
      this.indexNode.width(this.styles.indexWidth);
      this.indexNode.height(this.cellNode.height());
    }
  }

  renderChildBorder() {
    this.childBorderNode.width(this.cellNode.width());
    this.childBorderNode.height(this.cellNode.height());
  }

  @GanttEffectUpdate()
  update(y: number, paddingLeft: number = 0) {
    this.cellNode.x(paddingLeft);
    this.cellNode.y(y);
    this.cellNode.width(this.parentNode!.width() - paddingLeft - 1);
    this.cellNode.height(this.store.viewConfig.lineHeight);
    this.renderIndex();
    this.renderChildBorder();
    this.textNode.fill(this.store.colorStyles.TextPrimary);
    this.textNode.text(this.block.text);
    this.textNode.x(this.indexNode.width() + 10);
    this.textNode.width(this.cellNode.width() - this.textNode.x() - 10);
    this.textNode.height(this.textNode.fontSize());
    this.textNode.y(this.cellNode.height() / 2 - this.textNode.height() / 2);
  }

  unmount() {
    this.cellNode.remove();
  }
}

import Konva from 'konva';
import type { Context } from 'konva/lib/Context';
import _ from 'lodash';

export class ShapeBorder extends Konva.Rect {
  private config = {
    color: '',
    right: 0,
    top: 0,
    bottom: 0,
    left: 0,

    bottomStart: 0,
  };

  constructor(private containerNode: Konva.Node, config?: Partial<ShapeBorder['config']> & Konva.RectConfig) {
    super(config);
    this.listening(false);
    this.config = _.merge(this.config, config);
  }

  update(config?: Partial<ShapeBorder['config']>) {
    this.config = _.merge(this.config, config);
    this.width(this.containerNode.width());
    this.height(this.containerNode.height());
  }

  _sceneFunc(context: Context): void {
    context.save();

    if (this.fill() !== undefined && this.fill() !== '') {
      context.fillStyle = this.fill();
      context.rect(this.config.left, this.config.top, this.width() - this.config.left - this.config.right, this.height() - this.config.top - this.config.bottom);
      context.fill();
    }
    context.strokeStyle = this.config.color;
    context.lineWidth = 1;
    if (this.config.left > 0) {
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(0, this.height());
      context.stroke();
      context.closePath();
    }
    if (this.config.bottom > 0) {
      context.beginPath();
      context.moveTo(this.config.bottomStart, this.height());
      context.lineTo(this.width(), this.height());
      context.stroke();
      context.closePath();
    }
    if (this.config.right > 0) {
      context.beginPath();
      context.moveTo(this.width(), 0);
      context.lineTo(this.width(), this.height());
      context.stroke();
      context.closePath();
    }
    if (this.config.top > 0) {
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(this.width(), 0);
      context.stroke();
      context.closePath();
    }
    context.restore();
  }
}

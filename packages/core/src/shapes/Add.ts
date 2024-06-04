import Konva from 'konva';
import type { Context } from 'konva/lib/Context';
import { useStore } from '../store';

export class ShapeAdd extends Konva.Shape {
  _sceneFunc(context: Context) {
    const store = useStore();
    context.save();
    context.strokeStyle = store.colorStyles.Grey;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(this.width() / 2, 0);
    context.lineTo(this.width() / 2, this.height());
    context.closePath();
    context.stroke();

    context.beginPath();
    context.moveTo(0, this.height() / 2);
    context.lineTo(this.width(), this.height() / 2);
    context.closePath();
    context.stroke();
    context.restore();
  }
}

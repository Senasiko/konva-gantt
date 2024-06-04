import Konva from 'konva';
import type { Rect, RectConfig } from 'konva/lib/shapes/Rect';

export class ShapeRect {
  node: Rect;

  constructor(config?: RectConfig) {
    this.node = new Konva.Rect(config);

    if (config?.draggable === true) {
      this.node.on('mouseover', () => {
        document.body.style.cursor = 'pointer';
      });
      this.node.on('mouseout', () => {
        document.body.style.cursor = 'default';
      });
      this.node.on('drop', () => {
        console.log('drop');
      });
    }
  }

  mount(parentNode: Konva.Layer | Konva.Group) {
    parentNode.add(this.node);
  }

  update() {
  }

  unmount() {
    this.node.remove();
  }
}

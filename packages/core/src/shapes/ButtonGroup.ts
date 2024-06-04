import Konva from 'konva';
import _ from 'lodash';
import type { ShapeButton } from './Button';

export class ButtonGroup {
  groupNode: Konva.Group;

  constructor(private buttons: ShapeButton[], public config: {
    align: 'left' | 'right';
    gap: number;
  }) {
    this.groupNode = new Konva.Group();
  }

  mount(parentNode: Konva.Group) {
    parentNode.add(this.groupNode);
    this.buttons.forEach((button) => {
      button.mount(this.groupNode);
    });
  }

  update(config: { x: number, y: number }) {
    this.groupNode.x(config.x);
    this.groupNode.y(config.y);
    this.buttons.forEach((button) => {
      button.update();
    });

    if (this.config.align === 'left') {
      let x = 0;
      this.buttons.forEach((button) => {
        button.update(x, 0);
        x += button.width() + this.config.gap;
      });
    } else if (this.config.align === 'right') {
      let x = 0;
      _.forEachRight(this.buttons, (button) => {
        x -= button.width();
        button.update(x, 0);
        x -= this.config.gap;
      });
    }
  }
}

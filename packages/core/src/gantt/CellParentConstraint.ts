import Konva from 'konva';

import { StateManager } from '../utils/StateManager';
import type { GanttStore } from '../store';
import { useStore } from '../store';
import { GanttEffectComponent, GanttEffectUpdate } from '../decorators';

@GanttEffectComponent(useStore)
export class GanttCellParentConstraint {
  private parentNode?: Konva.Group;

  node: Konva.Shape;

  state = new StateManager<'hidden' | 'show' | 'opacity'>('hidden');

  declare store: GanttStore;

  constructor(private key: string, private mode: 'start' | 'end') {
    this.node = new Konva.Shape({
      width: 12,
      height: 12,
      sceneFunc: (con, shape) => {
        if (this.state.activeState === 'hidden') {
          return;
        }

        con.save();
        con.fillStyle = this.store.colorStyles.Primary;
        con.beginPath();
        if (mode === 'end') {
          con.moveTo(0, 0);
          con.lineTo(shape.width(), 0);
          con.lineTo(shape.width(), shape.height());
          con.moveTo(0, 0);
        } else {
          con.moveTo(0, 0);
          con.lineTo(0, shape.height());
          con.lineTo(shape.width(), 0);
          con.moveTo(0, 0);
        }
        con.fill();
        con.closePath();

        con.restore();
      },
    });
  }

  mount(parentNode: Konva.Group) {
    this.parentNode = parentNode;

    if (this.node.parent !== parentNode) {
      this.parentNode.add(this.node);
    }

    this.update();
  }

  @GanttEffectUpdate()
  update(hover?: boolean) {
    const block = this.store.getBlockByKey(this.key);
    if (this.mode === 'start') {
      this.state.to(undefined, block.startConstraint === true ? 'show' : 'hidden');
    } else if (this.mode === 'end') {
      this.state.to(undefined, block.endConstraint === true ? 'show' : 'hidden');
    }
    this.node.x(this.mode === 'start' ? 0 : this.parentNode!.width() - this.node.width());
    this.node.y(this.parentNode!.height() - 6);
    this.node.zIndex(0);

    if (hover === true) {
      this.state.to('hidden', 'opacity');
    } else {
      this.state.to('opacity', 'hidden');
    }

    if (this.state.activeState === 'opacity') {
      this.node.opacity(0.5);
    } else {
      this.node.opacity(1);
    }
  }

  unmount() {
    this.node.remove();
  }
}

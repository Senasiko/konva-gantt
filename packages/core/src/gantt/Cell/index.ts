import Konva from 'konva';
import dayjs from 'dayjs';
import { ShapeRect } from '../../shapes/Rect';
import type { GanttEvent } from '../../decorators';
import {
  ComputedGet, GanttEventDecorator, GanttEffectComponent, GanttEffectUpdate,
} from '../../decorators';
import type { GanttStore } from '../../store';
import { useStore } from '../../store';

import { StateManager } from '../../utils/StateManager';
import { useExpend } from './useExpend';
import { useDragger } from './useDragger';
import { useParentConstraint } from './useParentConstraint';
import type { GanttTimelineBlock } from '../TimelineBlock';
import type { IAssembledComponent } from '../../interfaces';
import { createAssemblePipeline } from '../../utils/assemble';

export type CellCurrentState = ReturnType<GanttCell['state']['to']>;

export interface IGanttCellParentContainer {
  blockGanttMap: Map<string, GanttTimelineBlock>;
  constraintContainerNode: Konva.Group;
}

@GanttEffectComponent(useStore)
export class GanttCell implements IAssembledComponent {
  declare store: GanttStore;

  static Name = 'GanttCell';

  style = {
    padding: 20,
    blockGap: 8,
  };

  wrapperNode: Konva.Group;

  textNode: Konva.Text;

  rectNode: ShapeRect;

  parentNode?: Konva.Group;

  expends: {
    update: () => void;
    mount: (parentNode: Konva.Group) => void;
    state: {
      left: number,
      right: number,
    }
  };

  dragger: {
    x: number;
    y: number;
  };

  parentConstraint: ReturnType<typeof useParentConstraint>;

  state = new StateManager<'normal' | 'expending' | 'dragging' | 'hovering'>('normal');

  pipeline: { mount: (parent: Konva.Group) => void, update: () => void, unmount: () => void };

  get block() {
    return this.store.getBlockByKey(this.key);
  }

  get blockPosition() {
    return {
      x: 0,
      y: 0,
    };
  }

  get blockHeight() {
    return this.store.viewConfig.lineHeight;
  }

  @ComputedGet()
  get cellWidth() {
    const diffIndex = dayjs(this.block.endTime).diff(this.block.startTime, this.store.viewConfig.mode) + 1;
    return diffIndex * this.store.currentTimeCellWidth - this.expends.state.left + this.expends.state.right;
  }

  @ComputedGet()
  get cellHeight() {
    return this.blockHeight - this.style.blockGap;
  }

  get cellPosition() {
    return {
      x: this.wrapperNode.x(),
      y: this.wrapperNode.y(),
    };
  }

  constructor(public key: string, public rootContainer: IGanttCellParentContainer) {
    const store = useStore();
    this.wrapperNode = new Konva.Group({
      draggable: false,
      name: `BlockWrapper-${key}`,
    });

    this.rectNode = new ShapeRect({
      x: 0,
      y: 0,
      draggable: true,
    });
    this.rectNode.mount(this.wrapperNode);
    this.initListener();

    this.textNode = new Konva.Text({
      text: store.getBlockByKey(this.key).text,
      fontSize: 12,
      fill: '#fff',
      ellipsis: true,
      listening: false,
      verticalAlign: 'top',
      wrap: 'none',
    });

    this.expends = useExpend(this);
    this.dragger = useDragger(this);
    this.parentConstraint = useParentConstraint(this);

    this.pipeline = createAssemblePipeline(GanttCell.Name, this);
  }

  mount(parentNode: Konva.Layer | Konva.Group) {
    this.parentNode = parentNode;
    parentNode.add(this.wrapperNode);
    this.expends.mount(this.wrapperNode);
    this.wrapperNode.add(this.textNode);
    this.pipeline.mount(this.wrapperNode);
  }

  initListener() {
    let state: CellCurrentState;
    this.wrapperNode.on('mouseenter', () => {
      state = this.state.to('normal', 'hovering');
    });

    this.wrapperNode.on('mouseleave', () => {
      this.state.revoke(state);
    });
  }

  @GanttEffectUpdate()
  update() {
    if (!this.block.startTime || !this.block.endTime) return;
    const x = this.store.getBlockXByDate(dayjs(this.block.startTime));
    const { y } = this.blockPosition;
    let position = {
      x,
      y: y + this.style.blockGap / 2,
    };
    if (this.state.activeState === 'expending') {
      position = {
        x: position.x + this.expends.state.left,
        y: position.y,
      };
    }
    if (this.state.activeState === 'dragging') {
      position = {
        x: position.x + this.dragger.x,
        y: position.y + this.dragger.y,
      };
    }
    this.wrapperNode.x(position.x);
    this.wrapperNode.y(position.y);
    this.wrapperNode.height(this.cellHeight);
    this.wrapperNode.width(this.cellWidth);
    this.renderRect();
    this.renderText();
    if (this.state.activeState === 'hovering' || this.state.activeState === 'expending') {
      this.expends.update();
    }
    this.expends.update();
    this.parentConstraint.update();
    this.pipeline.update();
    this.updatedEvent.trigger();
  }

  @GanttEventDecorator()
  declare mountedEvent: GanttEvent;

  @GanttEventDecorator()
  declare updatedEvent: GanttEvent;

  @GanttEventDecorator()
  declare unmountedEvent: GanttEvent;

  @GanttEffectUpdate()
  renderRect() {
    const { node: rectNode } = this.rectNode;
    switch (this.state.activeState) {
      case 'hovering':
      case 'expending':
      case 'dragging':
        rectNode.fill(this.store.colorStyles.PrimaryHover);
        break;
      default:
        rectNode.fill(this.store.colorStyles.Primary);
        break;
    }
    rectNode.y(0);
    rectNode.x(0);
    rectNode.width(this.cellWidth);
    rectNode.height(this.cellHeight);
    rectNode.cornerRadius(6);
    rectNode.fill(this.store.colorStyles.Primary);
  }

  @GanttEffectUpdate()
  renderText() {
    this.textNode.text(this.block.text);
    this.textNode.width(this.cellWidth - this.style.padding * 2);
    this.textNode.height(this.cellHeight);
    this.textNode.lineHeight(1);
    this.textNode.x(this.style.padding);
    this.textNode.y(this.cellHeight / 2 - this.textNode.fontSize() / 2);
  }

  unmount() {
    this.pipeline.unmount();
    this.wrapperNode.remove();
  }
}

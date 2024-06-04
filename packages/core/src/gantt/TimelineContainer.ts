import Konva from 'konva';
import { nextTick, watch } from 'vue';
import { ScrollArea } from '../shapes/ScrollArea';
import { GanttGround } from './Ground';
import { GanttEffectComponent, GanttEffectUpdate } from '../decorators';
import type { GanttStore } from '../store';
import { useStore } from '../store';
import type { IGanttCellParentContainer } from './Cell';
import { GanttTimelineBlock } from './TimelineBlock';
import { GanttHeader } from './Header';
import { GroupStyles, HeaderStyles } from '../styles';
import type { GanttDataBlock } from '../interfaces/data';
import { GanttTimelineGroup } from './TimelineGroup';
import { GanttTimelineAddTime } from './TimelineAddTime';
import { updateWithValidate } from '../utils/node';
import type { IAssembledComponent, IGanttComponent } from '../interfaces';
import { createAssemblePipeline } from '../utils/assemble';

function useAddTimeGantt(container: GanttTimelineContainer) {
  let addTime: GanttTimelineAddTime | undefined;
  let y: number = 0;

  nextTick(() => {
    watch(() => container.store.viewConfig.sortMode, (nv) => {
      if (nv === 'list') {
        addTime = new GanttTimelineAddTime();
        addTime.mount(container.bodyNode);
        addTime.update(y);

        addTime.addBlockEvent.on((startTime, endTime) => {
          container.store.addBlock({ startTime, endTime });
        });
      } else {
        addTime?.unmount();
        addTime = undefined;
      }
    }, {
      immediate: true,
    });
  });

  return {
    update(ny: number) {
      y = ny;
      addTime?.update(ny);
    },
  };
}

@GanttEffectComponent(useStore)
export class GanttTimelineContainer implements IGanttCellParentContainer, IAssembledComponent {
  static Name = 'TimelineContainer';

  layer: Konva.Layer;

  containerNode: Konva.Group;

  scrollArea?: ScrollArea;

  headerGantt: GanttHeader;

  groundGantt: GanttGround;

  bodyNode: Konva.Group;

  groupRectNode: Konva.Rect;

  backgroundNode: Konva.Rect;

  blockGanttMap = new Map<string, GanttTimelineBlock>();

  groupGanttMap = new Map<string, GanttTimelineGroup>();

  private addBlockGantt: ReturnType<typeof useAddTimeGantt>;

  declare store: GanttStore;

  pipeline: IGanttComponent;

  get constraintContainerNode() {
    return this.bodyNode;
  }

  constructor() {
    this.layer = new Konva.Layer();
    this.containerNode = new Konva.Group();
    this.groundGantt = new GanttGround();
    this.headerGantt = new GanttHeader();
    this.bodyNode = new Konva.Group();
    this.groupRectNode = new Konva.Rect();
    this.backgroundNode = new Konva.Rect();

    this.pipeline = createAssemblePipeline(GanttTimelineContainer.Name, this);

    this.addBlockGantt = useAddTimeGantt(this);
  }

  getCellGantt(key: string) {
    return this.blockGanttMap.get(key)?.cellGantt;
  }

  mount(stage: Konva.Stage) {
    stage.add(this.layer);
    this.layer.add(this.containerNode);
    this.containerNode.add(this.backgroundNode);
    this.containerNode.add(this.bodyNode);
    this.groundGantt.mount(this.bodyNode);
    this.headerGantt.mount(this.containerNode);

    this.scrollArea = new ScrollArea(this.bodyNode, { padding: 10 });
    this.scrollArea.mount();
    this.pipeline.mount();
    this.update();
    this.store.interactionModule.timelineContainerNode = this.containerNode;
  }

  mountBlock(block: GanttDataBlock) {
    const blockNode = new GanttTimelineBlock(block.key, this);
    blockNode.mount(this.bodyNode);
    this.blockGanttMap.set(block.key, blockNode);
    this.store.interactionModule.setBlockNode(block.key, blockNode);
  }

  @GanttEffectUpdate()
  update() {
    this.containerNode.x(this.store.viewConfig.tableWidth);
    this.containerNode.width(this.layer.width() - this.containerNode.x());
    this.containerNode.height(this.layer.height());

    this.backgroundNode.fill(this.store.colorStyles.BackgroundLight);
    this.backgroundNode.width(this.containerNode.width());
    this.backgroundNode.height(this.containerNode.height());

    this.store.width = this.containerNode.width();
    this.store.height = this.containerNode.height();
    this.containerNode.clip({
      x: 0,
      y: 0,
      width: this.containerNode.width(),
      height: this.containerNode.height(),
    });

    this.bodyNode.y(HeaderStyles.height);
    this.bodyNode.height(this.layer.height() - HeaderStyles.height);
    this.bodyNode.width(this.containerNode.width());
    this.bodyNode.clip({
      x: 0,
      y: 0,
      width: this.bodyNode.width(),
      height: this.bodyNode.height(),
    });

    let y = -this.store.scrollY;

    // list ground
    updateWithValidate(
      () => this.store.viewConfig.sortMode === 'list',
      this.groundGantt,
      this.bodyNode,
    );


    updateWithValidate(
      () => this.store.viewConfig.sortMode === 'list',
      {
        unmount: () => {
        },
        update: () => {
          const [startIndex, endIndex] = this.store.blockIndexRangeInView;
          y += this.store.blockIndexRangeInView[0] * this.store.viewConfig.lineHeight;
          const newBlockMap = new Map();
          for (let index = startIndex; index <= endIndex; index++) {
            const block = this.store.blocks[index];
            if (!block) continue;
            if (!this.blockGanttMap.has(block.key)) {
              this.mountBlock(block);
            }
            this.blockGanttMap.get(block.key)?.update(y);
            newBlockMap.set(block.key, this.blockGanttMap.get(block.key));
            this.blockGanttMap.delete(block.key);
            y += this.store.viewConfig.lineHeight;
          }
          this.blockGanttMap.forEach((block) => {
            block.unmount();
          });
          this.blockGanttMap = newBlockMap;
          this.addBlockGantt.update(y);
        },
      },
    );

    // group
    updateWithValidate(
      () => this.store.viewConfig.sortMode === 'group',
      {
        unmount: () => {
          Object.keys(this.store.groupMap).forEach((key) => {
            this.groupGanttMap.get(key)?.unmount();
            this.groupGanttMap.delete(key);
          });
          this.groupRectNode.remove();
        },
        update: () => {
          this.bodyNode.add(this.groupRectNode);
          this.groupRectNode.zIndex(0);
          this.groupRectNode.width(this.bodyNode.width());
          this.groupRectNode.height(this.bodyNode.height());
          Object.keys(this.store.groupMap).forEach((key) => {
            y += GroupStyles.MarginTop;
            if (!this.groupGanttMap.has(key)) {
              this.groupGanttMap.set(key, new GanttTimelineGroup(key, this.blockGanttMap));
              this.groupGanttMap.get(key)?.mount(this.bodyNode);
            }
            this.groupGanttMap.get(key)!.update(y);
            y += this.groupGanttMap.get(key)!.wrapperNode.height();
          });
        },
      },
    );
    this.headerGantt.update();
    this.scrollArea?.update();

    this.pipeline.update();
  }

  unmount() {
    this.pipeline.unmount();
  }
}

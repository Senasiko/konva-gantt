import Konva from 'konva';
import { nextTick, watch } from 'vue';
import { GanttEffectComponent, GanttEffectUpdate } from '../decorators';
import type { GanttStore } from '../store';
import { useStore } from '../store';
import { GanttTableCell } from './TableCell';
import { GroupStyles, HeaderStyles } from '../styles';
import { ShapeBorder } from '../shapes/Border';
import { GanttTableHeader } from './TableHeader';
import { GanttTableGroup } from './TableGroup';
import { GanttTableAddBlock } from './TableAddBlock';
import { updateWithValidate } from '../utils/node';

export function useAddBlock(container: GanttTableContainer) {
  let addBlock: GanttTableAddBlock | undefined;
  let y: number = 0;

  nextTick(() => {
    watch(() => container.store.viewConfig.sortMode, (nv) => {
      if (nv === 'list') {
        addBlock = new GanttTableAddBlock();
        addBlock.mount(container.containerNode);
        addBlock.update(y);

        addBlock.addBlockEvent.on(() => {
          container.store.addBlock({});
        });
      } else {
        addBlock?.unmount();
        addBlock = undefined;
      }
    }, {
      immediate: true,
    });
  });

  return {
    update(ny: number) {
      y = ny;
      addBlock?.update(ny);
    },
  };
}

@GanttEffectComponent(useStore)
export class GanttTableContainer {
  declare store: GanttStore;

  layer: Konva.Layer = new Konva.Layer();

  containerNode: Konva.Group = new Konva.Group();

  backgroundNode: Konva.Rect = new Konva.Rect();

  headerGantt: GanttTableHeader;

  borderNode: ShapeBorder;

  bodyNode: Konva.Group = new Konva.Group();

  tableGroupGanttMap = new Map<string, GanttTableGroup>();

  blockNodes = new Map<string, GanttTableCell>();

  addBlock: ReturnType<typeof useAddBlock>;

  constructor() {
    this.borderNode = new ShapeBorder(this.containerNode, { right: 1 });
    this.headerGantt = new GanttTableHeader();
    this.addBlock = useAddBlock(this);
  }

  mount(stage: Konva.Group) {
    stage.add(this.layer);
    this.layer.add(this.containerNode);

    this.containerNode.add(this.backgroundNode);
    this.containerNode.add(this.borderNode);
    this.containerNode.add(this.bodyNode);
    this.headerGantt.mount(this.layer);

    this.update();
  }

  @GanttEffectUpdate()
  update() {
    this.containerNode.width(this.store.viewConfig.tableWidth);
    this.containerNode.height(this.layer.height());

    this.backgroundNode.width(this.containerNode.width());
    this.backgroundNode.height(this.containerNode.height());
    this.backgroundNode.fill(this.store.colorStyles.BackgroundLight);

    this.borderNode.update({ color: this.store.colorStyles.Border });
    this.headerGantt.update();

    this.bodyNode.width(this.store.viewConfig.tableWidth);
    this.bodyNode.height(this.layer.height() - HeaderStyles.height);
    this.bodyNode.y(HeaderStyles.height);
    this.bodyNode.clip({
      x: 0,
      y: 0,
      width: this.bodyNode.width(),
      height: this.bodyNode.height(),
    });

    let y = -this.store.scrollY;
    updateWithValidate(
      () => this.store.viewConfig.sortMode === 'list',
      {
        update: () => {
          const [startIndex, endIndex] = this.store.blockIndexRangeInView;
          y += this.store.blockIndexRangeInView[0] * this.store.viewConfig.lineHeight;
          const newBlockMap = new Map();
          for (let index = startIndex; index <= endIndex; index++) {
            const block = this.store.blocks[index];
            if (!block) continue;
            if (!this.blockNodes.has(block.key)) {
              const blockNode = new GanttTableCell(block.key);
              blockNode.mount(this.bodyNode);
              this.blockNodes.set(block.key, blockNode);
            }
            this.blockNodes.get(block.key)?.update(y);
            newBlockMap.set(block.key, this.blockNodes.get(block.key));
            this.blockNodes.delete(block.key);
            y += this.store.viewConfig.lineHeight;
          }
          this.blockNodes.forEach((block) => {
            block.unmount();
          });
          this.blockNodes = newBlockMap;
          // for (const block of this.store.blocks) {
          //   if (!this.blockNodes.has(block.key)) {
          //     const blockNode = new GanttTableCell(block.key);
          //     blockNode.mount(this.bodyNode);
          //     this.blockNodes.set(block.key, blockNode);
          //   }
          //   this.blockNodes.get(block.key)?.update(y);
          //   y += this.store.viewConfig.lineHeight;
          // }
        },

      },
    );

    updateWithValidate(
      () => this.store.viewConfig.sortMode === 'group',
      {
        unmount: () => {
          this.tableGroupGanttMap.forEach((group) => {
            group.unmount();
            this.tableGroupGanttMap.delete(group.key);
          });
        },
        update: () => {
          Object.keys(this.store.groupMap).forEach((key) => {
            y += GroupStyles.MarginTop;
            if (!this.tableGroupGanttMap.has(key)) {
              this.tableGroupGanttMap.set(key, new GanttTableGroup(key, this.blockNodes));
              this.tableGroupGanttMap.get(key)?.mount(this.bodyNode);
            }
            this.tableGroupGanttMap.get(key)?.update(y);
            y += this.tableGroupGanttMap.get(key)!.wrapperNode.height();
          });
        },
      },
    );

    this.addBlock.update(y);
  }

  unmount() {
  }
}

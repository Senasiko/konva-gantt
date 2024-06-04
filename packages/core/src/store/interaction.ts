import type Konva from 'konva';
import type { Vector2d, IRect } from 'konva/lib/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { GanttTimelineBlock } from '../gantt/TimelineBlock';
import type { GanttTimelineGroup } from '../gantt/TimelineGroup';

function isIntersection(pos: Vector2d, rect: IRect) {
  return (
    pos.x >= rect.x
    && pos.x <= rect.x + rect.width
    && pos.y >= rect.y
    && pos.y <= rect.y + rect.height
  );
}

export const useInteractionStore = defineStore('interaction', () => {
  // state
  const blockNodeMap = new Map<string, GanttTimelineBlock>();
  const groupNodeMap = new Map<string, GanttTimelineGroup>();
  const timelineContainerNode = ref<Konva.Group>();

  const lastBlockKey = '';
  // getters
  // const getBlockByY = (y: number) => {
  //   if (lastBlockKey) { blockOffsetMap.get(lastBlockKey); }
  // };

  function getBlockPosition(key: string) {
    if (!blockNodeMap.has(key)) return undefined;
    return blockNodeMap.get(key)!.wrapperNode.getPosition();
  }

  function getGroupPosition() {
    if (!groupNodeMap.has(lastBlockKey)) return undefined;
    return groupNodeMap.get(lastBlockKey)!.wrapperNode.getPosition();
  }

  function getIntersectionGroupNode(position: Vector2d) {
    for (const groupNode of groupNodeMap.values()) {
      if (isIntersection(position, {
        x: groupNode.wrapperNode.x(),
        y: groupNode.wrapperNode.y(),
        width: groupNode.wrapperNode.width(),
        height: groupNode.wrapperNode.height(),
      })) {
        return groupNode;
      }
    }
    return null;
  }

  function getIntersectionBlockNode(position: Vector2d) {
    for (const block of blockNodeMap.values()) {
      if (isIntersection(position, {
        x: block.wrapperNode.x(),
        y: block.wrapperNode.y(),
        width: block.wrapperNode.width(),
        height: block.wrapperNode.height(),
      })) {
        return block;
      }
    }
    return null;
  }

  return {
    groupNodeMap,
    blockGanttMap: blockNodeMap,
    timelineContainerNode,

    getBlockPosition,
    getGroupPosition,

    setGroupNode(key: string, node: GanttTimelineGroup) {
      groupNodeMap.set(key, node);
    },

    setBlockNode(key: string, node: GanttTimelineBlock) {
      blockNodeMap.set(key, node);
    },

    getCellGantt(key: string) {
      return blockNodeMap.get(key)?.cellGantt;
    },

    getIntersectionBlockNode,
    getIntersectionGroupNode,
  };
});

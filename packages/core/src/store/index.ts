import { defineStore, createPinia } from 'pinia';
import {
  computed, createApp, reactive, ref
} from 'vue';
import dayjs from 'dayjs';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import type {
  GanttDataBlock, GanttViewConfig, GanttViewMode,
} from '../interfaces/data';
import { useInteractionStore } from './interaction';
import {
  ContainerStyles, DarkColorStyles, GroupStyles, LightColorStyles,
} from '../styles';
import type { IAssembleInputFactory } from '../interfaces';

const pinia = createPinia();
const app = createApp({});
app.use(pinia);

export const useStore = defineStore('gantt', () => {
  const interactionModule = useInteractionStore();

  // state
  const blocks = ref<GanttDataBlock[]>([]);

  const startTime = ref<string>('2024-01-01');
  const endTime = ref<string>('2024-05-01');
  const scrollX = ref(0);
  const scrollY = ref(0);
  const width = ref(0);
  const height = ref(0);
  const viewConfig = reactive<GanttViewConfig>({
    mode: 'day',
    lineHeight: 32,
    tableWidth: 250,
    sortMode: 'group',
    theme: 'light',
    timeCellWidthMap: {
      day: 60,
      week: 90,
      month: 60,
      year: 60,
    },
  });

  // getters
  const blockMap = computed(() => _.keyBy(blocks.value, 'key'));
  const blockIndexMap = computed(() => _.keyBy(blocks.value, 'index'));
  const blockTree = computed(() => _.groupBy(blocks.value, 'parentKey'));
  const groupMap = computed(() => _.groupBy(blocks.value, 'groupKey'));
  const getBlockByKey = computed(() => (key: string) => (blockMap.value[key]));
  const getBlockByIndex = computed(() => (index: number) => (blockIndexMap.value[index]));
  const startDate = computed(() => dayjs(startTime.value));
  const endDate = computed(() => dayjs(endTime.value));
  const colorStyles = computed(() => (viewConfig.theme === 'light' ? LightColorStyles : DarkColorStyles));

  const currentTimeCellWidth = computed(() => viewConfig.timeCellWidthMap[viewConfig.mode]);
  const contentWidth = computed(() => currentTimeCellWidth.value * (dayjs(endTime.value).diff(dayjs(startTime.value), viewConfig.mode) + 1));
  const contentHeight = computed(() => {
    const blocksHeight = blocks.value.length * viewConfig.lineHeight;
    if (viewConfig.sortMode === 'list') {
      return blocksHeight;
    }
    return Object.keys(groupMap.value).length * (viewConfig.lineHeight + GroupStyles.MarginTop) + blocksHeight + ContainerStyles.paddingBottom; // group margin top + add block height + blocksHeight;
  });
  const viewStartTimeCellIndex = computed(() => _.floor((scrollX.value / currentTimeCellWidth.value)));
  const viewStartDate = computed(() => startDate.value.add(viewStartTimeCellIndex.value, viewConfig.mode));
  const viewEndTimeCellIndex = computed(() => _.ceil(viewStartTimeCellIndex.value + (width.value / currentTimeCellWidth.value)) + 1);
  const viewEndDate = computed(() => startDate.value.add(viewEndTimeCellIndex.value, viewConfig.mode));
  const viewStartBlockIndex = computed(() => _.floor(scrollY.value / viewConfig.lineHeight));
  const viewEndBlockIndex = computed(() => _.ceil(viewStartBlockIndex.value + (height.value / viewConfig.lineHeight)) + 1);

  const offsetXInView = computed(() => viewStartTimeCellIndex.value * currentTimeCellWidth.value - scrollX.value);
  const getDateByX = computed(() => (x: number) => {
    const timeIndex = _.floor((x - offsetXInView.value) / currentTimeCellWidth.value);
    const date = viewStartDate.value.add(timeIndex, viewConfig.mode);
    return date;
  });
  const getScrollXByDate = computed(() => (date: dayjs.Dayjs) => {
    const timeIndex = date.diff(startDate.value, viewConfig.mode);
    return timeIndex * currentTimeCellWidth.value;
  });

  const getBlockIndexByYInList = computed(() => (y: number) => _.floor((y - scrollY.value) / viewConfig.lineHeight));
  const getBlockYByIndexInList = computed(() => (index: number) => index * viewConfig.lineHeight);
  const getBlockXByDate = computed(() => (date: dayjs.Dayjs) => {
    const timeIndex = date.diff(startDate.value, viewConfig.mode);
    const x = _.floor(timeIndex * currentTimeCellWidth.value - scrollX.value);
    return x;
  });
  const getBlockPosition = computed(() => (key: string) => {
    const block = getBlockByKey.value(key);
    const x = getBlockXByDate.value(dayjs(block.startTime));
    const y = getBlockYByIndexInList.value(block.index);
    return { x, y };
  });
  const floorPositionInList = computed(() => (x: number, y: number): { x: number, y: number } => {
    const date = getDateByX.value(x);
    const index = getBlockIndexByYInList.value(y);
    const existBlock = getBlockByIndex.value(index);
    if (existBlock !== undefined && interactionModule.getBlockPosition(existBlock.key)) {
      return interactionModule.getBlockPosition(existBlock.key)!;
    }
    const floorX = getBlockXByDate.value(date);
    const floorY = getBlockYByIndexInList.value(index);
    return { x: floorX, y: floorY };
  });

  const blockIndexRangeInView = computed(() => {
    const startIndex = viewStartBlockIndex.value;
    const endIndex = viewEndBlockIndex.value;
    return [startIndex, endIndex];
  });

  function changeMode(mode: GanttViewMode) {
    viewConfig.mode = mode;
  }

  function addBlock(block: Partial<GanttDataBlock>) {
    const defaultNewBlock: GanttDataBlock = {
      key: nanoid(),
      startTime: '',
      endTime: '',
      text: '',
      index: blocks.value.length,
    };
    blocks.value.push({ ...defaultNewBlock, ...block });
    _.sortBy(blocks.value, 'index');
  }

  function changeBlockIndex(key: string, index: number) {
    const block = getBlockByKey.value(key);
    const isToAfter = index > block.index;
    if (isToAfter) {
      blocks.value.splice(index, 0, block);
      blocks.value.splice(block.index, 1);
    } else {
      blocks.value.splice(block.index, 1);
      blocks.value.splice(index, 0, block);
    }
    // const startIndex = _.min([block.index, index])!;
    // const endIndex = _.max([block.index, index])!;
    blocks.value.forEach((b, i) => {
      b.index = i;
    });
  }

  function addTime(current: string, diff: number, mode?: GanttViewMode) {
    return dayjs(current).add(diff, mode ?? viewConfig.mode).format('YYYY-MM-DD');
  }

  function amendTimeWithParent(key: string, st: string, et: string) {
    const block = getBlockByKey.value(key);
    const parentBlock = getBlockByKey.value(block.parentKey!);
    const diff = dayjs(et).diff(st, viewConfig.mode);

    if (parentBlock !== undefined) {
      if (dayjs(st).diff(parentBlock.startTime) < 0) {
        st = parentBlock.startTime!;
      }
    }
    et = dayjs(st).add(diff, viewConfig.mode).format('YYYY-MM-DD');
    return {
      startTime: st,
      endTime: et,
    };
  }

  function amendChildrenTime(key: string, diff: number) {
    const children = blockTree.value[key] ?? [];
    children.forEach((child) => {
      const parentAmended = amendTimeWithParent(child.key, addTime(child.startTime, diff), addTime(child.endTime, diff));
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      changeBlockTime(child.key, parentAmended.startTime, parentAmended.endTime);
    });
  }

  const hooks = {
    changeBlockTime: new Set<(key: string, st: string, et: string) => ({ st: string; et: string })>(),
    postChangeBlockTime: new Set<(key: string, st: string, et: string) => void>(),
  };

  function changeBlockTime(key: string, st: string, et: string) {
    const willChangeStartTime = st;
    const willChangeEndTime = et;
    const block = getBlockByKey.value(key);
    const currentStartTime = block.startTime;
    const currentEndTime = block.endTime;

    if (block.startTime === willChangeStartTime && block.endTime === willChangeEndTime) {
      return;
    }

    const parentAmended = amendTimeWithParent(key, st, et);
    st = parentAmended.startTime;
    et = parentAmended.endTime;
    hooks.changeBlockTime.forEach((fn) => {
      const amendedTime = fn(key, st, et);
      st = amendedTime.st;
      et = amendedTime.et;
    });

    if (st > et) {
      throw new Error('invalid time');
    }

    if (st === willChangeStartTime && et === willChangeEndTime) {
      block.startTime = st;
      block.endTime = et;
    } else {
      changeBlockTime(block.key, st, et);
      return;
    }

    try {
      amendChildrenTime(key, dayjs(block.startTime).diff(dayjs(currentStartTime), viewConfig.mode));
      hooks.postChangeBlockTime.forEach((fn) => fn(key, st, et));
    } catch (e) {
      block.startTime = currentStartTime;
      block.endTime = currentEndTime;

      throw e;
    }
  }

  function changeBlockParent(key: string, parentKey: string) {
    const block = getBlockByKey.value(key);
    block.parentKey = parentKey;
  }

  function changeBlockGroup(key: string, groupKey: string) {
    const block = getBlockByKey.value(key);
    block.groupKey = groupKey;
  }

  const assembleInputFactories = new Map<string, IAssembleInputFactory<any>[]>();

  return {
    blocks,
    blockIndexRangeInView,
    startTime,
    endTime,
    scrollX,
    scrollY,
    width,
    height,
    viewConfig,
    groupMap,
    assembleInputFactories,
    hooks,

    blockTree,
    getBlockByKey,
    getBlockByIndex,
    startDate,
    endDate,
    contentWidth,
    contentHeight,
    currentTimeCellWidth,
    viewStartTimeCellIndex,
    viewEndTimeCellIndex,
    viewStartDate,
    viewEndDate,
    offsetXInView,
    getBlockPosition,
    getDateByX,
    getBlockIndexByYInList,
    getBlockXByDate,
    getBlockYByIndexInList,
    floorPositionInList,
    getScrollXByDate,
    colorStyles,

    changeMode,
    addBlock,
    changeBlockIndex,
    changeBlockTime: (...args: Parameters<typeof changeBlockTime>) => {
      try {
        changeBlockTime(...args);
      } catch (e) {
        console.error(e);
      }
    },
    changeBlockGroup,
    changeBlockParent,
    addTime,

    interactionModule,
  };
});

export type GanttStore = ReturnType<typeof useStore>;

// @ts-ignore
window.store = useStore();

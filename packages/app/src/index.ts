import { faker } from '@faker-js/faker';
import { GanttDataBlock, setupGantt, useStore } from '@konva-gantt/core';
import { useConstraintFeature } from '@konva-gantt/feature-constraint';
import { useMilestoneFeature } from '@konva-gantt/feature-milestone';

setupGantt(() => {
  useConstraintFeature();
  useMilestoneFeature();

  const store = useStore();

  function createBlock(): GanttDataBlock {
    return {
      key: faker.string.uuid(),
      text: faker.internet.userName(),
      startTime: faker.date.between({ from: '2024-01-01', to: '2024-01-20' }).toString(),
      endTime: faker.date.between({ from: '2024-01-20', to: '2024-2-30' }).toString(),
      index: faker.number.int(),
    };
  }

  // const blocks = faker.helpers.multiple(createBlock, { count: 10000 });
  // blocks.forEach((b, i) => {
  //   b.index = i;
  //   b.text = (i+1).toString();
  // });
  // store.blocks = blocks;

  store.blocks = [{
    key: '1',
    text: '1',
    startTime: '2024-01-02',
    endTime: '2024-01-05',
    index: 0,
    groupKey: 'a',
  },
  {
    key: '2',
    text: '2',
    startTime: '2024-01-04',
    endTime: '2024-01-05',
    index: 1,
    // parentKey: '1',
    groupKey: 'a',
  },
  {
    key: '3',
    text: '3',
    startTime: '',
    endTime: '2024-01-20',
    index: 2,
    // parentKey: '1',
    groupKey: 'a',
  },
  {
    key: '4',
    text: '4',
    startTime: '2024-01-04',
    endTime: '2024-01-07',
    index: 3,
    groupKey: 'a',
  },
  {
    key: '44',
    text: '44',
    startTime: '2024-01-04',
    endTime: '2024-01-09',
    index: 4,
  },
  {
    key: '11', text: '11', startTime: '2024-01-01', endTime: '2024-02-02', index: 11, groupKey: 'a',
  },
  {
    key: '12', text: '12', startTime: '2024-01-02', endTime: '2024-02-03', index: 12, groupKey: 'b',
  },
  {
    key: '13', text: '13', startTime: '2024-01-03', endTime: '2024-02-04', index: 13, groupKey: 'c',
  },
  {
    key: '14', text: '14', startTime: '2024-01-04', endTime: '2024-02-05', index: 14, groupKey: 'a',
  },
  {
    key: '5', text: '5', startTime: '2024-01-05', endTime: '2024-02-06', index: 5, groupKey: undefined,
  },
  {
    key: '6', text: '6', startTime: '2024-01-06', endTime: '2024-02-07', index: 6, groupKey: 'd',
  },
  {
    key: '7', text: '7', startTime: '2024-01-07', endTime: '2024-02-08', index: 7, groupKey: 'a',
  },
  {
    key: '8', text: '8', startTime: '2024-01-08', endTime: '2024-02-09', index: 8, groupKey: 'b',
  },
  {
    key: '9', text: '9', startTime: '2024-01-09', endTime: '2024-02-10', index: 9, groupKey: 'c',
  },
  {
    key: '10', text: '10', startTime: '2024-01-10', endTime: '2024-02-11', index: 10, groupKey: 'd',
  }].sort((a, b) => a.index - b.index);

  store.viewConfig.theme = 'dark';
  store.viewConfig.sortMode = 'list';
});

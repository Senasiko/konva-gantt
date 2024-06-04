import type Konva from 'konva';
import dayjs from 'dayjs';
import {
  useAssembleInput, useHook, useStore,
} from '@konva-gantt/core';
import { GanttTimelineContainer, GanttCell } from '@konva-gantt/core/gantt';
import type { GanttCellConstraint } from './CellConstraint';
import { createConstraintLine } from './CellConstraint';
import { useConstraintStore, type ConstraintItem } from './store';
import { GanttConstraintPair } from './ConstraintPair';

export function useConstraintFeature() {
  const cellConstraintNodeMap = new Map<string, [GanttCellConstraint, GanttCellConstraint]>();

  const store = useStore();
  const constrainModule = useConstraintStore();

  useAssembleInput<GanttCell>(GanttCell.Name, (cellGantt) => {
    const startConstraint = createConstraintLine(cellGantt, 'start');
    const endConstraint = createConstraintLine(cellGantt, 'end');

    cellConstraintNodeMap.set(cellGantt.key, [startConstraint, endConstraint]);
    return {
      mount(parentNode: Konva.Group) {
        startConstraint.mount(parentNode);
        endConstraint.mount(parentNode);
      },

      update() {
        startConstraint.update();
        endConstraint.update();
      },
      unmount() {
        startConstraint.unmount();
        endConstraint.unmount();
      },
    };
  });

  useAssembleInput<GanttTimelineContainer>(GanttTimelineContainer.Name, (containerGantt) => {
    const constraints: Map<ConstraintItem, Map<ConstraintItem, GanttConstraintPair>> = new Map();

    function mount(constrain: ConstraintItem, constrained: ConstraintItem) {
      const pair = new GanttConstraintPair(constrain, constrained, (key) => {
        const nodes = cellConstraintNodeMap.get(key);
        if (nodes) {
          return {
            start: nodes[0],
            end: nodes[1],
          };
        }
        return undefined;
      });
      if (!constraints.has(constrain)) {
        constraints.set(constrain, new Map());
      }
      constraints.get(constrain)?.set(constrained, pair);
      pair.mount(containerGantt.bodyNode);
      return pair;
    }

    function update() {
      for (const constrain of constrainModule.constrainMap.keys()) {
        const constrainedSet = constrainModule.constrainMap.get(constrain);
        constrainedSet?.forEach((constrained) => {
          let pair = constraints.get(constrain)?.get(constrained);
          if (!pair) {
            pair = mount(constrain, constrained);
            containerGantt.getCellGantt(constrainModule.getKey(constrain))?.updatedEvent.on(update);
            containerGantt.getCellGantt(constrainModule.getKey(constrained))?.updatedEvent.on(update);
          }
          pair.update();
        });
      }
    }

    return {
      update,
      mount() {
      },
      unmount() {
      },
    };
  });

  function amendTimeWithConstrained(key: string, mode: 'start' | 'end', value: string) {
    let currentTime = value;
    Array.from(constrainModule.constrainedMap.get(`${key}-${mode}`) ?? []).forEach((item) => {
      const constrainMode = constrainModule.getMode(item);
      const constrainBlock = store.getBlockByKey(constrainModule.getKey(item));
      const constrainTime = constrainMode === 'start' ? constrainBlock.startTime! : constrainBlock.endTime!;
      const diff = dayjs(currentTime).diff(dayjs(constrainTime), store.viewConfig.mode);
      if (mode === 'start' && diff <= 0) {
        currentTime = mode === constrainMode ? constrainTime : store.addTime(constrainTime, 1);
      } else if (mode === 'end' && diff >= 0) {
        currentTime = mode === constrainMode ? constrainTime : store.addTime(constrainTime, -1);
      }
    });
    return currentTime;
  }

  function amendConstrainTime(key: string) {
    const startConstrained = constrainModule.getConstrained(`${key}-start`) ?? [];
    startConstrained.forEach((item) => {
      const constrainedBlock = store.getBlockByKey(constrainModule.getKey(item));
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      store.changeBlockTime(constrainModule.getKey(item), amendTimeWithConstrained(key, 'start', constrainedBlock.startTime), constrainedBlock.endTime);
    });
    const endConstrained = constrainModule.getConstrained(`${key}-end`) ?? [];
    endConstrained.forEach((item) => {
      const constrainedBlock = store.getBlockByKey(constrainModule.getKey(item));
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      store.changeBlockTime(constrainModule.getKey(item), constrainedBlock.startTime, amendTimeWithConstrained(key, 'end', constrainedBlock.endTime));
    });
  }

  useHook('changeBlockTime', (key, st, et) => ({
    st: amendTimeWithConstrained(key, 'start', st),
    et: amendTimeWithConstrained(key, 'end', et),
  }));

  useHook('postChangeBlockTime', (key) => {
    amendConstrainTime(key);
  });
}

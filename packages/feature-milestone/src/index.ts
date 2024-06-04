import { computed, reactive } from 'vue';
import { useAssembleInput } from '@konva-gantt/core';
import { GanttTimelineContainer } from '@konva-gantt/core/gantt';
import { GanttMilestone } from './Milestone';

export interface GanttDataMilestone {
  key: string;
  text: string;
  time: string;
}

export function useMilestoneFeature() {
  const milestones = reactive<GanttDataMilestone[]>([{
    key: '2024-01-04',
    text: '2024-01-04',
    time: '2024-01-04',
  }, {
    key: '2024-01-05',
    text: '2024-01-05',
    time: '2024-01-05',
  }, {
    key: '2024-01-10',
    text: '2024-01-123fdsafsadf4',
    time: '2024-01-10',
  }]);

  const milestoneMap = computed(() => {
    const map = new Map<string, GanttDataMilestone>();
    milestones.forEach((milestone) => {
      map.set(milestone.key, milestone);
    });
    return map;
  });

  useAssembleInput<GanttTimelineContainer>(GanttTimelineContainer.Name, (timelineGantt) => {
    const milestoneGanttMap = new Map<string, GanttMilestone>();
    return {
      mount() {},
      update() {
        milestones.forEach((milestone) => {
          if (!milestoneGanttMap.has(milestone.key)) {
            milestoneGanttMap.set(milestone.key, new GanttMilestone(milestone.key, (key) => milestoneMap.value.get(key)));
            milestoneGanttMap.get(milestone.key)!.mount(timelineGantt.containerNode);
          }
          milestoneGanttMap.get(milestone.key)!.update();
        });
      },
      unmount() {
        milestones.forEach((milestone) => {
          if (milestoneGanttMap.has(milestone.key)) {
            milestoneGanttMap.get(milestone.key)!.unmount();
            milestoneGanttMap.delete(milestone.key);
          }
        });
      },
    };
  });
}

import weekOfYear from 'dayjs/plugin/weekOfYear';
import dayjs from 'dayjs';
import Konva from 'konva';
import { GanttTimelineContainer } from './gantt/TimelineContainer';
import { GanttTableContainer } from './gantt';

dayjs.extend(weekOfYear);
export * from './store';
export * from './feature';
export * from './styles';
export * from './decorators';
export * from './interfaces';

export function setupGantt(setup: (stage: Konva.Stage) => void) {
  const stage = new Konva.Stage({
    container: 'app',
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const layer = new Konva.Layer();
  setup(stage);

  const table = new GanttTableContainer();
  table.mount(stage);

  const timeline = new GanttTimelineContainer();
  timeline.mount(stage);

  stage.add(layer);
  stage.on('wheel', (e) => {
    e.evt.preventDefault();
  });
}

import Konva from 'konva';
import _ from 'lodash';
import { watch } from 'vue';
import { TextStyles } from '../styles';
import { GanttEffectComponent, GanttEffectUpdate } from '../decorators';
import type { GanttStore } from '../store';
import { useStore } from '../store';
import { ShapeTextButton } from '../shapes/TextButton';
import { ButtonGroup } from '../shapes/ButtonGroup';
import type { GanttViewMode } from '../interfaces/data';

function useModes(parentNode : Konva.Group) {
  const store = useStore();
  const modes: Map<GanttViewMode, ShapeTextButton> = new Map();

  modes.set('day', new ShapeTextButton('day'));
  modes.set('week', new ShapeTextButton('week'));
  modes.set('month', new ShapeTextButton('month'));

  const buttonGroup = new ButtonGroup([...modes.values()], {
    align: 'right',
    gap: 10,
  });

  function update() {
    modes.forEach((mode, key) => {
      mode.setActive(key === store.viewConfig.mode);
    });
    buttonGroup.update({
      x: parentNode.width() - 20,
      y: 10,
    });
  }

  modes.forEach((mode, key) => {
    mode.clickEvent.on(() => {
      mode.setActive(true);
      store.changeMode(key);
    });
  });

  watch(() => store.viewConfig.mode, update);

  return {
    mount() {
      buttonGroup.mount(parentNode);
    },
    update,
  };
}

@GanttEffectComponent(useStore)
export class GanttHeader {
  declare store: GanttStore;

  parentNode?: Konva.Layer | Konva.Group;

  groupNode: Konva.Group;

  titleNode: Konva.Text;

  dateNodes: Konva.Shape;

  modes: ReturnType<typeof useModes>;

  themeNode: ShapeTextButton;

  get currentMonth() {
    return this.store.startDate.add(this.store.viewStartTimeCellIndex, this.store.viewConfig.mode);
  }

  constructor() {
    this.groupNode = new Konva.Group({
      height: 80,
    });

    this.titleNode = new Konva.Text({
      ...TextStyles,
      fontSize: 16,
    });

    this.dateNodes = new Konva.Shape({
      height: 20,
      sceneFunc: (con) => {
        _.range(this.store.viewStartTimeCellIndex, this.store.viewEndTimeCellIndex).forEach((__, indexInView) => {
          const x = indexInView * this.store.currentTimeCellWidth + this.store.currentTimeCellWidth / 2 + this.store.offsetXInView;
          const y = 70;
          con.moveTo(x, y);
          con.textAlign = 'center';
          const date = this.store.getDateByX(x);
          con.fillStyle = this.store.colorStyles.TextPrimary;
          if (this.store.viewConfig.mode === 'day') {
            con.fillText(date.format('D'), x, y);
            if (date.date() === 1) {
              con.save();
              con.font = `16px ${TextStyles.fontFamily}`;
              con.fillText(date.format('MMM'), x, y - 20);
              con.restore();
            }
          } else if (this.store.viewConfig.mode === 'week') {
            con.fillText(date.week().toString(), x, y);
          }
        });
      },
    });

    this.themeNode = new ShapeTextButton('theme');
    this.themeNode.clickEvent.on(() => {
      this.store.viewConfig.theme = this.store.viewConfig.theme === 'light' ? 'dark' : 'light';
    });

    this.modes = useModes(this.groupNode);
  }

  mount(parentNode: Konva.Layer | Konva.Group) {
    this.parentNode = parentNode;
    parentNode.add(this.groupNode);
    this.groupNode.add(this.titleNode);
    this.groupNode.add(this.dateNodes);
    this.themeNode.mount(this.groupNode);
    this.modes.mount();
    this.update();
  }

  @GanttEffectUpdate()
  renderTitle() {
    this.titleNode.text(this.currentMonth.format('MMMM YYYY'));
    this.titleNode.x(10);
    this.titleNode.y(10);
  }

  @GanttEffectUpdate()
  renderDates() {
    this.dateNodes.width(this.groupNode.width());
  }

  @GanttEffectUpdate()
  update() {
    this.groupNode.width(this.parentNode!.width());
    this.renderTitle();
    this.renderDates();
    this.modes.update();
    this.titleNode.fill(this.store.colorStyles.TextPrimary);
    this.themeNode.text = this.store.viewConfig.theme;
    this.themeNode.update(this.groupNode.width() - 230, 10);
  }

  unmount() {
  }
}

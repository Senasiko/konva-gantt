import Konva from 'konva';
import { ShapeButton } from './Button';
import { GanttEffectComponent } from '../decorators';
import type { GanttStore } from '../store';
import { useStore } from '../store';

@GanttEffectComponent(useStore)
export class ShapeTextButton extends ShapeButton {
  declare store: GanttStore;

  private textNode: Konva.Text;

  public buttonStyle: ((backgroundNode: Konva.Rect, textNode: Konva.Text, activeState: 'normal' | 'hovering' | 'active') => void) | undefined;

  constructor(public text: string, private paddingX = 10, private paddingY = 8) {
    super({
      mount: (parentNode: Konva.Group) => {
        parentNode.add(this.textNode);
      },
      update: (backgroundNode: Konva.Rect, activeState: 'normal' | 'hovering' | 'active') => {
        this.textNode.text(this.text);
        if (this.buttonStyle) {
          this.buttonStyle?.(backgroundNode, this.textNode, activeState);
        } else {
          backgroundNode.width(this.textNode.width() + this.paddingX * 2);
          backgroundNode.height(this.textNode.height() + this.paddingY * 2);
          if (activeState === 'normal') {
            backgroundNode.fill('transparent');
            this.textNode.fill(this.store.colorStyles.TextPrimary);
          } else if (activeState === 'hovering') {
            backgroundNode.fill(this.store.colorStyles.PrimaryLight);
            this.textNode.fill('#fff');
            this.textNode.fill(this.store.colorStyles.TextPrimary);
          } else if (activeState === 'active') {
            backgroundNode.fill(this.store.colorStyles.PrimaryHover);
            this.textNode.fill('#fff');
          }
        }
      },
      unmount: () => {
        this.textNode.remove();
      },
    });
    this.textNode = new Konva.Text({
      text,
      x: paddingX,
      y: paddingY,
      fontSize: 12,
      align: 'center',
      verticalAlign: 'middle',
      listening: false,
    });
  }
}

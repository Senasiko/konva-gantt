import type Konva from 'konva';

interface IVerifiableUpdate<T> {
  mount?: (params: T) => void;
  unmount?: () => void;
  update: () => void;
}

export function updateWithValidate<T>(validate: () => boolean, target: IVerifiableUpdate<T>, params: T): void;
export function updateWithValidate(validate: () => boolean, target: Exclude<IVerifiableUpdate<void>, 'mount'>): void;
export function updateWithValidate<T>(validate: () => boolean, target: IVerifiableUpdate<T>, params?: T) {
  if (validate()) {
    target.mount?.(params!);
    target.update();
  } else {
    target.unmount?.();
  }
}

export function getCenterNodePosition(parentNode: Konva.Node, node: Konva.Node): { x: number, y: number } {
  return {
    x: parentNode.x() + parentNode.width() / 2 - node.width() / 2,
    y: parentNode.y() + parentNode.height() / 2 - node.height() / 2,
  };
}

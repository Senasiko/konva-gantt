import Konva from 'konva';

export function useTweenGroup(baseConfig: Konva.TweenConfig) {
  let activeTween: Konva.Tween;
  return {
    play(tweenConfig: Partial<Konva.TweenConfig>) {
      activeTween?.destroy();
      activeTween = new Konva.Tween({ ...baseConfig, ...tweenConfig });
      activeTween.play();
    },
  };
}

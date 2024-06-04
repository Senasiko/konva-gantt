import type Konva from 'konva';
import { useStore } from '../../store';

export function useNodeEdit(node: Konva.Text, onChange: (value: string) => void) {
  const store = useStore();
  node.on('click', () => {
    const input = document.createElement('input');
    const containerNode = document.querySelector('#app')!;
    containerNode.appendChild(input);
    input.style.position = 'absolute';
    input.style.left = `${node.getAbsolutePosition().x - 4}px`;
    input.style.top = `${node.getAbsolutePosition().y + node.height() - store.viewConfig.lineHeight / 2 - 6}px`;
    input.style.width = `${node.width()}px`;
    input.style.height = `${store.viewConfig.lineHeight}px`;
    input.style.lineHeight = `${store.viewConfig.lineHeight}px`;
    input.style.verticalAlign = 'middle';
    input.classList.add('node-input');
    input.value = node.text();
    const clickCb = (e: MouseEvent) => {
      if (e.composedPath().includes(input)) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      destroy();
    };
    setTimeout(() => {
      document.body.addEventListener('click', clickCb);
    });

    function destroy() {
      containerNode.removeChild(input);
      document.body.removeEventListener('click', clickCb);
    }

    input.onchange = () => {
      onChange(input.value);
      destroy();
    };
  });
}

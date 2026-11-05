/** 模态框的关闭能力由调用方控制；进行中的保存操作可以阻止 Escape。 */
interface ModalFocusOptions {
  canClose(): boolean;
  close(): void;
}

/**
 * 将键盘焦点约束在模态框内，并在销毁时恢复打开前的焦点。
 *
 * 只负责可访问性生命周期，不感知具体表单或删除操作。
 */
export function focusModal(node: HTMLElement, options: ModalFocusOptions) {
  const previous = document.activeElement as HTMLElement | null;
  const selector =
    'button:enabled, input:enabled, select:enabled, textarea:enabled, [tabindex="0"]';
  node.querySelector<HTMLElement>(selector)?.focus();

  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && options.canClose()) {
      options.close();
    }
    if (event.key !== 'Tab') {
      return;
    }
    const elements = [...node.querySelectorAll<HTMLElement>(selector)];
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  node.addEventListener('keydown', keydown);

  return {
    destroy() {
      node.removeEventListener('keydown', keydown);
      previous?.focus();
    },
  };
}

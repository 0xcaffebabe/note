import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, ref, type App } from 'vue';
import { useDraggableNavigation } from '@/platform/web/components/navigation/useDraggableNavigation';

const { storage } = vi.hoisted(() => ({ storage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } }));
vi.mock('@/adapters/browser/LocalStorageAdapter', () => ({ browserStorage: storage }));

describe('导航拖拽交互', () => {
  let app: App;
  let drag: ReturnType<typeof useDraggableNavigation>;
  let button: HTMLButtonElement;
  let collapse: ReturnType<typeof vi.fn>;
  const disconnect = vi.fn();
  const pointer = (overrides: Record<string, unknown> = {}) => ({
    pointerId: 1, isPrimary: true, button: 0, clientX: 120, clientY: 120,
    preventDefault: vi.fn(), ...overrides,
  }) as unknown as PointerEvent;
  const click = (detail = 1) => new MouseEvent('click', { detail, cancelable: true });

  function mount(saved: string | null = null, bottom = 884) {
    storage.getItem.mockReturnValue(saved);
    const dock = document.createElement('nav');
    button = document.createElement('button');
    const limits = document.createElement('div');
    const shortcuts = document.createElement('div');
    Object.defineProperty(dock, 'offsetHeight', { value: 54 });
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 100, width: 44, height: 44 } as DOMRect);
    vi.spyOn(limits, 'getBoundingClientRect').mockReturnValue({ left: 8, top: 8, right: 1432, bottom } as DOMRect);
    button.setPointerCapture = vi.fn();
    button.hasPointerCapture = vi.fn(() => true);
    button.releasePointerCapture = vi.fn(id => drag.cancelPointer(pointer({ pointerId: id })));
    collapse = vi.fn();
    const container = document.createElement('div');
    document.body.append(container);
    app = createApp({ setup() {
      drag = useDraggableNavigation(ref(dock), ref(button), ref(shortcuts), ref(limits), ref(false), collapse);
      return () => h('div');
    } });
    app.mount(container);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('innerWidth', 1440);
    vi.stubGlobal('innerHeight', 900);
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnect; });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });
  afterEach(() => {
    app?.unmount();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('点击及小幅抖动保留默认定位，不吞掉点击', () => {
    mount();
    drag.start(pointer());
    drag.move(pointer({ clientX: 123, clientY: 123 }));
    drag.finish(pointer());
    expect(drag.positioned.value).toBe(false);
    expect(collapse).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(drag.consumeClick(click())).toBe(false);
  });

  it('超过阈值后移动，松开时保存，丢失捕获不撤销已完成的拖拽', () => {
    mount();
    drag.start(pointer());
    drag.move(pointer({ clientX: 220, clientY: 180 }));
    expect(drag.dragging.value).toBe(true);
    expect(collapse).toHaveBeenCalledOnce();
    expect(storage.setItem).not.toHaveBeenCalled();
    drag.finish(pointer());
    expect(drag.dragging.value).toBe(false);
    expect(drag.positioned.value).toBe(true);
    expect(storage.setItem).toHaveBeenCalledOnce();
    const [key, raw] = storage.setItem.mock.calls[0];
    expect(key).toBe('site-navigation:position');
    expect(JSON.parse(raw)).toMatchObject({ version: 1 });
    expect(button.releasePointerCapture).not.toHaveBeenCalled();
    drag.lostCapture(pointer({ target: button }));
    expect(drag.positioned.value).toBe(true);
  });

  it('拖拽后的指针点击被消费，键盘点击和下一次主动点击可用', () => {
    mount();
    drag.start(pointer());
    drag.move(pointer({ clientX: 220 }));
    drag.finish(pointer());
    expect(drag.consumeClick(click(0))).toBe(false);
    const generated = click();
    expect(drag.consumeClick(generated)).toBe(true);
    expect(generated.defaultPrevented).toBe(true);
    expect(drag.consumeClick(click())).toBe(false);
  });

  it('没有合成 click 时，也不会吞掉下一次独立按下的点击', () => {
    mount();
    drag.start(pointer());
    drag.move(pointer({ clientX: 220 }));
    drag.finish(pointer());
    drag.start(pointer({ pointerId: 2 }));
    drag.finish(pointer({ pointerId: 2 }));
    expect(drag.consumeClick(click())).toBe(false);
  });

  it('取消首次拖拽恢复默认位置且不写入本地', () => {
    mount();
    drag.start(pointer());
    drag.move(pointer({ clientX: 220 }));
    drag.cancel();
    expect(drag.positioned.value).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('取消后恢复上次保存的位置，忽略无关指针的取消', () => {
    mount('{"version":1,"x":0.5,"y":0.5}');
    const original = { ...drag.dockStyle.value };
    drag.start(pointer());
    drag.move(pointer({ clientX: 220 }));
    drag.cancelPointer(pointer({ pointerId: 2 }));
    expect(drag.dragging.value).toBe(true);
    drag.cancelPointer(pointer());
    expect(drag.dockStyle.value).toEqual(original);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('只接受主指针及鼠标左键', () => {
    mount();
    for (const event of [pointer({ isPrimary: false }), pointer({ button: 2 })]) {
      drag.start(event);
      drag.move(pointer({ clientX: 220 }));
      drag.finish(pointer());
    }
    expect(drag.positioned.value).toBe(false);
    expect(button.setPointerCapture).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('普通触摸保留浏览器原生捕获，开始拖动后才捕获到按钮', () => {
    mount();
    drag.start(pointer({ pointerType: 'touch' }));
    expect(button.setPointerCapture).not.toHaveBeenCalled();
    drag.move(pointer({ pointerType: 'touch', clientX: 123 }));
    expect(button.setPointerCapture).not.toHaveBeenCalled();
    drag.move(pointer({ pointerType: 'touch', clientX: 220 }));
    expect(button.setPointerCapture).toHaveBeenCalledExactlyOnceWith(1);
    drag.finish(pointer({ pointerType: 'touch' }));
    expect(storage.setItem).toHaveBeenCalledOnce();
  });

  it('从图标转移捕获到按钮时，不把图标的 lostpointercapture 当作取消', () => {
    mount();
    drag.start(pointer({ pointerType: 'touch' }));
    drag.move(pointer({ pointerType: 'touch', clientX: 220 }));
    drag.lostCapture(pointer({ target: document.createElementNS('http://www.w3.org/2000/svg', 'svg') }));
    expect(drag.dragging.value).toBe(true);
    drag.finish(pointer({ pointerType: 'touch' }));
    expect(storage.setItem).toHaveBeenCalledOnce();
  });

  it('触摸轻点在 pointerup 激活一次，并忽略随后的兼容 click', () => {
    mount();
    drag.start(pointer({ pointerType: 'touch' }));
    expect(drag.finish(pointer({ pointerType: 'touch' }))).toBe(true);
    expect(button.releasePointerCapture).not.toHaveBeenCalled();
    expect(drag.consumeClick(click())).toBe(true);
    expect(drag.consumeClick(click(0))).toBe(false);
  });

  it('拖动或取消的触摸结束不会被当作轻点激活', () => {
    mount();
    drag.start(pointer({ pointerType: 'touch' }));
    drag.move(pointer({ pointerType: 'touch', clientX: 220 }));
    expect(drag.finish(pointer({ pointerType: 'touch' }))).toBe(false);
    drag.start(pointer({ pointerType: 'touch', pointerId: 2 }));
    drag.cancel();
    expect(drag.finish(pointer({ pointerType: 'touch', pointerId: 2 }))).toBe(false);
  });

  it('触摸在按钮外释放时不激活，也不放行兼容 click', () => {
    mount();
    drag.start(pointer({ pointerType: 'touch', clientX: 101 }));
    expect(drag.finish(pointer({ pointerType: 'touch', clientX: 99 }))).toBe(false);
    expect(drag.consumeClick(click())).toBe(true);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('触摸结束时已越过阈值，即使没有中间 move 也不当作点击', () => {
    mount();
    drag.start(pointer({ pointerType: 'touch' }));
    expect(drag.finish(pointer({ pointerType: 'touch', clientX: 130 }))).toBe(false);
    expect(drag.consumeClick(click())).toBe(true);
  });

  it('重置清除本地记录并回到默认定位', () => {
    mount('{"version":1,"x":0.5,"y":0.5}');
    expect(drag.positioned.value).toBe(true);
    drag.reset();
    expect(drag.positioned.value).toBe(false);
    expect(storage.removeItem).toHaveBeenCalledWith('site-navigation:position');
    expect(drag.hoverBlocked.value).toBe(false);
  });

  it('页面底部预留空间改变时，中间的自定义位置保持一致', () => {
    const saved = '{"version":1,"x":0.5,"y":0.5}';
    mount(saved);
    const top = drag.dockStyle.value!.top;
    app.unmount();
    mount(saved, 700);
    expect(drag.dockStyle.value!.top).toBe(top);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('底部空间不足时只约束显示位置，不覆盖保存的偏好', () => {
    mount('{"version":1,"x":0.5,"y":1}', 700);
    expect(drag.dockStyle.value!.top).toBe('646px');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('卸载取消正在进行的拖拽并释放捕获和观察器', () => {
    mount();
    drag.start(pointer());
    drag.move(pointer({ clientX: 220 }));
    app.unmount();
    expect(button.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

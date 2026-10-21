import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties, type Ref } from 'vue';
import { browserStorage } from '@/adapters/browser/LocalStorageAdapter';
import { clampPoint, parsePosition, restorePosition, savePosition, shortcutLayout, type Bounds, type Point } from './dragPosition';

const POSITION_KEY = 'site-navigation:position';

export function useDraggableNavigation(
  dock: Ref<HTMLElement | undefined>,
  launcher: Ref<HTMLButtonElement | undefined>,
  shortcuts: Ref<HTMLElement | undefined>,
  limits: Ref<HTMLElement | undefined>,
  expanded: Ref<boolean>,
  collapse: () => void,
) {
  const saved = ref(parsePosition(browserStorage.getItem(POSITION_KEY)));
  const pendingPoint = ref<Point | null>(null);
  const dragging = ref(false);
  const hoverBlocked = ref(false);
  const viewportWidth = ref(window.innerWidth);
  const viewportHeight = ref(window.innerHeight);
  const bounds = ref<Bounds>({ left: 8, top: 8, right: window.innerWidth - 8, bottom: window.innerHeight - 16 });
  const size = ref(54);
  const strip = ref({ width: 0, height: 44, gap: 4 });
  let active: { id: number; x: number; y: number; origin: Point; element: HTMLButtonElement } | undefined;
  let suppressClick = false;
  let observer: ResizeObserver | undefined;
  let frame = 0;

  const normalizationBounds = computed(() => ({ ...bounds.value, bottom: viewportHeight.value - 8 }));
  const point = computed(() => pendingPoint.value ?? (saved.value ? clampPoint(restorePosition(saved.value, normalizationBounds.value, size.value), bounds.value, size.value) : null));
  const positioned = computed(() => point.value !== null);
  const layout = computed(() => point.value
    ? shortcutLayout(point.value, bounds.value, size.value, strip.value.width, strip.value.height, strip.value.gap)
    : null);
  const stacked = computed(() => layout.value?.side === 'above' || layout.value?.side === 'below');
  const dockStyle = computed<CSSProperties | undefined>(() => {
    if (!point.value) return;
    const leftward = layout.value?.side === 'left';
    return {
      position: 'fixed', top: `${point.value.y}px`, bottom: 'auto',
      left: leftward ? 'auto' : `${point.value.x}px`,
      right: leftward ? `${viewportWidth.value - point.value.x - size.value}px` : 'auto',
    };
  });
  const shortcutStyle = computed<CSSProperties | undefined>(() => {
    if (!stacked.value || !layout.value) return;
    const desiredTop = point.value!.y + (layout.value.side === 'above' ? -strip.value.height - 10 - strip.value.gap : size.value + strip.value.gap);
    const top = Math.max(bounds.value.top, Math.min(desiredTop, bounds.value.bottom - strip.value.height - 10));
    return {
      left: `${layout.value.offsetX}px`,
      top: `${top - point.value!.y}px`,
      maxHeight: `${Math.max(0, bounds.value.bottom - bounds.value.top)}px`,
      overflowY: 'auto',
    };
  });

  function measure() {
    viewportWidth.value = window.innerWidth;
    viewportHeight.value = window.innerHeight;
    const rect = limits.value?.getBoundingClientRect();
    if (rect) bounds.value = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    if (dock.value) {
      size.value = dock.value.offsetHeight || 54;
      const gap = parseFloat(getComputedStyle(dock.value).columnGap) || 0;
      const element = shortcuts.value;
      if (element?.offsetWidth) {
        const style = getComputedStyle(element);
        const horizontal = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
        const vertical = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
        strip.value = { width: element.offsetWidth - horizontal, height: element.offsetHeight - vertical, gap };
      } else if (strip.value.gap !== gap) strip.value = { ...strip.value, gap };
    }
  }

  function scheduleMeasure() {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure(); });
  }

  function release(element: HTMLButtonElement, id: number) {
    try {
      if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
    } catch { /* 指针已取消或元素已卸载。 */ }
  }

  function start(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || active) return;
    measure();
    const rect = launcher.value?.getBoundingClientRect();
    if (!rect || !launcher.value) return;
    suppressClick = false;
    const padding = (size.value - rect.height) / 2;
    active = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: { x: rect.left - padding, y: rect.top - padding }, element: launcher.value };
    if (event.pointerType !== 'touch') {
      try { active.element.setPointerCapture(event.pointerId); } catch { /* 已取消的指针无需捕获。 */ }
    }
  }

  function move(event: PointerEvent) {
    if (!active || event.pointerId !== active.id) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (!dragging.value && Math.hypot(dx, dy) < 6) return;
    if (!dragging.value) {
      try { active.element.setPointerCapture(event.pointerId); } catch { /* 已取消的指针无需捕获。 */ }
      dragging.value = true;
      hoverBlocked.value = true;
      suppressClick = true;
      collapse();
    }
    if (event.pointerType !== 'touch') event.preventDefault();
    pendingPoint.value = clampPoint({ x: active.origin.x + dx, y: active.origin.y + dy }, bounds.value, size.value);
  }

  function finish(event: PointerEvent) {
    if (!active || event.pointerId !== active.id) return false;
    const rect = launcher.value?.getBoundingClientRect();
    const touchTap = event.pointerType === 'touch' && !dragging.value
      && Math.hypot(event.clientX - active.x, event.clientY - active.y) < 6
      && !!rect && event.clientX >= rect.left && event.clientX <= rect.left + rect.width
      && event.clientY >= rect.top && event.clientY <= rect.top + rect.height;
    active = undefined;
    if (dragging.value && pendingPoint.value) {
      saved.value = savePosition(pendingPoint.value, normalizationBounds.value, size.value);
      browserStorage.setItem(POSITION_KEY, JSON.stringify(saved.value));
    }
    pendingPoint.value = null;
    dragging.value = false;
    // pointerup 会在分发完成后自动释放捕获，保留浏览器的原生 click 合成。
    if (event.pointerType === 'touch') suppressClick = true;
    return touchTap;
  }

  function cancel() {
    if (!active) return;
    const previous = active;
    active = undefined;
    pendingPoint.value = null;
    dragging.value = false;
    release(previous.element, previous.id);
  }

  function cancelPointer(event: PointerEvent) {
    if (active?.id === event.pointerId) cancel();
  }

  function lostCapture(event: PointerEvent) {
    if (active?.element === event.target) cancelPointer(event);
  }

  function consumeClick(event: MouseEvent) {
    if (!suppressClick || event.detail === 0) return false;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  function reset() {
    cancel();
    saved.value = null;
    browserStorage.removeItem(POSITION_KEY);
    hoverBlocked.value = false;
  }

  function allowHover() {
    if (!active) hoverBlocked.value = false;
  }

  function resize() { cancel(); scheduleMeasure(); }
  watch(expanded, () => nextTick(measure));
  onMounted(() => {
    measure();
    observer = new ResizeObserver(scheduleMeasure);
    for (const element of [dock.value, shortcuts.value, limits.value]) if (element) observer.observe(element);
    window.addEventListener('resize', resize);
  });
  onBeforeUnmount(() => {
    cancel();
    observer?.disconnect();
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
  });

  return { positioned, dragging, hoverBlocked, layout, stacked, dockStyle, shortcutStyle, start, move, finish, cancel, cancelPointer, lostCapture, consumeClick, reset, allowHover };
}

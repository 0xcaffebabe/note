type ViewBox = { x: number; y: number; width: number; height: number }
type Point = { x: number; y: number }

function validBox(box: ViewBox) {
  return [box.x, box.y, box.width, box.height].every(Number.isFinite)
    && box.width > 0 && box.height > 0
}

export function createSvgPanZoom(svg: SVGSVGElement) {
  let bounds = svg.viewBox.baseVal
  if (!validBox(bounds)) bounds = svg.getBBox()
  if (!validBox(bounds)) throw new Error('SVG 没有有效的显示范围')
  const initial = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
  let box = { ...initial }
  let scale = 1
  let destroyed = false
  let pointer: {
    id: number; x: number; y: number; startX: number; startY: number
    time: number; touch: boolean; tapped: boolean
  } | null = null
  let previousTap: { x: number; y: number; time: number } | null = null
  let lastTouchEnd = -Infinity
  let wheelFrame = 0
  let wheelDelta = 0
  let wheelPoint = { x: 0, y: 0 }
  const originalTouchAction = svg.style.touchAction
  const originalCursor = svg.style.cursor
  const listeners = new AbortController()
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.style.touchAction = 'none'
  svg.style.cursor = 'grab'

  function render() {
    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`)
  }

  function localPoint(x: number, y: number): Point | null {
    try {
      const matrix = svg.getScreenCTM()
      if (!matrix) return null
      const point = svg.createSVGPoint()
      point.x = x
      point.y = y
      const local = point.matrixTransform(matrix.inverse())
      return Number.isFinite(local.x) && Number.isFinite(local.y) ? local : null
    } catch {
      // 隐藏或已移除的 SVG 可能没有可逆的屏幕矩阵。
      return null
    }
  }

  function zoom(factor: number, point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }) {
    if (destroyed) return
    const nextScale = Math.max(0.5, Math.min(10, scale * factor))
    const ratio = scale / nextScale
    box = {
      x: point.x - (point.x - box.x) * ratio,
      y: point.y - (point.y - box.y) * ratio,
      width: initial.width / nextScale,
      height: initial.height / nextScale,
    }
    scale = nextScale
    render()
  }

  function cancelWheel() {
    cancelAnimationFrame(wheelFrame)
    wheelFrame = 0
    wheelDelta = 0
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault()
    if (pointer || !Number.isFinite(event.deltaY)) return
    // WheelEvent 的行/页单位先换成像素，每帧再限制最大缩放量。
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? svg.getBoundingClientRect().height : 1
    wheelDelta += event.deltaY * unit
    wheelPoint = { x: event.clientX, y: event.clientY }
    if (wheelFrame) return
    wheelFrame = requestAnimationFrame(() => {
      wheelFrame = 0
      const point = localPoint(wheelPoint.x, wheelPoint.y)
      if (point) zoom(Math.exp(-Math.max(-120, Math.min(120, wheelDelta)) * 0.002), point)
      wheelDelta = 0
    })
  }

  function onDoubleClick(event: MouseEvent) {
    event.preventDefault()
    // 触屏已在 pointerup 处理双击，忽略浏览器随后合成的 dblclick。
    if (event.timeStamp - lastTouchEnd < 500) return
    const point = localPoint(event.clientX, event.clientY)
    if (point) zoom(event.shiftKey ? 1 / 2.2 : 2.2, point)
  }

  function onPointerDown(event: PointerEvent) {
    if (pointer) {
      pointer.tapped = false
      previousTap = null
      return
    }
    if (!event.isPrimary || event.button !== 0) return
    event.preventDefault()
    cancelWheel()
    pointer = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY,
      time: event.timeStamp, touch: event.pointerType === 'touch', tapped: true,
    }
    svg.setPointerCapture(event.pointerId)
    svg.style.cursor = 'grabbing'
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) return
    event.preventDefault()
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) >= 10) pointer.tapped = false
    const previous = localPoint(pointer.x, pointer.y)
    const current = localPoint(event.clientX, event.clientY)
    if (previous && current) {
      box.x += previous.x - current.x
      box.y += previous.y - current.y
      render()
    }
    pointer.x = event.clientX
    pointer.y = event.clientY
  }

  function releasePointer() {
    const id = pointer?.id
    pointer = null
    svg.style.cursor = 'grab'
    if (id !== undefined && svg.hasPointerCapture(id)) svg.releasePointerCapture(id)
  }

  function onPointerUp(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) return
    if (pointer.touch) {
      lastTouchEnd = event.timeStamp
      const tap = pointer.tapped && event.timeStamp - pointer.time < 250
        && Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) < 10
      if (tap && previousTap && pointer.time - previousTap.time < 250
        && Math.hypot(event.clientX - previousTap.x, event.clientY - previousTap.y) < 10) {
        const point = localPoint(event.clientX, event.clientY)
        if (point) zoom(2.2, point)
        previousTap = null
      } else {
        previousTap = tap ? { x: event.clientX, y: event.clientY, time: pointer.time } : null
      }
    }
    releasePointer()
  }

  function onPointerCancel(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) return
    // 子节点将隐式捕获转移到根 SVG 时，也会冒泡 lostpointercapture。
    if (event.type === 'lostpointercapture' && event.target !== svg) return
    previousTap = null
    releasePointer()
  }

  // Pointer Events 和 touch-action 不会消费原始触摸手势；Chromium 仍可能在快速拖动后
  // 建立惯性滚动并吞掉下一次按钮点击。在画布起点取消默认手势，平移/双击仍由指针事件处理。
  svg.addEventListener('touchstart', event => event.preventDefault(), { passive: false, signal: listeners.signal })
  svg.addEventListener('wheel', onWheel, { passive: false, signal: listeners.signal })
  svg.addEventListener('dblclick', onDoubleClick, { signal: listeners.signal })
  svg.addEventListener('pointerdown', onPointerDown, { signal: listeners.signal })
  svg.addEventListener('pointermove', onPointerMove, { signal: listeners.signal })
  svg.addEventListener('pointerup', onPointerUp, { signal: listeners.signal })
  svg.addEventListener('pointercancel', onPointerCancel, { signal: listeners.signal })
  svg.addEventListener('lostpointercapture', onPointerCancel, { signal: listeners.signal })
  render()

  return {
    zoomIn() { zoom(1.1) },
    zoomOut() { zoom(1 / 1.1) },
    reset() {
      if (destroyed) return
      cancelWheel()
      releasePointer()
      previousTap = null
      scale = 1
      box = { ...initial }
      render()
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      listeners.abort()
      cancelWheel()
      releasePointer()
      previousTap = null
      svg.style.touchAction = originalTouchAction
      svg.style.cursor = originalCursor
    },
  }
}

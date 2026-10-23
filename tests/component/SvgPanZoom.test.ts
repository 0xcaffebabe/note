import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSvgPanZoom } from '@/platform/web/pages/doc/mermaid-shower/SvgPanZoom'

const readBox = (svg: SVGSVGElement) => {
  const [x, y, width, height] = svg.getAttribute('viewBox')!.split(/\s+/).map(Number)
  return { x, y, width, height }
}

function makeSvg(width = 600, height = 600) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '10 20 200 100')
  Object.defineProperty(svg, 'viewBox', { get: () => ({ baseVal: readBox(svg) }) })
  svg.getBBox = vi.fn(() => ({ x: 10, y: 20, width: 200, height: 100 }) as DOMRect)
  svg.getBoundingClientRect = vi.fn(() => ({ left: 100, top: 50, width, height }) as DOMRect)
  // jsdom 不实现 SVG 矩阵；这里按 xMidYMid meet 建模，包含视口留白。
  svg.getScreenCTM = vi.fn(() => {
    const box = readBox(svg)
    const scale = Math.min(width / box.width, height / box.height)
    const x = 100 + (width - box.width * scale) / 2 - box.x * scale
    const y = 50 + (height - box.height * scale) / 2 - box.y * scale
    return { inverse: () => ({ a: 1 / scale, b: 0, c: 0, d: 1 / scale, e: -x / scale, f: -y / scale }) } as DOMMatrix
  })
  svg.createSVGPoint = () => ({
    x: 0, y: 0,
    matrixTransform(matrix: DOMMatrix) {
      return { x: this.x * matrix.a + this.y * matrix.c + matrix.e, y: this.x * matrix.b + this.y * matrix.d + matrix.f }
    },
  }) as DOMPoint
  const capture = new Set<number>()
  svg.setPointerCapture = vi.fn(id => { capture.add(id) })
  svg.hasPointerCapture = vi.fn(id => capture.has(id))
  svg.releasePointerCapture = vi.fn(id => { capture.delete(id) })
  document.body.append(svg)
  return svg
}

function localPoint(svg: SVGSVGElement, x: number, y: number) {
  const point = svg.createSVGPoint()
  point.x = x
  point.y = y
  return point.matrixTransform(svg.getScreenCTM()!.inverse())
}

function pointer(svg: Element, type: string, options: Record<string, unknown> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, { pointerId: 1, isPrimary: true, button: 0, pointerType: 'mouse', clientX: 400, clientY: 350 })
  for (const [key, value] of Object.entries(options)) Object.defineProperty(event, key, { value })
  svg.dispatchEvent(event)
}

describe('SVG 原生缩放与平移', () => {
  let frames: Map<number, FrameRequestCallback>
  let controller: ReturnType<typeof createSvgPanZoom> | undefined
  beforeEach(() => {
    frames = new Map()
    let frameId = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id) })
  })
  afterEach(() => {
    controller?.destroy()
    controller = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
  function flushWheel() {
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach(callback => callback(0))
  }

  it('以当前视口中心缩放，限制相对初始尺寸的倍率并精确复位', () => {
    const svg = makeSvg()
    controller = createSvgPanZoom(svg)
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet')
    pointer(svg, 'pointerdown')
    pointer(svg, 'pointermove', { clientX: 460, clientY: 380 })
    pointer(svg, 'pointerup')
    const panned = readBox(svg)
    controller.zoomIn()
    const zoomed = readBox(svg)
    expect(zoomed.width).toBeCloseTo(200 / 1.1)
    expect(zoomed.x + zoomed.width / 2).toBeCloseTo(panned.x + panned.width / 2)
    expect(zoomed.y + zoomed.height / 2).toBeCloseTo(panned.y + panned.height / 2)
    for (let i = 0; i < 100; i++) controller.zoomIn()
    expect(readBox(svg).width).toBe(20)
    for (let i = 0; i < 100; i++) controller.zoomOut()
    expect(readBox(svg).width).toBe(400)
    controller.reset()
    expect(readBox(svg)).toEqual({ x: 10, y: 20, width: 200, height: 100 })
  })

  it.each([[600, 600], [900, 200]])('双击及 Shift 双击在 %s×%s 视口留白下保持鼠标锚点', (width, height) => {
    const svg = makeSvg(width, height)
    controller = createSvgPanZoom(svg)
    const before = localPoint(svg, 270, 190)
    svg.dispatchEvent(new MouseEvent('dblclick', { clientX: 270, clientY: 190, cancelable: true }))
    expect(readBox(svg).width).toBeCloseTo(200 / 2.2)
    const after = localPoint(svg, 270, 190)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
    svg.dispatchEvent(new MouseEvent('dblclick', { clientX: 270, clientY: 190, shiftKey: true }))
    expect(readBox(svg).width).toBeCloseTo(200)
    expect(readBox(svg).x).toBeCloseTo(10)
    expect(readBox(svg).y).toBeCloseTo(20)
  })

  it('归一滚轮的像素、行和页单位，同帧合并并限制最大缩放量', () => {
    const svg = makeSvg()
    controller = createSvgPanZoom(svg)
    const widths: number[] = []
    for (const [deltaMode, deltaY] of [[0, -96], [1, -6], [2, -0.16]]) {
      controller.reset()
      const before = localPoint(svg, 270, 190)
      const event = new WheelEvent('wheel', { deltaMode, deltaY, clientX: 270, clientY: 190, cancelable: true })
      svg.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
      flushWheel()
      widths.push(readBox(svg).width)
      expect(localPoint(svg, 270, 190).x).toBeCloseTo(before.x)
      expect(localPoint(svg, 270, 190).y).toBeCloseTo(before.y)
    }
    expect(widths[0]).toBeCloseTo(widths[1])
    expect(widths[0]).toBeCloseTo(widths[2])
    controller.reset()
    for (let i = 0; i < 10; i++) svg.dispatchEvent(new WheelEvent('wheel', { deltaY: -1000 }))
    expect(frames.size).toBe(1)
    flushWheel()
    expect(readBox(svg).width).toBeCloseTo(200 / Math.exp(0.24))
  })

  it('只响应主键和主指针，次指或子节点丢失捕获不打断当前拖动', () => {
    const svg = makeSvg()
    controller = createSvgPanZoom(svg)
    pointer(svg, 'pointerdown', { button: 2 })
    pointer(svg, 'pointerdown', { isPrimary: false })
    pointer(svg, 'pointermove', { clientX: 460 })
    expect(svg.setPointerCapture).not.toHaveBeenCalled()
    pointer(svg, 'pointerdown', { pointerType: 'touch' })
    pointer(svg, 'pointerdown', { pointerType: 'touch', pointerId: 2, isPrimary: false })
    pointer(svg, 'pointerup', { pointerId: 2 })
    const child = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    svg.append(child)
    pointer(child, 'lostpointercapture')
    pointer(svg, 'pointermove', { clientX: 460, clientY: 380 })
    expect(readBox(svg).x).toBeCloseTo(-10)
    expect(readBox(svg).y).toBeCloseTo(10)
    pointer(svg, 'pointercancel', { pointerId: 2 })
    expect(svg.style.cursor).toBe('grabbing')
    pointer(svg, 'pointercancel')
    expect(svg.releasePointerCapture).toHaveBeenCalledWith(1)
    pointer(svg, 'pointermove', { clientX: 520 })
    expect(readBox(svg).x).toBeCloseTo(-10)
    expect(svg.style.cursor).toBe('grab')
    pointer(svg, 'pointerdown')
    pointer(svg, 'lostpointercapture')
    pointer(svg, 'pointermove', { clientX: 520 })
    expect(readBox(svg).x).toBeCloseTo(-10)
  })

  it('触摸双击只缩放一次，拖动、取消或多指动作不算双击', () => {
    const svg = makeSvg()
    controller = createSvgPanZoom(svg)
    const touch = (type: string, timeStamp: number, options: Record<string, unknown> = {}) => pointer(svg, type, { pointerType: 'touch', timeStamp, ...options })
    touch('pointerdown', 100)
    touch('pointerup', 120)
    touch('pointerdown', 200)
    touch('pointerup', 220)
    expect(readBox(svg).width).toBeCloseTo(200 / 2.2)
    const synthesized = new MouseEvent('dblclick', { clientX: 400, clientY: 350 })
    Object.defineProperty(synthesized, 'timeStamp', { value: 221 })
    svg.dispatchEvent(synthesized)
    expect(readBox(svg).width).toBeCloseTo(200 / 2.2)
    controller.reset()
    touch('pointerdown', 1000)
    touch('pointerup', 1020)
    touch('pointerdown', 1100)
    touch('pointerup', 1120, { clientX: 411 })
    touch('pointerdown', 1200)
    touch('pointercancel', 1210)
    touch('pointerdown', 1300)
    touch('pointerdown', 1305, { pointerId: 2, isPrimary: false })
    touch('pointerup', 1320)
    touch('pointerdown', 1400)
    touch('pointerup', 1420)
    expect(readBox(svg).width).toBe(200)
  })

  it('缺少有效 viewBox 时采用图形边界，空图形拒绝初始化', () => {
    const svg = makeSvg()
    svg.setAttribute('viewBox', '0 0 0 0')
    controller = createSvgPanZoom(svg)
    expect(svg.getBBox).toHaveBeenCalledOnce()
    expect(readBox(svg)).toEqual({ x: 10, y: 20, width: 200, height: 100 })
    const empty = makeSvg()
    empty.setAttribute('viewBox', '0 0 NaN 10')
    vi.mocked(empty.getBBox).mockReturnValue({ x: 0, y: 0, width: 0, height: 0 } as DOMRect)
    expect(() => createSvgPanZoom(empty)).toThrow('SVG 没有有效的显示范围')
  })

  it('无可逆矩阵时不写入无效坐标，销毁撤销滚轮帧、捕获和监听器', () => {
    const svg = makeSvg()
    svg.style.touchAction = 'pan-y'
    svg.style.cursor = 'crosshair'
    controller = createSvgPanZoom(svg)
    vi.mocked(svg.getScreenCTM).mockReturnValue(null)
    svg.dispatchEvent(new MouseEvent('dblclick'))
    svg.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }))
    flushWheel()
    expect(readBox(svg).width).toBe(200)
    svg.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }))
    expect(frames.size).toBe(1)
    controller.destroy()
    expect(frames.size).toBe(0)
    expect(svg.style.touchAction).toBe('pan-y')
    expect(svg.style.cursor).toBe('crosshair')
    controller.zoomIn()
    controller.reset()
    pointer(svg, 'pointerdown')
    svg.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }))
    expect(frames.size).toBe(0)
    expect(svg.setPointerCapture).not.toHaveBeenCalled()
    expect(readBox(svg).width).toBe(200)
    controller = createSvgPanZoom(svg)
    pointer(svg, 'pointerdown')
    controller.destroy()
    expect(svg.releasePointerCapture).toHaveBeenCalledWith(1)
  })
})

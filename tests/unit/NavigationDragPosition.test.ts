import { describe, expect, it } from 'vitest'
import { clampPoint, parsePosition, restorePosition, savePosition, shortcutLayout } from '@/platform/web/components/navigation/dragPosition'

const bounds = { left: 8, top: 12, right: 1008, bottom: 712 }
const size = 54

describe('导航拖拽位置持久化', () => {
  it('解析版本与归一化坐标，保留边界值', () => {
    expect(parsePosition('{"version":1,"x":0,"y":1}')).toEqual({ version: 1, x: 0, y: 1 })
    expect(parsePosition('{"version":1,"x":0.25,"y":0.5}')).toEqual({ version: 1, x: 0.25, y: 0.5 })
  })

  it.each([
    null, '', '{', 'null', '[]', '42', '"position"', '{}',
    '{"version":2,"x":0.5,"y":0.5}',
    '{"version":1,"x":"0.5","y":0.5}',
    '{"version":1,"x":null,"y":0.5}',
    '{"version":1,"x":1e309,"y":0.5}',
    '{"version":1,"x":-0.01,"y":0.5}',
    '{"version":1,"x":0.5,"y":1.01}',
    '{"version":1,"x":0.5}',
  ])('损坏或不支持的存储记录退回默认位置：%s', raw => {
    expect(parsePosition(raw)).toBeNull()
  })

  it('拖拽越界时把整个按钮限制在边界内，合法位置不变', () => {
    expect(clampPoint({ x: -20, y: 999 }, bounds, size)).toEqual({ x: 8, y: 658 })
    expect(clampPoint({ x: 9999, y: -20 }, bounds, size)).toEqual({ x: 954, y: 12 })
    expect(clampPoint({ x: 100, y: 200 }, bounds, size)).toEqual({ x: 100, y: 200 })
  })

  it('保存相对可移动范围的位置，并在窗口缩放后恢复相同比例', () => {
    const saved = savePosition({ x: 481, y: 173.5 }, bounds, size)
    expect(saved).toEqual({ version: 1, x: 0.5, y: 0.25 })
    expect(restorePosition(saved, bounds, size)).toEqual({ x: 481, y: 173.5 })
    expect(restorePosition(saved, { left: 10, top: 20, right: 310, bottom: 220 }, 50))
      .toEqual({ x: 135, y: 57.5 })
  })

  it('保存前夹紧坐标，右下边界在不同窗口中仍是右下边界', () => {
    const saved = savePosition({ x: 2000, y: 2000 }, bounds, size)
    expect(saved).toEqual({ version: 1, x: 1, y: 1 })
    expect(restorePosition(saved, { left: 8, top: 8, right: 312, bottom: 632 }, size))
      .toEqual({ x: 258, y: 578 })
  })

  it('可移动范围为零或按钮大于边界时不产生无穷坐标', () => {
    const tiny = { left: 8, top: 12, right: 48, bottom: 66 }
    expect(clampPoint({ x: 50, y: 90 }, tiny, size)).toEqual({ x: 8, y: 12 })
    expect(savePosition({ x: 50, y: 90 }, tiny, size)).toEqual({ version: 1, x: 0, y: 0 })
    expect(restorePosition({ version: 1, x: 1, y: 1 }, tiny, size)).toEqual({ x: 8, y: 12 })
  })
})

describe('导航展开方向与边界', () => {
  const viewport = { left: 8, top: 8, right: 312, bottom: 632 }
  const stripWidth = 220
  const stripHeight = 44

  it('左侧能完整容纳时优先向左展开', () => {
    expect(shortcutLayout({ x: 258, y: 400 }, viewport, size, stripWidth, stripHeight))
      .toEqual({ side: 'left', offsetX: -224 })
  })

  it('靠左边缘时向右展开，避免溢出视口', () => {
    expect(shortcutLayout({ x: 8, y: 400 }, viewport, size, stripWidth, stripHeight))
      .toEqual({ side: 'right', offsetX: 58 })
  })

  it('位于窄屏中间时上下展开，悬浮条夹紧到边界而不移动按钮', () => {
    const anchor = { x: 140, y: 400 }
    const layout = shortcutLayout(anchor, viewport, size, stripWidth, stripHeight)
    expect(layout).toEqual({ side: 'above', offsetX: -58 })
    expect(anchor).toEqual({ x: 140, y: 400 })
    expect(anchor.x + layout.offsetX + stripWidth + 10).toBe(viewport.right)
  })

  it('上方空间不足时选择下方', () => {
    expect(shortcutLayout({ x: 140, y: 12 }, viewport, size, stripWidth, stripHeight))
      .toEqual({ side: 'below', offsetX: -58 })
  })

  it('两侧都能容纳时仍优先向左，并接受自定义间隙', () => {
    expect(shortcutLayout({ x: 400, y: 200 }, bounds, size, stripWidth, stripHeight, 8))
      .toEqual({ side: 'left', offsetX: -228 })
  })

  it('水平恰好可容纳时保持水平展开', () => {
    expect(shortcutLayout({ x: 232, y: 200 }, viewport, size, stripWidth, stripHeight))
      .toEqual({ side: 'left', offsetX: -224 })
    expect(shortcutLayout({ x: 34, y: 200 }, viewport, size, stripWidth, stripHeight))
      .toEqual({ side: 'right', offsetX: 58 })
  })

  it('可用高度过小时选择剩余空间较多的一侧', () => {
    const short = { left: 8, top: 8, right: 312, bottom: 130 }
    expect(shortcutLayout({ x: 140, y: 60 }, short, size, stripWidth, stripHeight).side).toBe('above')
    expect(shortcutLayout({ x: 140, y: 20 }, short, size, stripWidth, stripHeight).side).toBe('below')
  })
})

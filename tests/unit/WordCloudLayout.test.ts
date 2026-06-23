import { describe, it, expect } from 'vitest'
import {
  toGridCoord,
  computeGridBox,
  checkGridCollision,
  markGrid,
  findSpiralPosition,
  type GridMask,
} from '@/core/algorithm/WordCloudLayout'

function makeMask(width: number, height: number): GridMask {
  return { width, height, data: new Uint8Array(width * height) }
}

describe('toGridCoord', () => {
  it('与原内联公式 floor((val/canvasSize)*gridSize) 逐位一致', () => {
    expect(toGridCoord(50, 200, 100)).toBe(Math.floor((50 / 200) * 100))
    expect(toGridCoord(50, 200, 100)).toBe(25)
    expect(toGridCoord(0, 200, 100)).toBe(0)
    expect(toGridCoord(199, 200, 100)).toBe(99)
  })
  it('负坐标 floor 向下取整(用于盒子越过左/上边界时)', () => {
    // floor(-0.5) = -1, 在 computeGridBox 里会被 max(0,...) 夹住, 这里只验 floor 语义
    expect(toGridCoord(-1, 200, 100)).toBe(-1)
  })
})

describe('computeGridBox', () => {
  const mask = makeMask(100, 50)
  // canvas 200x100, 网格 100x50 → x 缩放 0.5, y 缩放 0.5
  it('居中盒按 padding 扩张后换算到网格坐标', () => {
    const box = computeGridBox(mask, 200, 100, 100, 50, 40, 20, 0)
    // left = floor((100-20)/200*100)=40 ; right = floor((100+20)/200*100)=60
    // top = floor((50-10)/100*50)=20 ; bottom = floor((50+10)/100*50)=30
    expect(box).toEqual({ left: 40, top: 20, right: 60, bottom: 30 })
  })
  it('盒越过左/上边界被 max(0,...) 夹到 0', () => {
    const box = computeGridBox(mask, 200, 100, 5, 5, 40, 20, 6)
    expect(box.left).toBe(0)
    expect(box.top).toBe(0)
  })
  it('盒越过右/下边界被 min(grid,...) 夹到网格尺寸', () => {
    const box = computeGridBox(mask, 200, 100, 195, 95, 40, 20, 6)
    expect(box.right).toBe(mask.width)
    expect(box.bottom).toBe(mask.height)
  })
  it('padding 计入边界换算(与 checkCollision/markPlaced 原内联一致)', () => {
    const noPad = computeGridBox(mask, 200, 100, 100, 50, 40, 20, 0)
    const pad = computeGridBox(mask, 200, 100, 100, 50, 40, 20, 10)
    expect(pad.left).toBeLessThan(noPad.left)
    expect(pad.right).toBeGreaterThan(noPad.right)
  })
})

describe('checkGridCollision', () => {
  it('盒覆盖区域内有占位格(>0)则碰撞', () => {
    const mask = makeMask(10, 10)
    mask.data[5 * 10 + 5] = 1
    expect(checkGridCollision(mask, { left: 4, top: 4, right: 7, bottom: 7 })).toBe(true)
  })
  it('盒覆盖区域全空则不碰撞', () => {
    const mask = makeMask(10, 10)
    mask.data[5 * 10 + 5] = 1
    expect(checkGridCollision(mask, { left: 0, top: 0, right: 3, bottom: 3 })).toBe(false)
  })
  it('空盒(right<=left 或 bottom<=top)恒不碰撞', () => {
    const mask = makeMask(10, 10)
    mask.data.fill(1)
    expect(checkGridCollision(mask, { left: 5, top: 5, right: 5, bottom: 8 })).toBe(false)
    expect(checkGridCollision(mask, { left: 5, top: 5, right: 8, bottom: 5 })).toBe(false)
  })
})

describe('markGrid', () => {
  it('把盒覆盖区域全部置 1(原地写回)', () => {
    const mask = makeMask(10, 10)
    markGrid(mask, { left: 2, top: 3, right: 5, bottom: 6 })
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const inside = i >= 3 && i < 6 && j >= 2 && j < 5
        expect(mask.data[i * 10 + j]).toBe(inside ? 1 : 0)
      }
    }
  })
  it('mark 后同盒 checkCollision 必为 true(往返一致)', () => {
    const mask = makeMask(20, 20)
    const box = { left: 4, top: 4, right: 10, bottom: 10 }
    expect(checkGridCollision(mask, box)).toBe(false)
    markGrid(mask, box)
    expect(checkGridCollision(mask, box)).toBe(true)
  })
})

describe('findSpiralPosition', () => {
  const params = {
    canvasWidth: 400,
    canvasHeight: 200,
    size: 20,
    dpr: 1,
    halfW: 30,
    halfH: 10,
  }

  it('无碰撞时返回首个在界内的点(中心附近)', () => {
    const pos = findSpiralPosition(params, () => false)
    expect(pos).not.toBeNull()
    // 中心 (200,100); 起始 radius=size*0.6=12, angle=0 → x=200+cos0*12*stretchX, y=100
    const centerX = 200, centerY = 100
    const stretchX = Math.min(centerX / centerY, 2.6)
    expect(pos!.x).toBeCloseTo(centerX + 12 * stretchX, 9)
    expect(pos!.y).toBeCloseTo(centerY, 9)
  })

  it('全程碰撞 → 螺旋耗尽返回 null', () => {
    expect(findSpiralPosition(params, () => true)).toBeNull()
  })

  it('回调注入: 仅当第一个候选碰撞时落到下一个螺旋点', () => {
    let calls = 0
    const pos = findSpiralPosition(params, () => {
      calls += 1
      return calls === 1 // 第一个候选碰撞, 后续放行
    })
    expect(calls).toBe(2)
    // 第二个点: radius=12.5, angle=0.20
    const centerX = 200, centerY = 100
    const stretchX = Math.min(centerX / centerY, 2.6)
    expect(pos!.x).toBeCloseTo(centerX + Math.cos(0.2) * 12.5 * stretchX, 9)
    expect(pos!.y).toBeCloseTo(centerY + Math.sin(0.2) * 12.5, 9)
  })

  it('逐点几何与原 findPosition 公式一致(无界外裁剪时复算前几步)', () => {
    // 复刻原内联: 取首个 inBounds && !collides 的点; 这里 collides 恒 false 且半包围盒很小
    const p = { canvasWidth: 800, canvasHeight: 400, size: 10, dpr: 2, halfW: 5, halfH: 5 }
    const centerX = p.canvasWidth / 2
    const centerY = p.canvasHeight / 2
    const stretchX = Math.min(centerX / centerY, 2.6)
    const startRadius = p.size * 0.6 * p.dpr
    const expectedX = centerX + Math.cos(0) * startRadius * stretchX
    const expectedY = centerY + Math.sin(0) * startRadius
    const pos = findSpiralPosition(p, () => false)
    expect(pos!.x).toBe(expectedX)
    expect(pos!.y).toBe(expectedY)
  })

  it('界外候选被跳过: margin/halfW 使中心起点出界时继续螺旋', () => {
    // halfW 极大, 使靠近边的点出界; 仍应能找到一个在界内的点或 null, 不抛错
    const wide = { ...params, halfW: 180 }
    const pos = findSpiralPosition(wide, () => false)
    // 不强求具体坐标, 只验证: 若返回则该点严格在界内(margin=4*dpr=4)
    if (pos) {
      expect(pos.x - 180).toBeGreaterThanOrEqual(4)
      expect(pos.x + 180).toBeLessThanOrEqual(wide.canvasWidth - 4)
    }
  })
})

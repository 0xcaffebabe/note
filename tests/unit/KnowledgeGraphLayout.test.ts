import { describe, it, expect } from 'vitest'
import { computeClusterCenters, nodeClusterOffset } from '@/core/algorithm/KnowledgeGraphLayout'

describe('computeClusterCenters', () => {
  it('排除指定分类后, 各分类中心按极坐标均布在以图表中心为圆心的圆上', () => {
    const width = 400
    const height = 200
    const centers = computeClusterCenters(['A', '当前', 'B'], width, height, '当前')

    const centerX = width / 2 // 200
    const centerY = height / 2 // 100
    const clusterRadius = Math.min(centerX, centerY) * 0.55 // min(200,100)*0.55 = 55
    const categoryCount = 2

    // 与原内联实现逐项一致(顺序: 过滤掉"当前"后为 [A, B])
    const expected: Record<string, { x: number; y: number }> = {}
    ;['A', 'B'].forEach((cat, index) => {
      const angle = (index / categoryCount) * 2 * Math.PI - Math.PI / 2
      expected[cat] = {
        x: centerX + clusterRadius * Math.cos(angle),
        y: centerY + clusterRadius * Math.sin(angle),
      }
    })

    expect(Object.keys(centers).sort()).toEqual(['A', 'B'])
    expect(centers.A.x).toBe(expected.A.x)
    expect(centers.A.y).toBe(expected.A.y)
    expect(centers.B.x).toBe(expected.B.x)
    expect(centers.B.y).toBe(expected.B.y)
  })

  it('第一个分类位于圆心正上方(angle = -PI/2)', () => {
    const centers = computeClusterCenters(['only'], 300, 300)
    const centerX = 150
    const centerY = 150
    const clusterRadius = Math.min(centerX, centerY) * 0.55
    // angle = -PI/2 => cos=~0, sin=-1 => 正上方
    expect(centers.only.x).toBeCloseTo(centerX, 9)
    expect(centers.only.y).toBeCloseTo(centerY - clusterRadius, 9)
  })

  it('无 excludeName 时不排除任何分类', () => {
    const centers = computeClusterCenters(['A', '当前', 'B'], 400, 400)
    expect(Object.keys(centers).sort()).toEqual(['A', 'B', '当前'])
  })

  it('过滤后无可用分类时返回空对象', () => {
    expect(computeClusterCenters(['当前'], 400, 400, '当前')).toEqual({})
    expect(computeClusterCenters([], 400, 400)).toEqual({})
  })

  it('clusterRadius 取 min(centerX, centerY) * 0.55, 受较小维度约束', () => {
    // width 远大于 height: 半径由 height/2 决定
    const centers = computeClusterCenters(['A'], 1000, 100)
    const expectedRadius = Math.min(500, 50) * 0.55 // 27.5
    // A 在正上方: y = centerY - radius
    expect(centers.A.y).toBeCloseTo(50 - expectedRadius, 9)
  })
})

describe('nodeClusterOffset', () => {
  it('偏移为半径 min(60, total*8) 的小圆上均布(不含随机)', () => {
    const total = 4
    const spreadRadius = Math.min(60, total * 8) // 32
    for (let idx = 0; idx < total; idx++) {
      const angle = (idx / total) * 2 * Math.PI
      const { dx, dy } = nodeClusterOffset(idx, total)
      expect(dx).toBe(spreadRadius * Math.cos(angle))
      expect(dy).toBe(spreadRadius * Math.sin(angle))
    }
  })

  it('spreadRadius 在节点数较多时封顶为 60', () => {
    // total*8 = 80 > 60 => 取 60
    const { dx, dy } = nodeClusterOffset(0, 10)
    // idx=0 => angle=0 => cos=1, sin=0
    expect(dx).toBe(60)
    expect(dy).toBe(60 * Math.sin(0))
  })

  it('total 较小时 spreadRadius = total*8', () => {
    // total=2 => 16 < 60
    const { dx } = nodeClusterOffset(0, 2)
    expect(dx).toBe(16) // 16 * cos(0)
  })

  it('idx=0 偏移在 +x 方向(angle=0)', () => {
    const { dx, dy } = nodeClusterOffset(0, 8)
    expect(dx).toBeGreaterThan(0)
    expect(dy).toBeCloseTo(0, 9)
  })
})

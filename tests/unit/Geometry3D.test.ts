import { describe, it, expect } from 'vitest'
import { fibonacciSpherePoint, projectPoint } from '@/core/algorithm/Geometry3D'

describe('fibonacciSpherePoint', () => {
  it('点落在半径为 radius 的球面上(|p|≈radius)', () => {
    const r = 100
    for (const i of [0, 3, 7, 9]) {
      const p = fibonacciSpherePoint(i, 10, r)
      const len = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2)
      expect(len).toBeCloseTo(r, 5)
    }
  })
  it('与原内联公式逐位一致', () => {
    const total = 10, r = 50, index = 4
    const phi = Math.acos(-1 + (2 * index) / total)
    const theta = Math.sqrt(total * Math.PI) * phi
    const p = fibonacciSpherePoint(index, total, r)
    expect(p.x).toBe(r * Math.sin(phi) * Math.cos(theta))
    expect(p.z).toBe(r * Math.cos(phi))
  })
})

describe('projectPoint', () => {
  it('无旋转时: z 越大 scale 越小(透视近大远小)', () => {
    const near = projectPoint({ x: 0, y: 0, z: -50 }, 0, 0, 200, 100, 100, 1)
    const far = projectPoint({ x: 0, y: 0, z: 50 }, 0, 0, 200, 100, 100, 1)
    expect(near.scale).toBeGreaterThan(far.scale)
  })
  it('原点投影到画布中心', () => {
    const p = projectPoint({ x: 0, y: 0, z: 0 }, 0.3, 0.7, 200, 100, 100, 2)
    expect(p.x).toBeCloseTo(200, 5)
    expect(p.y).toBeCloseTo(100, 5)
    expect(p.scale).toBeCloseTo(1, 5)
  })
  it('stretchX 各向异性拉伸只作用于 x', () => {
    const base = { x: 10, y: 10, z: 0 }
    const a = projectPoint(base, 0, 0, 0, 0, 100, 1)
    const b = projectPoint(base, 0, 0, 0, 0, 100, 2)
    expect(b.x).toBeCloseTo(a.x * 2, 5)
    expect(b.y).toBeCloseTo(a.y, 5)
  })
})

import { describe, it, expect } from 'vitest'
import { COLOR_PALETTE } from '@/core/util/ColorGenerator'

// 守护知识图谱的“分类→颜色”取色盘。下游 categoryColorMapping / 初始化分类着色 都用
// 下标取模该数组([idx % COLOR_PALETTE.length])来分配颜色: 一旦盘子被清空(length 0 → 除0/NaN下标)、
// 出现非法 Hex(渲染层拿到坏色) 或 重复色(不同分类视觉无法区分) 都会让图谱配色静默失真。
// 这里把“盘子”的形状约束锁死, 纯常量无副作用 放 node 环境即可。
describe('COLOR_PALETTE 取色盘形状守护', () => {
  it('非空且为 15 色(取模分配的下标空间, 改盘需同步此断言)', () => {
    expect(Array.isArray(COLOR_PALETTE)).toBe(true)
    expect(COLOR_PALETTE.length).toBe(15)
    expect(COLOR_PALETTE.length).toBeGreaterThan(0) // length 为 0 会导致下游 % length 出现 NaN 下标
  })

  it('每一项都是合法的 #RRGGBB 六位十六进制(渲染层可直接用)', () => {
    for (const color of COLOR_PALETTE) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('约定使用大写十六进制(与源定义保持一致, 避免大小写漂移)', () => {
    for (const color of COLOR_PALETTE) {
      expect(color).toBe(color.toUpperCase())
    }
  })

  it('颜色互不重复(不同分类必须可视觉区分)', () => {
    expect(new Set(COLOR_PALETTE).size).toBe(COLOR_PALETTE.length)
  })
})

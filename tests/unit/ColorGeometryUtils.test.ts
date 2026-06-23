import { describe, it, expect } from 'vitest'
import { parseColorToRgb, rgbToHue, hslToRgbString } from '@/core/util/ColorUtils'
import { clamp, clampToBounds } from '@/core/util/GeometryUtils'

describe('ColorUtils', () => {
  it('parseColorToRgb: rgb/rgba/#rgb/#rrggbb', () => {
    expect(parseColorToRgb('rgb(64, 158, 255)')).toEqual([64, 158, 255])
    expect(parseColorToRgb('rgba(1,2,3,0.5)')).toEqual([1, 2, 3])
    expect(parseColorToRgb('#409eff')).toEqual([64, 158, 255])
    expect(parseColorToRgb('#fff')).toEqual([255, 255, 255])
    expect(parseColorToRgb('not-a-color')).toBeNull()
  })
  it('rgbToHue: 蓝色约 210, 灰度回退', () => {
    expect(rgbToHue([64, 158, 255])).toBeGreaterThan(200)
    expect(rgbToHue([64, 158, 255])).toBeLessThan(220)
    expect(rgbToHue([128, 128, 128], 210)).toBe(210)
  })
  it('hslToRgbString: 输出 rgb() 形态', () => {
    expect(hslToRgbString(0, 100, 50)).toBe('rgb(255,0,0)')
    expect(hslToRgbString(120, 100, 50)).toBe('rgb(0,255,0)')
  })
})

describe('GeometryUtils', () => {
  it('clamp', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
  it('clampToBounds: 留出边距使元素完整在视口内', () => {
    expect(clampToBounds(-50, 100, 1000)).toBe(8) // 太靠左 → 夹到 margin
    expect(clampToBounds(950, 100, 1000)).toBe(1000 - 100 - 8) // 太靠右 → 夹到右界
    expect(clampToBounds(400, 100, 1000)).toBe(400) // 正常不动
  })
})

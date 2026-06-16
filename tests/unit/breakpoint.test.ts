import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MOBILE_MAX, DESKTOP_MIN, WIDE_MIN, ULTRA_MIN, COARSE_MAX, isMobileViewport } from '@/const/breakpoints'

describe('isMobileViewport (视口为主 + 触屏兜底)', () => {
  it('窄视口一律移动端(含边界)', () => {
    expect(isMobileViewport(360, false)).toBe(true)
    expect(isMobileViewport(MOBILE_MAX, false)).toBe(true) // 820 含
    expect(isMobileViewport(MOBILE_MAX + 1, false)).toBe(false) // 821 非
  })

  it('触屏设备在 COARSE_MAX 内仍判移动端(手机横屏不误切三栏)', () => {
    expect(isMobileViewport(915, true)).toBe(true) // 手机横屏
    expect(isMobileViewport(COARSE_MAX, true)).toBe(true) // 1024 含
    expect(isMobileViewport(COARSE_MAX + 1, true)).toBe(false) // 1025 非
  })

  it('非触屏宽视口为桌面', () => {
    expect(isMobileViewport(1000, false)).toBe(false)
    expect(isMobileViewport(1440, false)).toBe(false)
  })
})

describe('断点数值 JS 与 LESS 同源', () => {
  it('src/breakpoints.less 与 src/const/breakpoints.ts 数值一致', () => {
    const less = readFileSync(resolve(__dirname, '../../src/breakpoints.less'), 'utf-8')
    const pick = (name: string) => {
      const m = less.match(new RegExp(`@${name}:\\s*(\\d+)px`))
      return m ? Number(m[1]) : NaN
    }
    expect(pick('bp-mobile')).toBe(MOBILE_MAX)
    expect(pick('bp-desktop')).toBe(DESKTOP_MIN)
    expect(pick('bp-wide')).toBe(WIDE_MIN)
    expect(pick('bp-ultra')).toBe(ULTRA_MIN)
  })

  it('档位严格递增(compact < full < wide < ultra)', () => {
    expect(MOBILE_MAX).toBeLessThan(DESKTOP_MIN)
    expect(DESKTOP_MIN).toBeLessThan(WIDE_MIN)
    expect(WIDE_MIN).toBeLessThan(ULTRA_MIN)
  })

  it('双向守护: .less 声明的断点必须在 .ts 有对应非空常量(新增档不会静默失守)', () => {
    const less = readFileSync(resolve(__dirname, '../../src/breakpoints.less'), 'utf-8')
    const pickLess = (name: string) => {
      const m = less.match(new RegExp(`@${name}:\\s*(\\d+)px`))
      return m ? Number(m[1]) : NaN
    }
    // .less 声明了 @bp-wide/@bp-ultra → 对应 .ts 常量必须存在且相等; 任一侧缺失即失败
    expect(Number.isFinite(pickLess('bp-wide'))).toBe(true)
    expect(WIDE_MIN).not.toBeUndefined()
    expect(pickLess('bp-wide')).toBe(WIDE_MIN)
    expect(Number.isFinite(pickLess('bp-ultra'))).toBe(true)
    expect(ULTRA_MIN).not.toBeUndefined()
    expect(pickLess('bp-ultra')).toBe(ULTRA_MIN)
  })
})

describe('useBreakpoint.isWide (供图表换 echarts 配置)', () => {
  it('isWide/isUltra 阈值绑定常量(node 默认 1440 视口 → false)', async () => {
    const { isWide, isUltra } = await import('@/composables/useBreakpoint')
    expect(isWide.value).toBe(false) // 1440 < WIDE_MIN(1680)
    expect(isUltra.value).toBe(false) // 1440 < ULTRA_MIN(2040)
  })
})

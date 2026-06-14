import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MOBILE_MAX, DESKTOP_MIN, COARSE_MAX, isMobileViewport } from '@/const/breakpoints'

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
  })
})

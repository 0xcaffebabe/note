import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MOBILE_MAX, DESKTOP_MIN, WIDE_MIN, ULTRA_MIN, COARSE_MAX, isMobileViewport } from '@/core/config/breakpoints'

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
  // 读一次 .less + 单一 pick 助手(此前两个测试各自重复定义同一正则函数)
  const less = readFileSync(resolve(__dirname, '../../src/breakpoints.less'), 'utf-8')
  const pick = (name: string) => {
    const m = less.match(new RegExp(`@${name}:\\s*(\\d+)px`))
    return m ? Number(m[1]) : NaN
  }
  // .less 断点名 -> 对应 .ts 常量(双向守护用它作为"已注册"清单)
  const KNOWN: Record<string, number> = {
    'bp-mobile': MOBILE_MAX,
    'bp-desktop': DESKTOP_MIN,
    'bp-wide': WIDE_MIN,
    'bp-ultra': ULTRA_MIN,
  }

  it('每个已知断点 .less 与 .ts 数值一致', () => {
    for (const [name, val] of Object.entries(KNOWN)) {
      expect(pick(name)).toBe(val)
    }
  })

  it('档位严格递增(compact < full < wide < ultra)', () => {
    expect(MOBILE_MAX).toBeLessThan(DESKTOP_MIN)
    expect(DESKTOP_MIN).toBeLessThan(WIDE_MIN)
    expect(WIDE_MIN).toBeLessThan(ULTRA_MIN)
  })

  // 与上面的"数值一致"不再重复: 这里反向扫描 .less 里「所有」@bp-* 声明,
  // 任一断点没在 KNOWN 注册(= .ts 无对应常量)即失败 —— 真正做到"新增档不会静默失守"。
  it('双向守护: .less 里每个 @bp-* 都在 .ts 有对应常量', () => {
    const declared = [...less.matchAll(/@(bp-[\w-]+):\s*\d+px/g)].map((m) => m[1])
    expect(declared.length).toBeGreaterThan(0)
    for (const name of declared) {
      expect(Object.keys(KNOWN)).toContain(name) // .less 声明了却未在 .ts 注册 → 失败
    }
  })
})

describe('useBreakpoint.isWide (供图表换 echarts 配置)', () => {
  it('isWide/isUltra 阈值绑定常量(node 默认 1440 视口 → false)', async () => {
    const { isWide, isUltra } = await import('@/platform/web/composables/useBreakpoint')
    expect(isWide.value).toBe(false) // 1440 < WIDE_MIN(1680)
    expect(isUltra.value).toBe(false) // 1440 < ULTRA_MIN(2040)
  })
})

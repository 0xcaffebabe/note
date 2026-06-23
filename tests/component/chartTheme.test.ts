/**
 * 守护 src/util/echart/chartTheme.ts —— echarts 主题快照器。
 *
 * 为什么要测:
 *  - canvas 不认 var(), 组件靠 buildChartTheme() 从 :root 读令牌快照来上色。
 *    一旦令牌名拼错或 fallback 漏改, 暗/亮切换会悄悄退化成错色, 且无类型报错 —— 这里钉死契约。
 *  - jsdom 不解析 CSS 自定义属性(getPropertyValue('--x') 恒空), 故本套件天然落在"令牌未设" 分支:
 *    正好用来锁定 fallback 兜底表 —— 即每个字段在拿不到令牌时必须回退到的设计默认值。
 *  - tooltipStyle 是对 theme 的纯映射, 断言其形状(键名/常量/引用关系)防止字段错连。
 *  - palette 不变量: 恰 8 色, 首位 === 品牌主色(随主题令牌走), 余下为硬编码协调色相。
 *
 * 注意: 不做 setProperty/getComputedStyle 往返 —— jsdom 对自定义属性支持很差, 设了也读不回,
 *       会得到与真实浏览器不符的假象。故只校验 fallback 表与 palette[0] 契约(见任务约束)。
 */
import { describe, it, expect } from 'vitest'
import { buildChartTheme, tooltipStyle, type ChartTheme } from '@/platform/web/util/echart/chartTheme'

// jsdom 下 :root 无任何自定义属性, 所以每个字段都走 css() 的 fallback 分支。
// 下表即源码中各令牌对应的设计默认值, 必须与 chartTheme.ts 逐项一致。
const FALLBACK: Record<keyof Omit<ChartTheme, 'palette'>, string> = {
  text: '#1e293b',
  subText: '#64748b',
  axisLine: '#e2e8f0',
  splitLine: '#f1f5f9',
  surface: '#ffffff',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  primary: '#409eff',
  track: 'rgba(180,180,180,0.12)',
}

// 首位之外的固定调色板色相(硬编码, 不随令牌变)。
const PALETTE_TAIL = ['#2cc6a8', '#9d7cf4', '#f6a13c', '#ee6c7d', '#54c1e6', '#7cc955', '#e58fc0']

describe('buildChartTheme: 令牌未设时回退到设计默认值(jsdom)', () => {
  it('每个标量字段都等于其 fallback 默认色', () => {
    const t = buildChartTheme()
    for (const [key, expected] of Object.entries(FALLBACK)) {
      expect(t[key as keyof typeof FALLBACK]).toBe(expected)
    }
  })

  it('明确锁定关键文本色: text=#1e293b / subText=#64748b', () => {
    const t = buildChartTheme()
    // 任务点名的回退值: 主文本与次级文本, 防止暗主题误用导致对比度坍塌
    expect(t.text).toBe('#1e293b')
    expect(t.subText).toBe('#64748b')
  })

  it('tooltipBorder 与 axisLine 复用同一令牌 → 回退值相同', () => {
    const t = buildChartTheme()
    // 源码里二者都读 --border-color, 回退也必须一致, 否则边框色会分叉
    expect(t.tooltipBorder).toBe(t.axisLine)
    expect(t.tooltipBorder).toBe('#e2e8f0')
  })

  it('track 回退是半透明灰(rgba, 非 hex)', () => {
    const t = buildChartTheme()
    expect(t.track).toBe('rgba(180,180,180,0.12)')
  })

  it('返回的所有标量字段均为非空字符串(无 undefined/空串泄漏)', () => {
    const t = buildChartTheme()
    for (const key of Object.keys(FALLBACK)) {
      const v = t[key as keyof typeof FALLBACK]
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    }
  })

  it('两次构建结果相互独立(palette 不共享同一数组引用)', () => {
    // 各图各自 build, 修改一处不应污染另一处
    const a = buildChartTheme()
    const b = buildChartTheme()
    expect(a.palette).not.toBe(b.palette)
    expect(a.palette).toEqual(b.palette)
  })
})

describe('buildChartTheme.palette: 8 色调色板不变量', () => {
  it('恰好 8 个条目', () => {
    expect(buildChartTheme().palette).toHaveLength(8)
  })

  it('palette[0] === primary(品牌主色随令牌走)', () => {
    const t = buildChartTheme()
    // 核心契约: 首位永远是品牌主色本体(同一字符串值)
    expect(t.palette[0]).toBe(t.primary)
    expect(t.palette[0]).toBe('#409eff') // jsdom 回退态下的具体值
  })

  it('其余 7 位为固定协调色相(不随令牌变)', () => {
    expect(buildChartTheme().palette.slice(1)).toEqual(PALETTE_TAIL)
  })

  it('每个色值都是合法十六进制色串', () => {
    for (const c of buildChartTheme().palette) {
      expect(c).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('8 色互不重复(无重色相)', () => {
    const p = buildChartTheme().palette
    expect(new Set(p).size).toBe(p.length)
  })
})

describe('tooltipStyle: 对 theme 的纯映射', () => {
  it('字段直连 theme 对应键(bg/border/text 取自传入主题)', () => {
    const theme = buildChartTheme()
    const s = tooltipStyle(theme)
    expect(s.backgroundColor).toBe(theme.tooltipBg)
    expect(s.borderColor).toBe(theme.tooltipBorder)
    expect(s.textStyle.color).toBe(theme.text)
  })

  it('固定常量: borderWidth=1 且 extraCssText 含阴影/圆角令牌', () => {
    const s = tooltipStyle(buildChartTheme())
    expect(s.borderWidth).toBe(1)
    expect(s.extraCssText).toContain('var(--shadow-md)')
    expect(s.extraCssText).toContain('border-radius: 6px')
  })

  it('是纯函数: 不依赖全局, 任意主题对象按值映射', () => {
    // 传入伪造主题, 验证映射不掺杂任何外部状态
    const fake: ChartTheme = {
      text: '#111',
      subText: '#222',
      axisLine: '#333',
      splitLine: '#444',
      surface: '#555',
      tooltipBg: '#abc',
      tooltipBorder: '#def',
      primary: '#000',
      track: '#666',
      palette: ['#000'],
    }
    const s = tooltipStyle(fake)
    expect(s).toEqual({
      backgroundColor: '#abc',
      borderColor: '#def',
      borderWidth: 1,
      textStyle: { color: '#111' },
      extraCssText: 'box-shadow: var(--shadow-md); border-radius: 6px;',
    })
  })
})

import { test, expect, goto, DOC } from './fixtures'

// 大屏宽档(>= @bp-wide 1680)验证: 回收死白 / 内容居中加宽 / 图表 2-up / 浮层随居中壳重锚。
// 运行于 desktop-chromium 工程(文件名不含 mobile.spec.ts); 各用例自行 setViewportSize 到 1920/2560。
// 守护点对齐大屏优化计划: P1 首页/标签, P2 文档居中+浮层重锚, P3 图表加宽。
// 对照宽度 FULL(1440, < @bp-wide) 必须保持旧行为(回归闸由 responsive-desktop.spec 把守, 这里仅取基线对比)。

const FULL = { width: 1440, height: 900 } // < @bp-wide: 旧行为基线
const WIDE = { width: 1920, height: 1080 } // 最大化的 1920 物理屏(~1900 CSS px), 应吃到宽档
const ULTRA = { width: 2560, height: 1440 } // 超宽: 单档设计下与 1920 同档

const homeMax = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--home-max').trim())

const widthOf = (page: import('@playwright/test').Page, sel: string) =>
  page.evaluate(s => {
    const el = document.querySelector(s) as HTMLElement | null
    return el ? Math.round(el.getBoundingClientRect().width) : -1
  }, sel)

const gridTrackCount = (page: import('@playwright/test').Page, sel: string) =>
  page.evaluate(s => {
    const el = document.querySelector(s) as HTMLElement | null
    if (!el) return -1
    return getComputedStyle(el).gridTemplateColumns.split(/\s+/).filter(Boolean).length
  }, sel)

// ── P1: 首页 / 标签页死白回收 ────────────────────────────────────────────
test.describe('P1 home/tag dead-margin reclaim (wide)', () => {
  test('--home-max 抬到 1320 (>=1680), 首页统计区随之变宽, <@bp-wide 仍 1080', async ({ page }) => {
    await page.setViewportSize(FULL)
    await goto(page, '/home.html')
    await page.waitForSelector('.stat-section')
    expect(await homeMax(page)).toBe('1080px')
    const fullW = await widthOf(page, '.stat-section')

    await page.setViewportSize(WIDE)
    await page.waitForFunction(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--home-max').trim() === '1320px')
    expect(await homeMax(page)).toBe('1320px')
    const wideW = await widthOf(page, '.stat-section')
    // 回收死白: 宽档统计区显著变宽(>=1080 基线 + 150)
    expect(wideW).toBeGreaterThan(fullW + 150)
    expect(wideW).toBeGreaterThan(1250)
  })

  test('图表网格在宽档转 2 列, 天然宽图(.chart-card--wide)跨满两列', async ({ page }) => {
    await page.setViewportSize(FULL)
    await goto(page, '/home.html')
    await page.waitForSelector('.chart-grid')
    expect(await gridTrackCount(page, '.chart-grid')).toBe(1) // < @bp-wide: 单列

    await page.setViewportSize(WIDE)
    await page.waitForFunction(() => {
      const g = document.querySelector('.chart-grid')
      return !!g && getComputedStyle(g).gridTemplateColumns.split(/\s+/).filter(Boolean).length === 2
    })
    expect(await gridTrackCount(page, '.chart-grid')).toBe(2)
    const half = await widthOf(page, '.chart-card:not(.chart-card--wide)') // 紧凑图: 半宽
    const wide = await widthOf(page, '.chart-card--wide') // 日历等: 跨满
    expect(half).toBeGreaterThan(0)
    expect(wide).toBeGreaterThan(half * 1.6)
  })

  test('标签页 .tag-zone 宽档放宽到 1100', async ({ page }) => {
    await page.setViewportSize(WIDE)
    await goto(page, '/tag.html')
    await page.waitForSelector('.tag-zone')
    const maxw = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.tag-zone')!).maxWidth)
    expect(maxw).toBe('1100px')
  })

  test('2560 超宽: --home-max 仍 1320 (单档设计, 不再继续加宽)', async ({ page }) => {
    await page.setViewportSize(ULTRA)
    await goto(page, '/home.html')
    await page.waitForSelector('.stat-section')
    expect(await homeMax(page)).toBe('1320px')
  })
})

// ── P2: 文档阅读页居中宽壳 + 浮层重锚 ────────────────────────────────────
test.describe('P2 doc centered shell & re-anchored affordances (wide)', () => {
  test('1920: 三栏整组水平居中(左右留白≈相等且>0), 限到 --doc-shell-max', async ({ page }) => {
    await page.setViewportSize(WIDE)
    await goto(page, DOC)
    await page.waitForSelector('.doc-layout .main.markdown-section')
    const box = await page.evaluate(() => {
      const el = document.querySelector('.doc-layout') as HTMLElement
      const r = el.getBoundingClientRect()
      const vw = document.documentElement.clientWidth
      return { left: Math.round(r.left), rightGap: Math.round(vw - r.right), width: Math.round(r.width) }
    })
    expect(box.width).toBeLessThanOrEqual(1690)            // 限到 --doc-shell-max(1680)
    expect(box.left).toBeGreaterThan(60)                   // 左留白存在(非左对齐)
    expect(box.rightGap).toBeGreaterThan(60)
    expect(Math.abs(box.left - box.rightGap)).toBeLessThan(30) // 左右≈相等 = 居中
  })

  test('1920: 浮动工具栏随居中壳右移, 不贴视口边', async ({ page }) => {
    await page.setViewportSize(WIDE)
    await goto(page, DOC)
    await page.waitForSelector('.tool-box:not(.is-mobile)')
    const rightOffset = await page.evaluate(() => {
      const el = document.querySelector('.tool-box:not(.is-mobile)') as HTMLElement
      const r = el.getBoundingClientRect()
      return Math.round(document.documentElement.clientWidth - r.right)
    })
    // 壳右外边距 120 + 320 ≈ 440; 至少远离视口边(>300) 而非贴边(若未重锚则约 320 但壳已内移会脱节)
    expect(rightOffset).toBeGreaterThan(300)
  })

  test('1440(<@bp-wide): 三栏不居中, 左缘贴边(旧行为保持)', async ({ page }) => {
    await page.setViewportSize(FULL)
    await goto(page, DOC)
    await page.waitForSelector('.doc-layout .main.markdown-section')
    const left = await page.evaluate(() =>
      Math.round((document.querySelector('.doc-layout') as HTMLElement).getBoundingClientRect().left))
    expect(left).toBeLessThanOrEqual(2) // 未居中: 左缘贴边(≈0)
  })
})

// ── P-ultra: 关联内容独立第4列 (>=@bp-ultra 2040) ─────────────────────────
test.describe('P-ultra related as 4th column (ultra)', () => {
  test('2560: 右列内联关联/悬浮标签均退场, 壳加宽到 --doc-shell-max(2080)', async ({ page }) => {
    await page.setViewportSize(ULTRA)
    await goto(page, DOC)
    await page.waitForSelector('.doc-layout .main.markdown-section')
    // 超宽档: 内联堆叠(仅 wide-非-ultra)与悬浮标签(仅 <wide)均不出现
    expect(await page.locator('.related-inline-wrap').count()).toBe(0)
    expect(await page.locator('.related-floating').count()).toBe(0)
    const w = await page.evaluate(() =>
      Math.round((document.querySelector('.doc-layout') as HTMLElement).getBoundingClientRect().width))
    expect(w).toBeLessThanOrEqual(2090)  // 限到 --doc-shell-max(2080)
    expect(w).toBeGreaterThan(1900)      // 比 wide 档 1840 更宽
  })

  test('2560: 有关联内容的文档把关联渲染成正文右侧的第4列(在 TOC 列右侧)', async ({ page }) => {
    await page.setViewportSize(ULTRA)
    // 用首个含关联面板的文档(否则跳过断言, 仅保证不报错)
    await goto(page, DOC)
    await page.waitForSelector('.doc-layout .main.markdown-section')
    const col = page.locator('.doc-related-column')
    if (await col.count() > 0) {
      const pos = await page.evaluate(() => {
        const rel = document.querySelector('.doc-related-column') as HTMLElement
        const toc = document.querySelector('.doc-contents-and-panel') as HTMLElement
        return { relLeft: rel.getBoundingClientRect().left, tocRight: toc.getBoundingClientRect().right }
      })
      expect(pos.relLeft).toBeGreaterThanOrEqual(pos.tocRight - 1) // 关联列在 TOC 列右侧
    }
  })
})

// ── P3: 图表破出到 --home-max-wide ───────────────────────────────────────
test.describe('P3 charts escape to wider cap (wide)', () => {
  test('1920: 图表区破出到比 --home-max(1320) 更宽的 --home-max-wide', async ({ page }) => {
    await page.setViewportSize(FULL)
    await goto(page, '/home.html')
    await page.waitForSelector('.chart-grid')
    const fullW = await widthOf(page, '.chart-grid')
    expect(fullW).toBeLessThan(1100) // <@bp-wide: 限在 --home-max(1080)内

    await page.setViewportSize(WIDE)
    await page.waitForFunction(() => {
      const g = document.querySelector('.chart-grid')
      return !!g && Math.round(g.getBoundingClientRect().width) > 1350
    })
    const wideW = await widthOf(page, '.chart-grid')
    expect(wideW).toBeGreaterThan(1350)        // 破出: 宽于文字块的 1320
    const statW = await widthOf(page, '.stat-grid')
    expect(wideW).toBeGreaterThan(statW)       // 图表比指标卡区更宽(同轴居中)
  })
})

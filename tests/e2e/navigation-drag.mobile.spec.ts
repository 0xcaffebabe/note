import { test, expect, goto, pathnameOf, DOC } from './fixtures'
import type { CDPSession, Page } from '@playwright/test'

// PWA 首次缓存通知会覆盖导航；此文件专注真实指针和布局行为。
test.use({ serviceWorkers: 'block' })

const POSITION_KEY = 'site-navigation:position'
type Rect = { x: number; y: number; width: number; height: number }

async function launcherBox(page: Page): Promise<Rect> {
  const launcher = page.locator('.navigation-launcher')
  await expect(launcher).toBeVisible()
  return (await launcher.boundingBox())!
}

async function touchTargetBox(page: Page): Promise<Rect> {
  const launcher = page.locator('.navigation-launcher')
  await expect(launcher).toBeInViewport({ ratio: 1 })
  await expect.poll(() => launcher.evaluate(el => {
    const box = el.getBoundingClientRect()
    return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
  })).toBe(true)
  // CDP 绕过 Playwright 的可点击检查；等待两帧让命中区域绘制提交，不主动滚动页面。
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  return launcherBox(page)
}

async function moveTouch(page: Page, client: CDPSession, x: number, y: number) {
  const box = await touchTargetBox(page)
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] })
  for (let step = 1; step <= 8; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove', touchPoints: [{ x: start.x + (x - start.x) * step / 8, y: start.y + (y - start.y) * step / 8, id: 1 }],
    })
  }
}

async function dragTouch(page: Page, client: CDPSession, x: number, y: number) {
  await moveTouch(page, client, x, y)
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

async function expectAnchor(page: Page, expected: Rect) {
  await expect.poll(async () => {
    const actual = await launcherBox(page)
    return Math.max(Math.abs(actual.x - expected.x), Math.abs(actual.y - expected.y))
  }).toBeLessThanOrEqual(2)
}

test.describe('触摸拖动全站导航', () => {
  test('横向拖动导航不触发文档左滑目录或边缘右滑返回手势', async ({ page }) => {
    // 保留真实上一页，让意外触发 history.back() 能被观察到。
    await goto(page, '/tag.html')
    await goto(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    const client = await page.context().newCDPSession(page)
    const initial = await launcherBox(page)
    const y = initial.y + initial.height / 2
    await dragTouch(page, client, 50, y)
    await expect(page.locator('.site-dock')).toHaveClass(/is-positioned/)
    await expect(page.locator('.mobile-category-drawer')).toBeHidden()
    expect(pathnameOf(page)).toBe(DOC)
    const left = await launcherBox(page)
    expect(Math.abs(left.x + left.width / 2 - 50)).toBeLessThanOrEqual(2)
    const firstSaved = await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)
    expect(firstSaved).not.toBeNull()

    await dragTouch(page, client, 310, y)
    await touchTargetBox(page)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    await expect(page.locator('.mobile-category-drawer')).toBeHidden()
    expect(pathnameOf(page)).toBe(DOC)
    const right = await launcherBox(page)
    expect(Math.abs(right.x + right.width / 2 - 310)).toBeLessThanOrEqual(2)
    expect(Math.abs(right.y - left.y)).toBeLessThanOrEqual(2)
    const secondSaved = await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)
    expect(secondSaved).not.toBeNull()
    expect(secondSaved).not.toBe(firstSaved)
    await expect(page.locator('.navigation-launcher')).toHaveAttribute('aria-expanded', 'false')
    await client.detach()
  })

  test('真实触摸拖动不滚动正文，结束不误展开，之后点击与刷新仍可用', async ({ page }) => {
    await goto(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    const client = await page.context().newCDPSession(page)
    const beforeScroll = await page.evaluate(() => window.scrollY)
    await dragTouch(page, client, 120, 300)
    await expect(page.locator('.site-dock')).toHaveClass(/is-positioned/)
    await expect(page.locator('.navigation-launcher')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('.dock-shortcuts')).toBeHidden()
    expect(await page.evaluate(() => window.scrollY)).toBe(beforeScroll)
    const positioned = await launcherBox(page)
    const saved = await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)
    expect(saved).not.toBeNull()
    await page.locator('.navigation-launcher').tap()
    await expect(page.locator('.dock-shortcuts')).toBeVisible()
    await expect(page.locator('.site-dock')).toHaveClass(/expand-right/)
    await expectAnchor(page, positioned)
    for (const action of await page.locator('.dock-action:visible').all()) {
      await expect(action).toBeInViewport()
    }
    await page.locator('.navigation-launcher').tap()
    await expect(page.locator('.dock-shortcuts')).toBeHidden()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.site-dock')).toHaveClass(/is-positioned/)
    await expectAnchor(page, positioned)
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBe(saved)
    await client.detach()
  })

  test('320px 中间位置展开六个入口不移动锚点，旋转和边缘拖动保持安全可见', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await goto(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    const client = await page.context().newCDPSession(page)
    await dragTouch(page, client, 160, 240)
    const positioned = await launcherBox(page)
    const saved = await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)
    await page.locator('.navigation-launcher').tap()
    await expect(page.locator('.site-dock')).toHaveClass(/stacked/)
    await expect(page.locator('.dock-action:visible')).toHaveCount(6)
    await expectAnchor(page, positioned)
    for (const action of await page.locator('.dock-action:visible').all()) {
      const box = (await action.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.x).toBeGreaterThanOrEqual(8)
      expect(box.y).toBeGreaterThanOrEqual(8)
      expect(box.x + box.width).toBeLessThanOrEqual(312)
      expect(box.y + box.height).toBeLessThanOrEqual(568 - 72)
    }
    await page.locator('.navigation-launcher').tap()
    await page.setViewportSize({ width: 568, height: 320 })
    await expect.poll(async () => {
      const box = await launcherBox(page)
      return box.x >= 8 && box.y >= 8 && box.x + box.width <= 560 && box.y + box.height <= 320 - 72
    }).toBe(true)
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBe(saved)
    await page.setViewportSize({ width: 320, height: 568 })
    await expectAnchor(page, positioned)
    await dragTouch(page, client, 319, 567)
    const clamped = (await page.locator('.site-dock').boundingBox())!
    expect(clamped.x).toBeGreaterThanOrEqual(8)
    expect(clamped.y).toBeGreaterThanOrEqual(8)
    expect(clamped.x + clamped.width).toBeLessThanOrEqual(312)
    expect(clamped.y + clamped.height).toBeLessThanOrEqual(568 - 72)
    await client.detach()
  })

  test('320px 顶边中间位置的工具弹层完整留在视口内，可滚动到底部并按 Escape 返回焦点', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 260 })
    await goto(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    const client = await page.context().newCDPSession(page)
    await dragTouch(page, client, 160, 15)
    const positioned = await launcherBox(page)
    expect(positioned.y).toBeLessThanOrEqual(16)
    await page.locator('.navigation-launcher').tap()
    await expect(page.locator('.site-dock')).toHaveClass(/stacked/)
    await page.locator('.more-btn').tap()
    const tools = page.getByRole('dialog', { name: '站点导航与工具', exact: true })
    await expect(tools.getByRole('switch')).toBeFocused()
    const popup = (await tools.boundingBox())!
    expect(popup.x).toBeGreaterThanOrEqual(0)
    expect(popup.y).toBeGreaterThanOrEqual(0)
    expect(popup.x + popup.width).toBeLessThanOrEqual(320)
    expect(popup.y + popup.height).toBeLessThanOrEqual(260)
    const content = tools.locator('.site-navigation-panel')
    expect(await content.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
    const lastLink = tools.locator('.panel-links a').last()
    await lastLink.scrollIntoViewIfNeeded()
    await expect(lastLink).toBeInViewport({ ratio: 1 })
    expect(await content.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
    await page.keyboard.press('Escape')
    await expect(tools).toBeHidden()
    await expect(page.locator('.dock-shortcuts')).toBeHidden()
    await expect(page.locator('.navigation-launcher')).toBeFocused()
    await expectAnchor(page, positioned)
    await client.detach()
  })

  test('原生 touchCancel 恢复已保存位置，下一次点击可打开工具并恢复默认位置', async ({ page }) => {
    await goto(page, '/tag.html')
    const client = await page.context().newCDPSession(page)
    await dragTouch(page, client, 130, 260)
    const positioned = await launcherBox(page)
    const saved = await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)
    await moveTouch(page, client, 280, 400)
    await expect(page.locator('.site-dock')).toHaveClass(/is-dragging/)
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
    await expect(page.locator('.site-dock')).not.toHaveClass(/is-dragging/)
    await expectAnchor(page, positioned)
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBe(saved)
    await page.locator('.navigation-launcher').tap()
    await expect(page.locator('.dock-shortcuts')).toBeVisible()
    await page.locator('.more-btn').tap()
    const tools = page.getByRole('dialog', { name: '站点导航与工具', exact: true })
    await tools.getByRole('button', { name: '恢复默认位置', exact: true }).tap()
    await expect(tools).toBeHidden()
    await expect(page.locator('.site-dock')).not.toHaveClass(/is-positioned/)
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBeNull()
    await client.detach()
  })
})

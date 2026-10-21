import { test, expect, goto, pathnameOf, waitForPath, DOC } from './fixtures'
import type { CDPSession, Page } from '@playwright/test'

// 防止 PWA 首次缓存通知覆盖需要直接命中的触摸目标。
test.use({ serviceWorkers: 'block' })
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
  // CDP 绕过 Playwright 的可点击检查；两帧保证命中区域完成绘制，不主动滚动页面。
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  return launcherBox(page)
}

async function dragTouch(page: Page, client: CDPSession, x: number, y: number) {
  const box = await touchTargetBox(page)
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] })
  for (let step = 1; step <= 8; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove', touchPoints: [{ x: start.x + (x - start.x) * step / 8, y: start.y + (y - start.y) * step / 8, id: 1 }],
    })
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

async function expectAnchor(page: Page, expected: Rect) {
  await expect.poll(async () => {
    const actual = await launcherBox(page)
    return Math.max(Math.abs(actual.x - expected.x), Math.abs(actual.y - expected.y))
  }).toBeLessThanOrEqual(2)
}

test('触摸横向拖动不滚动或触发文档手势，之后仍可导航、刷新保留位置并恢复默认', async ({ page }) => {
  await goto(page, '/tag.html')
  await goto(page, DOC)
  await expect(page.locator('.main-content .markdown-section')).toBeVisible()
  const client = await page.context().newCDPSession(page)
  const initial = await launcherBox(page)
  const y = initial.y + initial.height / 2
  const beforeScroll = await page.evaluate(() => window.scrollY)
  // 两个方向分别会命中文档的左滑目录和边缘右滑返回手势。
  await dragTouch(page, client, 50, y)
  await expect(page.locator('.mobile-category-drawer')).toBeHidden()
  expect(pathnameOf(page)).toBe(DOC)
  const left = await launcherBox(page)
  expect(Math.abs(left.x + left.width / 2 - 50)).toBeLessThanOrEqual(2)
  await dragTouch(page, client, 310, y)
  await touchTargetBox(page)
  await expect(page.locator('.main-content .markdown-section')).toBeVisible()
  await expect(page.locator('.mobile-category-drawer')).toBeHidden()
  expect(pathnameOf(page)).toBe(DOC)
  expect(await page.evaluate(() => window.scrollY)).toBe(beforeScroll)
  const positioned = await launcherBox(page)
  expect(Math.abs(positioned.x + positioned.width / 2 - 310)).toBeLessThanOrEqual(2)
  await expect(page.locator('.navigation-launcher')).toHaveAttribute('aria-expanded', 'false')
  await page.locator('.navigation-launcher').tap()
  await expect(page.locator('.dock-shortcuts')).toBeVisible()
  await expectAnchor(page, positioned)
  await page.locator('.dock-shortcuts .site-nav').getByRole('link', { name: '标签', exact: true }).tap()
  await waitForPath(page, '/tag.html')
  await expect(page.locator('.navigation-launcher')).toHaveCount(1)
  await expectAnchor(page, positioned)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expectAnchor(page, positioned)
  await page.locator('.navigation-launcher').tap()
  await page.locator('.more-btn').tap()
  const tools = page.getByRole('dialog', { name: '站点导航与工具', exact: true })
  await tools.getByRole('button', { name: '恢复默认位置', exact: true }).tap()
  await expect(tools).toBeHidden()
  await expect(page.locator('.navigation-launcher')).toBeInViewport({ ratio: 1 })
  const reset = await launcherBox(page)
  const viewport = page.viewportSize()!
  expect(viewport.width - reset.x - reset.width).toBeLessThanOrEqual(40)
  expect(viewport.height - reset.y - reset.height).toBeLessThanOrEqual(40)
  await client.detach()
})

test('320px 顶边拖动后工具弹层仍可完整访问，并可用 Escape 关闭和恢复焦点', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 260 })
  await goto(page, DOC)
  await expect(page.locator('.main-content .markdown-section')).toBeVisible()
  const client = await page.context().newCDPSession(page)
  await dragTouch(page, client, 160, 15)
  const positioned = await launcherBox(page)
  await page.locator('.navigation-launcher').tap()
  await expectAnchor(page, positioned)
  await page.locator('.more-btn').tap()
  const tools = page.getByRole('dialog', { name: '站点导航与工具', exact: true })
  await expect(tools.getByRole('switch')).toBeFocused()
  const popup = (await tools.boundingBox())!
  expect(popup.x).toBeGreaterThanOrEqual(0)
  expect(popup.y).toBeGreaterThanOrEqual(0)
  expect(popup.x + popup.width).toBeLessThanOrEqual(320)
  expect(popup.y + popup.height).toBeLessThanOrEqual(260)
  const lastLink = tools.locator('.panel-links a').last()
  await lastLink.scrollIntoViewIfNeeded()
  await expect(lastLink).toBeInViewport({ ratio: 1 })
  expect(await tools.locator('.site-navigation-panel').evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  await page.keyboard.press('Escape')
  await expect(tools).toBeHidden()
  await expect(page.locator('.dock-shortcuts')).toBeHidden()
  await expect(page.locator('.navigation-launcher')).toBeFocused()
  await expectAnchor(page, positioned)
  await client.detach()
})

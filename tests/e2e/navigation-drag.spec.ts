import { test, expect, goto, waitForPath, openNavigationTools, DOC } from './fixtures'
import type { Page } from '@playwright/test'

type Rect = { x: number; y: number; width: number; height: number }

async function launcherBox(page: Page): Promise<Rect> {
  const launcher = page.locator('.navigation-launcher')
  await expect(launcher).toBeVisible()
  return (await launcher.boundingBox())!
}

async function expectAnchor(page: Page, expected: Rect) {
  await expect.poll(async () => {
    const actual = await launcherBox(page)
    return Math.max(Math.abs(actual.x - expected.x), Math.abs(actual.y - expected.y))
  }).toBeLessThanOrEqual(2)
}

test('拖动文档导航后仍可点击和键盘操作，位置跨路由刷新保留并可恢复默认', async ({ page }) => {
  await goto(page, DOC)
  await expect(page.locator('.main-content .markdown-section')).toBeVisible()
  const launcher = page.locator('.navigation-launcher')
  const before = await launcherBox(page)
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(520, 300, { steps: 8 })
  await page.mouse.up()
  await expect(launcher).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.dock-shortcuts')).toBeHidden()
  const positioned = await launcherBox(page)
  expect(Math.abs(positioned.x - before.x) + Math.abs(positioned.y - before.y)).toBeGreaterThan(50)
  await page.evaluate(() => window.scrollTo(0, 600))
  await expectAnchor(page, positioned)

  await launcher.click()
  await expect(page.locator('.dock-shortcuts')).toBeVisible()
  await expectAnchor(page, positioned)
  await page.keyboard.press('Escape')
  await expect(launcher).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('.site-nav a').first()).toBeFocused()
  await page.locator('.dock-shortcuts .site-nav').getByRole('link', { name: '标签', exact: true }).click()
  await waitForPath(page, '/tag.html')
  await expect(page.locator('.navigation-launcher')).toHaveCount(1)
  await expectAnchor(page, positioned)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expectAnchor(page, positioned)

  const tools = await openNavigationTools(page)
  await tools.getByRole('button', { name: '恢复默认位置', exact: true }).click()
  await expect(tools).toBeHidden()
  await expect(page.locator('.navigation-launcher')).toBeInViewport({ ratio: 1 })
  const reset = await launcherBox(page)
  const viewport = page.viewportSize()!
  expect(viewport.width - reset.x - reset.width).toBeLessThanOrEqual(40)
  expect(viewport.height - reset.y - reset.height).toBeLessThanOrEqual(40)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expectAnchor(page, reset)
  await expect(page.locator('.navigation-launcher')).toHaveAttribute('aria-expanded', 'false')
})

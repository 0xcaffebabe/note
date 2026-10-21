import { test, expect, goto, waitForPath, openNavigationTools, DOC } from './fixtures'
import type { Page } from '@playwright/test'

const POSITION_KEY = 'site-navigation:position'
type Rect = { x: number; y: number; width: number; height: number }

async function launcherBox(page: Page): Promise<Rect> {
  const launcher = page.locator('.navigation-launcher')
  await expect(launcher).toBeVisible()
  return (await launcher.boundingBox())!
}

async function dragLauncher(page: Page, x: number, y: number) {
  const box = await launcherBox(page)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(x, y, { steps: 8 })
  await page.mouse.up()
}

async function expectAnchor(page: Page, expected: Rect) {
  await expect.poll(async () => {
    const actual = await launcherBox(page)
    return Math.max(Math.abs(actual.x - expected.x), Math.abs(actual.y - expected.y))
  }).toBeLessThanOrEqual(2)
}

test.describe('鼠标拖动全站导航', () => {
  test('轻微移动不保存位置，真实拖动结束保持收起，下一次点击和键盘仍可展开', async ({ page }) => {
    await goto(page, '/tag.html')
    const launcher = page.locator('.navigation-launcher')
    const before = await launcherBox(page)
    const center = { x: before.x + before.width / 2, y: before.y + before.height / 2 }
    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await page.mouse.move(center.x + 3, center.y + 2)
    await page.mouse.up()
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBeNull()
    await expectAnchor(page, before)

    await dragLauncher(page, 550, 290)
    await expect(page.locator('.site-dock')).toHaveClass(/is-positioned/)
    await expect(launcher).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('.dock-shortcuts')).toBeHidden()
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), POSITION_KEY)
    expect(saved.version).toBe(1)
    for (const value of [saved.x, saved.y]) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
    const positioned = await launcherBox(page)
    expect(Math.abs(positioned.x + positioned.width / 2 - 550)).toBeLessThanOrEqual(2)
    expect(Math.abs(positioned.y + positioned.height / 2 - 290)).toBeLessThanOrEqual(2)
    await launcher.click()
    await expect(page.locator('.dock-shortcuts')).toBeVisible()
    await expectAnchor(page, positioned)
    for (const action of await page.locator('.dock-action:visible').all()) {
      await expect(action).toBeInViewport()
    }
    await page.keyboard.press('Escape')
    await expect(launcher).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('.site-nav a').first()).toBeFocused()
  })

  test('自定义位置跨滚动、真实路由和刷新保留，恢复默认位置后仍可导航', async ({ page }) => {
    await goto(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    await dragLauncher(page, 520, 300)
    const positioned = await launcherBox(page)
    const saved = await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)
    expect(saved).not.toBeNull()
    await page.evaluate(() => window.scrollTo(0, 600))
    await expectAnchor(page, positioned)
    await page.locator('.navigation-launcher').focus()
    await page.keyboard.press('Enter')
    await page.locator('.dock-shortcuts .site-nav').getByRole('link', { name: '标签', exact: true }).click()
    await waitForPath(page, '/tag.html')
    await expect(page.locator('.navigation-launcher')).toHaveCount(1)
    await expectAnchor(page, positioned)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.site-dock')).toHaveClass(/is-positioned/)
    await expectAnchor(page, positioned)
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBe(saved)

    let tools = await openNavigationTools(page)
    await tools.getByRole('button', { name: '恢复默认位置', exact: true }).click()
    await expect(tools).toBeHidden()
    await expect(page.locator('.site-dock')).not.toHaveClass(/is-positioned/)
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBeNull()
    const reset = await launcherBox(page)
    const viewport = page.viewportSize()!
    expect(viewport.width - reset.x - reset.width).toBeLessThanOrEqual(40)
    expect(viewport.height - reset.y - reset.height).toBeLessThanOrEqual(40)
    tools = await openNavigationTools(page)
    await expect(tools.getByRole('button', { name: '恢复默认位置', exact: true })).toHaveCount(0)
    await page.keyboard.press('Escape')
    await page.locator('.navigation-launcher').focus()
    await page.keyboard.press('Enter')
    await page.locator('.dock-shortcuts .site-nav').getByRole('link', { name: '首页', exact: true }).click()
    await waitForPath(page, '/home.html')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.navigation-launcher')).toBeVisible()
    await expect(page.locator('.site-dock')).not.toHaveClass(/is-positioned/)
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBeNull()
  })

  test('Escape 取消拖动并恢复原位置，不创建或覆盖已保存的位置', async ({ page }) => {
    await goto(page, '/tag.html')
    const before = await launcherBox(page)
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
    await page.mouse.down()
    await page.mouse.move(300, 220, { steps: 8 })
    await expect(page.locator('.site-dock')).toHaveClass(/is-dragging/)
    await page.keyboard.press('Escape')
    await page.mouse.up()
    await expect(page.locator('.site-dock')).not.toHaveClass(/is-dragging|is-positioned/)
    await expectAnchor(page, before)
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBeNull()

    await dragLauncher(page, 500, 320)
    const positioned = await launcherBox(page)
    const saved = await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)
    await page.mouse.move(positioned.x + positioned.width / 2, positioned.y + positioned.height / 2)
    await page.mouse.down()
    await page.mouse.move(900, 500, { steps: 8 })
    await expect(page.locator('.site-dock')).toHaveClass(/is-dragging/)
    await page.keyboard.press('Escape')
    await page.mouse.up()
    await expectAnchor(page, positioned)
    await expect(page.locator('.navigation-launcher')).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(key => localStorage.getItem(key), POSITION_KEY)).toBe(saved)
  })
})

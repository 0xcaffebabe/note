import { type Locator, type Page } from '@playwright/test'
import { test, expect, goto, openNavigationTools, DOC, NO_ANIM } from './fixtures'

const LAYOUT_KEY = 'doc-preview:layout'

test.use({ colorScheme: 'light' })

test.beforeEach(async ({ page }) => {
  // 固定正文长度，文档内容演化不会让滚动断言失去覆盖。
  const jsonPath = DOC.replace(/\.html$/, '.md.json')
  await page.route(url => decodeURI(url.pathname) === jsonPath, async route => {
    const response = await route.fetch()
    const file = await response.json()
    file.content = '## 预览布局回归\n\n' + '用于验证宽高调整、滚动及偏好恢复的预览正文。\n\n'.repeat(60)
    await route.fulfill({ response, json: file })
  })
})

async function openPreview(page: Page) {
  await page.locator('.el-menu .el-menu-item.is-active').first().click({ button: 'right' })
  const preview = page.getByRole('dialog', { name: '文档预览' })
  await expect(preview).toBeVisible()
  await expect(preview.locator('.preview-markdown')).toContainText(/\S/)
  // visible / 正文就绪不代表 Vue 的 scale 过渡已结束；重开时缓存正文会立即出现。
  await expect(preview).not.toHaveClass(/fade-(enter|leave)-/)
  return preview
}

async function geometry(preview: Locator) {
  // v-show 入场时仍可能带 scale(0.98)，可见不代表已恢复最终尺寸。
  await expect(preview).toHaveCSS('transform', 'none')
  return preview.evaluate(el => {
    const { x, y, width, height } = el.getBoundingClientRect()
    return { x, y, width, height }
  })
}

async function dragBy(page: Page, handle: Locator, dx: number, dy: number) {
  const rect = await handle.boundingBox()
  expect(rect).not.toBeNull()
  const x = rect!.x + rect!.width / 2, y = rect!.y + rect!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y + dy, { steps: 8 })
  await page.mouse.up()
}

test('拖动、缩放后跨文档和刷新恢复位置/宽高，正文填满可滚动区域', async ({ page }) => {
  await goto(page, DOC)
  const preview = await openPreview(page)
  // 先移到左上，保证拉伸两轴时有足够空间。
  const initial = await geometry(preview)
  await dragBy(page, preview.locator('.popover-header'), 32 - initial.x, 100 - initial.y)
  await expect(preview).toBeVisible()
  const moved = await geometry(preview)
  expect(moved.x).toBeCloseTo(32, 0)
  expect(moved.y).toBeCloseTo(100, 0)

  await dragBy(page, preview.getByRole('button', { name: '调整预览大小' }), 180, -120)
  const resized = await geometry(preview)
  expect(resized.width).toBeCloseTo(moved.width + 180, 0)
  expect(resized.height).toBeCloseTo(moved.height - 120, 0)
  const body = preview.locator('.popover-body')
  expect(await body.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
  await body.evaluate(el => { el.scrollTop = 80 })
  await expect(preview).toBeVisible()

  await preview.getByRole('button', { name: '关闭预览' }).click()
  // 切换到另一篇预览，共用同一份窗口偏好。
  await page.locator('.el-menu .el-menu-item:not(.is-active):visible').filter({ hasNotText: '首页' }).first().click({ button: 'right' })
  await expect(preview).toBeVisible()
  expect(await geometry(preview)).toEqual(resized)
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.addStyleTag({ content: NO_ANIM })
  await openPreview(page)
  expect(await geometry(preview)).toEqual(resized)
  await page.screenshot({ path: 'test-results/preview-layout-light.png' })
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()
  // 主题开关位于折叠导航的工具面板，需先通过用户入口展开。
  const tools = await openNavigationTools(page)
  await tools.locator('.theme-row .el-switch').click()
  await expect(tools.getByRole('switch')).toBeChecked()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.keyboard.press('Escape')
  await expect(tools).toBeHidden()
  await openPreview(page)
  expect(await geometry(preview)).toEqual(resized)
  await page.screenshot({ path: 'test-results/preview-layout-dark.png' })
})

test('缩放支持键盘，最小尺寸和视口边界受限，视口变化不覆盖偏好', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({
    left: 300, top: 100, width: 700, height: 650,
  })), LAYOUT_KEY)
  await goto(page, DOC)
  const preview = await openPreview(page)
  const handle = preview.getByRole('button', { name: '调整预览大小' })
  await handle.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Shift+ArrowDown')
  expect(await geometry(preview)).toEqual({ x: 300, y: 100, width: 710, height: 690 })
  const body = await preview.locator('.popover-body').boundingBox()
  expect(body!.y + body!.height).toBeCloseTo(789, 0)
  const preference = await page.evaluate(key => localStorage.getItem(key), LAYOUT_KEY)

  // 保持桌面断点，同时模拟窗口变矮/变窄。CSS 收缩尺寸，resize 事件夹紧位置。
  await page.setViewportSize({ width: 900, height: 500 })
  await expect.poll(async () => {
    const rect = await geometry(preview)
    return rect.x >= 8 && rect.y >= 8 && rect.x + rect.width <= 892 && rect.y + rect.height <= 492
  }).toBe(true)
  expect(await page.evaluate(key => localStorage.getItem(key), LAYOUT_KEY)).toBe(preference)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.keyboard.press('Escape')
  await openPreview(page)
  expect(await geometry(preview)).toEqual({ x: 300, y: 100, width: 710, height: 690 })
  await dragBy(page, handle, -1000, -1000)
  const minimum = await geometry(preview)
  expect(minimum.width).toBe(280)
  expect(minimum.height).toBe(160)
  await expect(preview.getByRole('button', { name: '关闭预览' })).toBeVisible()
  await expect(preview).toBeVisible()
})

test('旧大屏偏好在小视口内恢复，关闭按钮始终可用', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 500 })
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({
    left: 2400, top: 1200, width: 1800, height: 1000,
  })), LAYOUT_KEY)
  await goto(page, DOC)
  const preview = await openPreview(page)
  expect(await geometry(preview)).toEqual({ x: 8, y: 8, width: 884, height: 484 })
  await preview.getByRole('button', { name: '关闭预览' }).click()
  await expect(preview).toBeHidden()
})

test('存储损坏或不可用时仍可预览和调整大小', async ({ page }) => {
  await page.addInitScript(key => {
    localStorage.setItem(key, '{broken')
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage unavailable', 'QuotaExceededError')
      setItem.call(this, name, value)
    }
  }, LAYOUT_KEY)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await goto(page, DOC)
  const preview = await openPreview(page)
  const before = await geometry(preview)
  const handle = preview.getByRole('button', { name: '调整预览大小' })
  await handle.focus()
  await page.keyboard.press('ArrowRight')
  expect((await geometry(preview)).width).toBe(before.width + 10)
  await preview.getByRole('button', { name: '关闭预览' }).click()
  await openPreview(page)
  expect((await geometry(preview)).width).toBe(before.width + 10)
  expect(errors).toEqual([])
})

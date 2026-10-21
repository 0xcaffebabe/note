import { test, expect, goto, openNavigationTools, waitForPath, DOC } from './fixtures'

test.use({ colorScheme: 'light' })

test('主题偏好在文档切换和刷新后保留，也能切回亮色', async ({ page }) => {
  await goto(page, DOC)
  await expect(page.locator('.main-content .markdown-section')).toBeVisible()
  let tools = await openNavigationTools(page)
  await expect(tools.getByRole('switch')).not.toBeChecked()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')

  await tools.locator('.theme-row .el-switch').click()
  await expect(tools.getByRole('switch')).toBeChecked()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await page.keyboard.press('Escape')
  await expect(tools).toBeHidden()

  const nextDocument = page.getByRole('navigation', { name: '文档翻页导航' }).getByRole('link').first()
  const nextPath = decodeURI(new URL((await nextDocument.getAttribute('href'))!, page.url()).pathname)
  expect(nextPath).not.toBe(DOC)
  await nextDocument.click()
  await waitForPath(page, nextPath)
  await expect(page.locator('.main-content .markdown-section')).toBeVisible()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')

  await page.reload({ waitUntil: 'domcontentloaded' })
  tools = await openNavigationTools(page)
  await expect(tools.getByRole('switch')).toBeChecked()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')

  await tools.locator('.theme-row .el-switch').click()
  await expect(tools.getByRole('switch')).not.toBeChecked()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')

  await page.reload({ waitUntil: 'domcontentloaded' })
  tools = await openNavigationTools(page)
  await expect(tools.getByRole('switch')).not.toBeChecked()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
})

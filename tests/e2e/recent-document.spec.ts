import { test, expect, goto, waitForPath, openNavigationTools, DOC } from './fixtures'
import type { Page } from '@playwright/test'

async function resumeReading(page: Page) {
  const tools = await openNavigationTools(page)
  await tools.getByRole('link', { name: '返回最近文档', exact: true }).click()
  await waitForPath(page, DOC)
  await expect(page.locator('.main-content .markdown-section')).toBeVisible()
  await expect(tools).toBeHidden()
}

test.describe('继续阅读', () => {
  test('阅读及切换文档后可返回最近文档，刷新后仍可继续阅读', async ({ page }) => {
    await goto(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    // 直接离开，避免点击页面底部链接时的自动滚动替代“打开即记录”。
    await goto(page, '/tag.html')
    await resumeReading(page)

    const otherDocument = page.locator('.doc-prev-next a').first()
    const otherPath = decodeURI(new URL((await otherDocument.getAttribute('href'))!, page.url()).pathname)
    await otherDocument.click()
    await waitForPath(page, otherPath)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    // 返回已读标签，保护 Vue Router 复用页面、命中文档缓存时的阅读记录更新。
    await page.locator('.tab-container .nav-tab-item:not(.active) .tab-main').first().click()
    await waitForPath(page, DOC)

    await page.locator('.navigation-launcher').focus()
    await page.keyboard.press('Enter')
    await page.getByRole('navigation', { name: '站内导航' }).getByRole('link', { name: '标签', exact: true }).click()
    await waitForPath(page, '/tag.html')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await resumeReading(page)
    const tools = await openNavigationTools(page)
    await expect(tools.getByRole('button', { name: '返回最近文档', exact: true })).toBeDisabled()
  })

  test.describe('加载失败后的阅读恢复', () => {
    test.use({ serviceWorkers: 'block' })

    test('文档加载失败后仍能返回上次成功阅读的文档', async ({ page }) => {
      await goto(page, DOC)
      await expect(page.locator('.main-content .markdown-section')).toBeVisible()
      const link = page.locator('.doc-prev-next a').first()
      const failedPath = decodeURI(new URL((await link.getAttribute('href'))!, page.url()).pathname)
      const failedJson = failedPath.replace(/\.html$/, '.md.json')
      await page.route(url => decodeURI(url.pathname) === failedJson, route => route.fulfill({
        status: 503, contentType: 'text/plain', body: 'document unavailable',
      }))
      await goto(page, failedPath)
      await expect(page.locator('.doc-error')).toContainText('文档加载失败')
      await resumeReading(page)
      await expect(page.locator('.doc-error')).toBeHidden()
    })
  })
})

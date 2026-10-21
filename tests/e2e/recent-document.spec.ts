import { test, expect, goto, waitForPath, openNavigationTools, DOC, DOC_ID } from './fixtures'
import DocUtils from '../../src/core/util/DocUtils'
import type { Page } from '@playwright/test'

const LAST_READ_KEY = 'doc-service:last-read'
const RECENT_ACTION = '返回最近文档'

async function openTagFromDock(page: Page) {
  await page.locator('.navigation-launcher').focus()
  await page.keyboard.press('Enter')
  await page.locator('.dock-shortcuts .site-nav').getByRole('link', { name: '标签', exact: true }).click()
  await waitForPath(page, '/tag.html')
}

test.describe('导航返回最近文档', () => {
  test('无阅读记录时禁用返回入口，键盘焦点跳过它', async ({ page }) => {
    await goto(page, '/tag.html')
    const navigation = await openNavigationTools(page)
    const recent = navigation.getByRole('button', { name: RECENT_ACTION, exact: true })
    await expect(recent).toBeDisabled()
    await expect(recent).toContainText('暂无阅读记录')
    await expect(navigation.getByRole('link', { name: RECENT_ACTION, exact: true })).toHaveCount(0)
    await expect(navigation.getByRole('switch')).toBeFocused()
  })

  test('未滚动的成功阅读也可在刷新后通过键盘返回，当前文档禁用重复返回', async ({ page }) => {
    await goto(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    // 在任何导航、菜单或主动滚动前检查记录，覆盖只打开文档的阅读场景。
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), LAST_READ_KEY)).toBe(DOC_ID)
    const documentName = (await page.title()).replace(/ - 知识体系$/, '')
    let navigation = await openNavigationTools(page)
    const current = navigation.getByRole('button', { name: RECENT_ACTION, exact: true })
    await expect(current).toBeDisabled()
    await expect(current).toContainText('当前正在阅读')
    await expect(navigation.getByRole('switch')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(navigation).toBeHidden()

    await openTagFromDock(page)
    await page.reload({ waitUntil: 'domcontentloaded' })
    navigation = await openNavigationTools(page)
    const recent = navigation.getByRole('link', { name: RECENT_ACTION, exact: true })
    await expect(recent).toHaveAttribute('href', /\.html$/)
    expect(decodeURI(new URL((await recent.getAttribute('href'))!, page.url()).pathname)).toBe(DOC)
    expect(await recent.getAttribute('title')).toContain(documentName)
    await expect(recent).toBeFocused()
    await page.keyboard.press('Enter')
    await waitForPath(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    await expect(page.getByRole('dialog', { name: '站点导航与工具', exact: true })).toBeHidden()
    await expect(page.locator('.dock-shortcuts')).toBeHidden()
  })

  test('同一 SPA 内 A→B→缓存中的 A 后，菜单刷新为最新成功阅读目标', async ({ page }) => {
    await goto(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    let navigation = await openNavigationTools(page)
    await expect(navigation.getByRole('button', { name: RECENT_ACTION, exact: true })).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(navigation).toBeHidden()

    // 从真实翻页链接发现第二篇文档，通过 router-link 复用当前 DocPage。
    const nextDocument = page.locator('.doc-prev-next a').first()
    await expect(nextDocument).toBeVisible()
    const nextPath = decodeURI(new URL((await nextDocument.getAttribute('href'))!, page.url()).pathname)
    expect(nextPath).not.toBe(DOC)
    const bootTime = await page.evaluate(() => performance.timeOrigin)
    await nextDocument.click()
    await waitForPath(page, nextPath)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), LAST_READ_KEY)).toBe(DocUtils.htmlUrl2Id(nextPath))
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(bootTime)
    navigation = await openNavigationTools(page)
    await expect(navigation.getByRole('button', { name: RECENT_ACTION, exact: true })).toBeDisabled()
    await expect(navigation.locator('.recent-document')).toContainText('当前正在阅读')
    await page.keyboard.press('Escape')
    await expect(navigation).toBeHidden()

    // 已访问的 A 通过标签页返回，覆盖缓存立即命中与 beforeRouteUpdate 的提交时序。
    await page.locator('.tab-container .nav-tab-item:not(.active) .tab-main').first().click()
    await waitForPath(page, DOC)
    await expect(page.locator('.main-content .markdown-section')).toBeVisible()
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), LAST_READ_KEY)).toBe(DOC_ID)
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(bootTime)
    navigation = await openNavigationTools(page)
    await expect(navigation.getByRole('button', { name: RECENT_ACTION, exact: true })).toBeDisabled()
    await expect(navigation.locator('.recent-document')).toContainText('当前正在阅读')
    await page.keyboard.press('Escape')
    await expect(navigation).toBeHidden()

    await openTagFromDock(page)
    navigation = await openNavigationTools(page)
    const recent = navigation.getByRole('link', { name: RECENT_ACTION, exact: true })
    expect(decodeURI(new URL((await recent.getAttribute('href'))!, page.url()).pathname)).toBe(DOC)
    await expect(recent).toBeFocused()
  })

  test.describe('文档网络故障', () => {
    // 仅故障注入用例关闭 SW，保证请求经过 page.route 而非缓存响应。
    test.use({ serviceWorkers: 'block' })

    test('文档加载失败不覆盖之前成功阅读的返回目标', async ({ page }) => {
      await goto(page, DOC)
      await expect(page.locator('.main-content .markdown-section')).toBeVisible()
      await expect.poll(() => page.evaluate(key => localStorage.getItem(key), LAST_READ_KEY)).toBe(DOC_ID)
      const candidate = page.locator('.doc-prev-next a').first()
      await expect(candidate).toBeVisible()
      const failedPath = decodeURI(new URL((await candidate.getAttribute('href'))!, page.url()).pathname)
      const failedJson = failedPath.replace(/\.html$/, '.md.json')
      await page.route(url => decodeURI(url.pathname) === failedJson, route => route.fulfill({
        status: 503, contentType: 'text/plain', body: 'fixture unavailable',
      }))
      const failedResponse = page.waitForResponse(response => decodeURI(new URL(response.url()).pathname) === failedJson)
      // 整页进入使文档缓存清空，明确覆盖请求失败路径。
      await goto(page, failedPath)
      const response = await failedResponse
      expect(response.status()).toBe(503)
      expect(response.fromServiceWorker()).toBe(false)
      await expect(page.locator('.doc-error')).toContainText('文档加载失败')
      expect(await page.evaluate(key => localStorage.getItem(key), LAST_READ_KEY)).toBe(DOC_ID)
      const navigation = await openNavigationTools(page)
      const recent = navigation.getByRole('link', { name: RECENT_ACTION, exact: true })
      expect(decodeURI(new URL((await recent.getAttribute('href'))!, page.url()).pathname)).toBe(DOC)
      await expect(recent).toBeFocused()
    })
  })
})

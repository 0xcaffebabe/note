import { test, expect, goto, DOC, DOC_ID, seedLastRead } from './fixtures'
import type { Page } from '@playwright/test'

// 使用真实生产 HTML 与资源请求模拟发版后的旧引用，不依赖线上部署或网络。
async function staleEntry(page: Page, permanent = false) {
  let visits = 0
  await page.route(url => decodeURI(url.pathname) === DOC, async route => {
    const response = await route.fetch()
    visits++
    const html = await response.text()
    await route.fulfill({
      response,
      body: permanent || visits === 1
        ? html.replace(/(<script\b[^>]*type="module"[^>]*src=")[^"]+/, '$1/resource/deleted-entry.js')
        : html,
    })
  })
  await page.route('**/resource/deleted-entry.js', route => route.fulfill({ status: 404, body: '' }))
  return () => visits
}

test.describe('expired asset recovery', () => {
  test.use({ serviceWorkers: 'block' })

  test('入口脚本 404 时恢复最新页面，并保留文档、查询参数和锚点', async ({ page }) => {
    const visits = await staleEntry(page)
    await goto(page, DOC + '?source=history#saved-position')
    await expect(page.locator('.markdown-section h2').first()).toBeVisible({ timeout: 20_000 })
    expect(visits()).toBe(2)
    const url = new URL(page.url())
    expect(decodeURI(url.pathname)).toBe(DOC)
    expect(url.searchParams.get('source')).toBe('history')
    expect(Number(url.searchParams.get('__asset_retry'))).toBeGreaterThan(0)
    expect(url.hash).toBe('#saved-position')
    expect(await page.locator('script#asset-recovery').evaluate(el =>
      !!(el.compareDocumentPosition(document.querySelector('script[type="module"]')!) & Node.DOCUMENT_POSITION_FOLLOWING)
    )).toBe(true)
  })

  test('sessionStorage 不可用且资源持续缺失时停止自动刷新并允许手动重试', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage blocked') } })
    })
    const visits = await staleEntry(page, true)
    await goto(page, DOC)
    const alert = page.locator('#asset-recovery-notice')
    await expect(alert).toContainText('部分内容加载失败', { timeout: 20_000 })
    expect(visits()).toBe(2)
    // 等过兜底时间，确认不会再次导航。
    await page.waitForTimeout(2500)
    expect(visits()).toBe(2)
    const screenshot = testInfo.outputPath('asset-recovery-retry.png')
    await page.screenshot({ path: screenshot })
    await testInfo.attach('asset-recovery-retry', { path: screenshot, contentType: 'image/png' })
    await expect(alert.getByRole('link', { name: '重新加载' })).toHaveAttribute('href', /__asset_retry=/)
    await page.unrouteAll({ behavior: 'wait' })
    await alert.getByRole('link', { name: '重新加载' }).click()
    await expect(page.locator('.markdown-section h2').first()).toBeVisible()
  })

  test('并发资源错误合并为一次恢复，SW 检查挂起仍能导航', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'serviceWorker', { value: {
        addEventListener() {},
        getRegistration: () => new Promise(() => {}),
      } })
    })
    await goto(page, DOC)
    await expect(page.locator('.markdown-section h2').first()).toBeVisible()
    const navigation = page.waitForURL(url => url.searchParams.has('__asset_retry'))
    await page.evaluate(() => {
      for (let n = 0; n < 4; n++) window.dispatchEvent(new Event('vite:preloadError'))
    })
    await navigation
    await expect(page.locator('.markdown-section h2').first()).toBeVisible()
    await expect(page.locator('#asset-recovery-notice')).toHaveCount(0)
  })

  test('真实懒加载 chunk 404 后自动恢复目标页面', async ({ page }) => {
    await goto(page, DOC)
    await expect(page.locator('.markdown-section h2').first()).toBeVisible()
    await page.route(/\/resource\/TagListPage-.*\.js$/, route => route.fulfill({ status: 404, body: '' }), { times: 1 })
    await page.locator('a[href="/tag.html"]').first().click()
    await page.waitForURL(url => url.searchParams.has('__asset_retry'))
    await expect(page.getByRole('heading', { name: '标签', exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/tag.html/)
    await expect(page.locator('#asset-recovery-notice')).toHaveCount(0)
  })

  test('样式加载失败时恢复，图片与普通业务异常不触发刷新', async ({ page }) => {
    await goto(page, DOC)
    await expect(page.locator('.markdown-section h2').first()).toBeVisible()
    const before = page.url()
    await page.evaluate(() => {
      const image = document.createElement('img')
      image.src = '/resource/missing-image.png'
      document.body.appendChild(image)
      window.dispatchEvent(new ErrorEvent('error', { message: 'Unrelated application error' }))
    })
    await page.waitForTimeout(2200)
    expect(page.url()).toBe(before)
    await page.route('**/resource/deleted-style.css', route => route.fulfill({ status: 404, body: '' }))
    await page.evaluate(() => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/resource/deleted-style.css'
      document.head.appendChild(link)
    })
    await page.waitForURL(url => url.searchParams.has('__asset_retry'))
    await expect(page.locator('.markdown-section h2').first()).toBeVisible()
  })

  test('断网时保留页面，显示网络提示并提供重试入口', async ({ page }) => {
    await goto(page, DOC)
    await expect(page.locator('.markdown-section h2').first()).toBeVisible()
    const before = page.url()
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('vite:preloadError'))
    })
    await expect(page.locator('#asset-recovery-notice')).toContainText('网络不可用')
    await page.waitForTimeout(2200)
    expect(page.url()).toBe(before)
    await expect(page.locator('.markdown-section h2').first()).toBeVisible()
  })
})

test('旧 SW 预缓存首页时绕过 app shell 获取新入口', { tag: '@prod' }, async ({ page }) => {
  test.setTimeout(45_000)
  await seedLastRead(page, DOC_ID)
  await goto(page, DOC)
  await expect(page.locator('.markdown-section h2').first()).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await page.evaluate(async () => {
    const name = (await caches.keys()).find(name => name.startsWith('workbox-precache'))!
    const cache = await caches.open(name)
    const key = (await cache.keys()).find(request => new URL(request.url).pathname === '/index.html')!
    const response = (await cache.match(key))!
    const html = (await response.text()).replace(/(<script\b[^>]*type="module"[^>]*src=")[^"]+/, '$1/resource/deleted-entry.js')
    await cache.put(key, new Response(html, { headers: { 'Content-Type': 'text/html' } }))
  })
  await goto(page, '/?source=stale-shell#saved-position')
  await expect(page.locator('.markdown-section h2').first()).toBeVisible({ timeout: 20_000 })
  const url = new URL(page.url())
  expect(url.searchParams.has('__asset_retry')).toBe(true)
  expect(url.searchParams.get('source')).toBe('stale-shell')
  expect(url.hash).toBe('#saved-position')
  await expect(page.locator('#asset-recovery-notice')).toHaveCount(0)
})

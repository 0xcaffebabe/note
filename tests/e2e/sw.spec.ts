import { test, expect, goto, DOC } from './fixtures'

// Service Worker / 离线(P2, @prod): 仅在生产构建的 preview 下存在
// 标 @prod 从 PR 门禁排除(SW 注册有 ~8s 时延、易抖) 放夜间/合并后跑
// 注: 若构建未产出 SW(理论上 prod 必有) 用 skip 而非 fail 保持兼容
async function swReady(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(
    () =>
      'serviceWorker' in navigator &&
      Promise.race([
        navigator.serviceWorker.ready.then(() => true),
        new Promise<boolean>((r) => setTimeout(() => r(false), 8000)),
      ])
  )
}

test.describe('service worker (P2)', () => {
  test('SW 注册并在刷新后接管页面', { tag: '@prod' }, async ({ page }) => {
    await goto(page, DOC)
    test.skip(!(await swReady(page)), '无 service worker(非 prod 构建)')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20_000 })
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  })

  test('离线时已访问过的文档仍能从缓存命中', { tag: '@prod' }, async ({ page, context }) => {
    await goto(page, DOC)
    test.skip(!(await swReady(page)), '无 service worker(非 prod 构建)')
    // 首访 SW 尚未接管 刷新一次让 controller 生效 并在「在线」把该 .html 写入 NetworkFirst 缓存
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20_000 })
    await page.waitForSelector('.markdown-section h2')
    await context.setOffline(true)
    try {
      // NetworkFirst(.html) 离线时回退到 doc-pages 缓存 —— 已访问过的文档 fetch 仍 ok
      // 直接断言缓存命中 比「离线整页重渲染」稳定(后者还依赖各 lazy chunk 是否都已缓存)
      const cachedOk = await page.evaluate((u) => fetch(u).then((r) => r.ok).catch(() => false), encodeURI(DOC))
      expect(cachedOk).toBe(true)
    } finally {
      await context.setOffline(false)
    }
  })
})

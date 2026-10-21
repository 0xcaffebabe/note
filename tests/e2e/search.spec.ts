import { test, expect, goto, DOC_ID } from './fixtures'

// 真实后端冒烟(@network): 不 stub, 让 algoliasearch 客户端真的打 Algolia(凭据是硬编码的公开 search-only key, CI 无需密钥)。
// 由 PR 门禁排除(--grep-invert @network), 仅夜间 cron 跑 —— 这才让 e2e.yml 里「@network=真实 Algolia」名副其实。
// 注: 外部索引由 updateSearchIndex 独立更新, 可能与构建有时差; 该层允许这种抖动(故只放夜间, 不卡合并)。
test.describe('search (real backend)', () => {
  test('真实 Algolia 全文搜索往返成功并渲染结果', { tag: '@network' }, async ({ page }) => {
    await goto(page, '/home.html')
    await page.locator('.navigation-launcher').waitFor({ state: 'visible', timeout: 20_000 })
    await page.keyboard.press('Control+k')
    const input = page.locator('.palette-input')
    await input.waitFor({ state: 'visible', timeout: 20_000 })
    await input.click()
    await page.keyboard.press('Tab') // -> fulltext

    // 关键词取自发现到的真实文档标题(DOC_ID 末段), 命中该文档自身在索引里的记录概率最大, 不写死任何具体词
    const kw = (DOC_ID.split('-').pop() ?? 'java').trim()

    // 真的发出 Algolia 请求并断言 200: 证明端到端打通了真实后端(不依赖索引里恰好有什么内容)
    const [resp] = await Promise.all([
      page.waitForResponse((r) => /(algolia\.net|algolianet\.com)\/1\/indexes\//.test(r.url()), { timeout: 20_000 }),
      (async () => {
        await input.fill(kw)
        await page.keyboard.press('Enter')
      })(),
    ])
    expect(resp.ok()).toBeTruthy()
    // kw=真实文档标题, 预期至少命中该文档自身 -> 渲染出结果行(外部索引陈旧时可能为空, 属该层可接受的抖动)
    await expect(page.locator('.palette-item').first()).toBeVisible({ timeout: 20_000 })
  })
})

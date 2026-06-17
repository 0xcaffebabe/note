import { test, expect, goto, stubAlgolia, docHitFixture, SEARCH_KW, DOC_ID } from './fixtures'

// 全文搜索(P1): stub 掉 algolia 网络请求 仍走 CommandPalette + SearchService 的真实链路
// 交互流程(对照 CommandPalette.vue): Ctrl+K 打开(默认 category) -> Tab 切到 fulltext -> 输入/回车触发 search(kw,'algolia')
test.describe('search (P1, stubbed)', () => {
  test('Ctrl+K 全文搜索渲染出 stub 注入的真实结果内容', async ({ page }) => {
    await stubAlgolia(page, { hits: docHitFixture() })
    await goto(page, '/home.html')

    // Ctrl+K 的快捷键监听在 App.vue mounted 后才挂上(domcontentloaded 早于水合)
    // 等头部搜索入口出现 == 应用已挂载 再按键 否则按早了无人响应
    await page.locator('.search-box').waitFor({ state: 'visible', timeout: 20_000 })
    await page.keyboard.press('Control+k')
    const input = page.locator('.palette-input')
    await input.waitFor({ state: 'visible', timeout: 20_000 })
    await input.click()
    await page.keyboard.press('Tab') // category -> fulltext
    await input.fill(SEARCH_KW)
    await page.keyboard.press('Enter') // 跳过 300ms 防抖 立即执行

    await expect(page.locator('.palette-item').first()).toBeVisible({ timeout: 20_000 })
    // 不止「渲染了某一行」(那几乎只是在测 mock): 断言渲染出的正是 stub 注入的片段内容,
    // 否则 SearchService 把高亮字段映射错(渲染错字段)这类回归会悄悄通过。
    // docHitFixture 的 segment.txt 含独有字符串「片段示例」, 它应出现在结果副标题里。
    await expect(page.locator('.palette-list')).toContainText('片段示例', { timeout: 20_000 })
  })
})

// 真实后端冒烟(@network): 不 stub, 让 algoliasearch 客户端真的打 Algolia(凭据是硬编码的公开 search-only key, CI 无需密钥)。
// 由 PR 门禁排除(--grep-invert @network), 仅夜间 cron 跑 —— 这才让 e2e.yml 里「@network=真实 Algolia」名副其实。
// 注: 外部索引由 updateSearchIndex 独立更新, 可能与构建有时差; 该层允许这种抖动(故只放夜间, 不卡合并)。
test.describe('search (real backend)', () => {
  test('真实 Algolia 全文搜索往返成功并渲染结果', { tag: '@network' }, async ({ page }) => {
    await goto(page, '/home.html')
    await page.locator('.search-box').waitFor({ state: 'visible', timeout: 20_000 })
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

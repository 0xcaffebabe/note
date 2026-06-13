import { test, expect, goto, stubAlgolia, docHitFixture, SEARCH_KW } from './fixtures'

// 全文搜索(P1): stub 掉 algolia 网络请求 仍走 CommandPalette + SearchService 的真实链路
// 交互流程(对照 CommandPalette.vue): Ctrl+K 打开(默认 category) -> Tab 切到 fulltext -> 输入/回车触发 search(kw,'algolia')
test.describe('search (P1)', () => {
  test('Ctrl+K 全文搜索渲染结果(algolia 已 stub)', async ({ page }) => {
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
  })
})

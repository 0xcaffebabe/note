import { test, expect, goto, pathnameOf, waitForHtmlChange } from './fixtures'

// /catalog.html 此前零 e2e 覆盖。冒烟 + 轻语义: 真实分类数据加载 + 计数 > 0 + 文档链接可导航。
test.describe('catalog page (P1)', () => {
  test('目录页加载真实分类数据并渲染分类卡片', async ({ page }) => {
    await goto(page, '/catalog.html')
    await page.waitForSelector('.catalog-page')
    // 统计文案证明 CategoryService 数据已加载完成(形如「N 篇笔记 · M 个分类」)
    await expect(page.locator('.catalog-stat')).toContainText(/\d+\s*篇笔记/, { timeout: 20_000 })
    // 分类卡片来自真实目录树
    await expect.poll(() => page.locator('.catalog-card').count(), { timeout: 20_000 }).toBeGreaterThan(0)
    // 至少一篇文档叶子链接, href 指向 .html 且非空(证明 docId2HtmlPath 生成成功)
    const leaf = page.locator('.catalog-leaf[href$=".html"]').first()
    await leaf.waitFor({ state: 'visible', timeout: 20_000 })
    const href = await leaf.getAttribute('href')
    expect((href ?? '').length).toBeGreaterThan('.html'.length)
  })

  test('点击目录文档链接导航到对应 .html', async ({ page }) => {
    await goto(page, '/catalog.html')
    await page.waitForSelector('.catalog-page')
    const leaf = page.locator('.catalog-leaf[href$=".html"]').first()
    await leaf.waitFor({ state: 'visible', timeout: 20_000 })
    const before = pathnameOf(page) // /catalog.html
    await leaf.click()
    await waitForHtmlChange(page, before)
    expect(pathnameOf(page)).toMatch(/\.html$/)
    expect(pathnameOf(page)).not.toBe('/catalog.html')
  })
})

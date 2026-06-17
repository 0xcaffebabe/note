import { test, expect, goto, NO_ANIM } from './fixtures'

// /tag.html 标签筛选此前未测(只测了 /tag -> /tag.html 重定向)。
// 动态发现一个真实标签, 验证「点击 -> 选中 -> 列出该标签下文档」与 ?tag= 预选, 不写死任何具体标签名。
test.describe('tag page filtering (P1)', () => {
  test('点击标签筛选出该标签下的文档(占位提示消失)', async ({ page }) => {
    await goto(page, '/tag.html')
    const firstChip = page.locator('.tag-chip').first()
    await firstChip.waitFor({ state: 'visible', timeout: 20_000 })
    // 选中前: 占位提示在(尚未选任何标签)
    await expect(page.locator('.data-hint')).toBeVisible()
    await firstChip.click()
    await expect(firstChip).toHaveClass(/is-active/)
    // 选中后: 列出该标签下文档(>=1 条), 占位提示消失 —— 证明确实在「筛选」而非仅切换视觉态
    await expect.poll(() => page.locator('.chapter-list li').count(), { timeout: 20_000 }).toBeGreaterThan(0)
    await expect(page.locator('.data-hint')).toBeHidden()
  })

  test('?tag= 预选: 带 query 进入时对应标签即为选中态并出结果', async ({ page }) => {
    // 先发现一个真实标签名(chip 文本去掉计数即数据里的 tag, 大小写敏感)
    await goto(page, '/tag.html')
    const firstChip = page.locator('.tag-chip').first()
    await firstChip.waitFor({ state: 'visible', timeout: 20_000 })
    const countText = ((await firstChip.locator('.tag-chip-count').textContent()) ?? '').trim()
    const fullText = ((await firstChip.textContent()) ?? '').trim()
    const tagName = fullText.replace(countText, '').trim()
    expect(tagName.length).toBeGreaterThan(0)

    // 直接用精确编码带 ?tag= 进入(绕开 goto 的 encodeURI 以免对中文标签双重编码)
    await page.goto('/tag.html?tag=' + encodeURIComponent(tagName), { waitUntil: 'domcontentloaded' })
    await page.addStyleTag({ content: NO_ANIM }).catch(() => {})
    // created() 钩子读取 query.tag 并预选 -> 至少一个 chip 处于选中态, 结果列表非空
    await expect(page.locator('.tag-chip.is-active')).not.toHaveCount(0, { timeout: 20_000 })
    await expect.poll(() => page.locator('.chapter-list li').count(), { timeout: 20_000 }).toBeGreaterThan(0)
  })
})

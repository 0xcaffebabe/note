import { test, expect, goto } from './fixtures'

// 聚类页此前只断言「有 canvas」。补确定性交互: 控件存在 + 搜不存在的词显示「无匹配」, 证明搜索接线到了图。
// 不测的: 节点点击导航是 canvas 像素级、不确定; 2D/3D 切换依赖 WebGL, headless 下可能被禁(只断言控件渲染, 不强切)。
test.describe('cluster page interaction (P1)', () => {
  test('聚类图渲染 canvas 且 2D/3D 切换控件存在', async ({ page }) => {
    await goto(page, '/cluster.html')
    await page.waitForSelector('.cluster-host canvas', { timeout: 20_000 })
    expect(await page.locator('.cluster-host canvas').count()).toBeGreaterThan(0)
    // 2D / 3D 两个切换按钮渲染出来(WebGL 不可用时 3D 仅 disabled, 仍存在)
    await expect(page.locator('.cluster-tools .el-radio-button')).toHaveCount(2)
  })

  test('搜索不存在的关键词显示「无匹配」反馈', async ({ page }) => {
    await goto(page, '/cluster.html')
    await page.waitForSelector('.cluster-host canvas', { timeout: 20_000 })
    const search = page.locator('.cluster-search input.el-input__inner')
    await search.waitFor({ state: 'visible', timeout: 20_000 })
    await search.fill('zzz不存在的聚类关键词qqq')
    // 250ms 防抖后 matchCount===0 -> .cluster-nomatch 显示, 证明搜索 -> applyHighlight -> 图重绘链路接通
    await expect(page.locator('.cluster-nomatch')).toBeVisible({ timeout: 20_000 })
  })
})

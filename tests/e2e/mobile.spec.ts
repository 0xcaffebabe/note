import { test, expect, goto, pathnameOf, DOC } from './fixtures'

// 移动端布局(P5 路由合流后): 同一无前缀 URL 在小视口(Pixel 5, ≤820)渲染移动布局
// 不再有 /m 分流/重定向 —— 桌面与移动共用单一路由树, 由响应式断点驱动外壳与组件形态
// 本文件只在 playwright.config 的 mobile-chromium 工程运行; 每个 test 自带全新 context
test.describe('mobile layout (mobile project)', () => {
  test('移动端首页同 URL 渲染移动外壳(无 /m 重定向)', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.main-layout.is-mobile')
    // URL 保持无前缀: 不再跳 /m/
    expect(pathnameOf(page)).toBe('/home.html')
    expect(pathnameOf(page)).not.toMatch(/^\/m\//)
  })

  test('移动端文档页同 URL 渲染底部操作栏', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    expect(pathnameOf(page)).toBe(DOC)
    expect(pathnameOf(page)).not.toMatch(/^\/m\//)
  })
})

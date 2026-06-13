import { test, expect, goto, pathnameOf, waitForPath, DOC } from './fixtures'

// 移动端分流(P0/P1): 本文件只在 playwright.config 的 mobile-chromium 工程(Pixel 5)运行
// 该设备 UA + 视口≤820 触发 SysUtils.isMobile() => tablet2Mobile 守卫把 / 路由重定向到 /m/*
// 每个 test 自带全新 context 故 isMobile() 的 UA 缓存不会跨用例污染
test.describe('mobile split (mobile project)', () => {
  test('移动端访问 /home.html 重定向到 /m/ 并渲染移动布局', async ({ page }) => {
    await goto(page, '/home.html')
    await waitForPath(page, '/m/home.html')
    expect(pathnameOf(page)).toBe('/m/home.html')
    await page.waitForSelector('.mobile-layout')
  })

  test('移动端文档页渲染底部导航栏', async ({ page }) => {
    await goto(page, DOC)
    await waitForPath(page, '/m' + DOC)
    expect(pathnameOf(page)).toBe('/m' + DOC)
    await page.waitForSelector('.mobile-bottom-bar')
  })
})

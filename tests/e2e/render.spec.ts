import { test, expect, goto, DOC, docWithCode } from './fixtures'

// 文档渲染管线(P1) + 静态化关键不变量
test.describe('doc rendering (P1)', () => {
  // .html 入口是带「预渲染正文」的真实静态文件(含 .static-content) —— 利于直达阅读/爬虫/SW 缓存命中
  // (无后缀路径 /运维/Docker 由服务端 sirv 直接补 .html 返回同一文件 客户端再校正 URL 见 routing P0-8)
  test('.html 是带正文的真实静态文件', async ({ page }) => {
    await goto(page, DOC) // 确保 preview 服务已就绪
    const real = await page.evaluate((u) => fetch(u).then((r) => r.text()), encodeURI(DOC))
    expect(real).toContain('static-content')
  })

  test('标题渲染后带 slug id(目录锚点与 headingId 定位依赖)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    // id 由渲染管线注入 用 poll 容忍极短的注入窗口
    await expect
      .poll(async () => page.$$eval('.markdown-section h2', (els) => els.filter((e) => !e.id).length), {
        timeout: 20_000,
      })
      .toBe(0)
  })

  test('代码块被 Prism 高亮(注入 token span)', async ({ page }) => {
    const docWithCodeBlock = docWithCode()
    test.skip(!docWithCodeBlock, '构建产物中未发现含可高亮语言代码块的文档')
    await goto(page, docWithCodeBlock!)
    // 必须等 SPA 把 contentHtml 渲染进 .markdown-section(静态正文已被 main.ts 移除)
    await page.waitForSelector('.markdown-section h2')
    // Prism 客户端高亮(DocPostRender 在 idle 回调里跑)成功 = 代码块里出现 .token span
    await expect
      .poll(() => page.locator('.markdown-section pre code .token').count(), { timeout: 20_000 })
      .toBeGreaterThan(0)
  })
})

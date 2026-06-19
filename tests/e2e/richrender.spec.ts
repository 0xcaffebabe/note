import { test, expect, goto, docWithMermaid, docWithMath } from './fixtures'

// 客户端富渲染管线(Mermaid / KaTeX)。
// 这两类标记在「预渲染 .html」里并不存在——它们由 DocRender(marked 自定义渲染)在客户端从 .md.json
// 生成占位结构, 再由后处理把占位升级为最终图形:
//  - Mermaid: DocRender.code(lang=mermaid) → <div class="mermaid-wrapper"><div id="mermaid-*" class="mermaid-source">原始代码</div></div>
//             DocPage.postRender → eventManager.renderMermaid → MermaidUtils.initAllNode
//             成功后把 .mermaid-source 的 innerHTML 替换为内联 <svg> 并加类 .mermaid-rendered(失败加 .mermaid-render-error)
//  - KaTeX:  KatexExtension → 块 $$..$$ 渲染为 <div class="line_tex tex" raw="..">、行内 $..$ 为 <span class="inline_tex tex" raw="..">
//             DocPage.postRender → renderLatex(DocPostRender.renderLatex) 动态加载 katex 把每个 .tex 渲成 .katex
//             渲染异常时占位元素里会塞 <span style='color:red'>错误信息</span>
// 故按「源 markdown 特征」发现文档(docWithMermaid/docWithMath), 都为空时 skip。
test.describe('client rich rendering (P1)', () => {
  test('Mermaid 围栏在客户端渲染为内联 SVG', async ({ page }) => {
    const d = docWithMermaid()
    test.skip(!d, '构建产物中未发现含 ```mermaid 围栏的文档')
    await goto(page, d!)
    // 等 SPA 把 contentHtml 渲进 .markdown-section(预渲染静态正文已被 main.ts 移除)
    await page.waitForSelector('.markdown-section h2')

    // 占位结构先到位: DocRender 产出 .mermaid-wrapper > .mermaid-source(id^=mermaid-)
    const wrapper = page.locator('.markdown-section .mermaid-wrapper').first()
    await expect(wrapper).toBeAttached({ timeout: 20_000 })
    await expect(wrapper.locator('.mermaid-source')).toHaveCount(1)

    // mermaid 体积大且懒加载 + IntersectionObserver(rootMargin 300px)按需渲染;
    // 首图通常在视口内或 300px 余量内 故应被渲染。轮询直到 .mermaid-source 内出现内联 <svg>。
    const firstSource = page.locator('.markdown-section .mermaid-wrapper .mermaid-source').first()
    await firstSource.scrollIntoViewIfNeeded().catch(() => {})
    await expect
      .poll(() => firstSource.locator('svg').count(), { timeout: 20_000 })
      .toBeGreaterThan(0)

    // 渲染成功路径会打上 .mermaid-rendered(失败则 .mermaid-render-error)——确认走的是成功分支
    await expect(firstSource).toHaveClass(/mermaid-rendered/, { timeout: 20_000 })
    // 不应残留渲染失败兜底(MermaidUtils.renderNode 失败时塞 .mermaid-error-msg)
    await expect(page.locator('.markdown-section .mermaid-error-msg')).toHaveCount(0)

    // 内联 SVG 应有实际尺寸(非空壳): viewBox 或宽高其一存在
    const svg = firstSource.locator('svg').first()
    const hasGeometry = await svg.evaluate((el) => {
      const r = (el as SVGElement).getBoundingClientRect()
      return !!el.getAttribute('viewBox') || (r.width > 0 && r.height > 0)
    })
    expect(hasGeometry).toBe(true)
  })

  test('KaTeX 块/行内公式在客户端渲染为 .katex(无错误标记)', async ({ page }) => {
    const m = docWithMath()
    test.skip(!m, '构建产物中未发现含 $$ 数学公式的文档')
    await goto(page, m!)
    await page.waitForSelector('.markdown-section h2')

    // 占位先到位: KatexExtension 产出 .tex(块 .line_tex / 行内 .inline_tex)
    await expect
      .poll(() => page.locator('.markdown-section .tex').count(), { timeout: 20_000 })
      .toBeGreaterThan(0)
    const texCount = await page.locator('.markdown-section .tex').count()

    // katex 动态加载后在 idle 分片里把每个 .tex 渲成 .katex 结构(katex.render 注入 .katex 根)
    await expect
      .poll(() => page.locator('.markdown-section .tex .katex').count(), { timeout: 20_000 })
      .toBeGreaterThan(0)

    // 全部占位都应完成升级: 不应留下未渲染的 .tex(既无 .katex 也非错误)
    // renderLatex 对每个 .tex 要么成功(子里出现 .katex)要么失败(塞 <span style='color:red'>)
    await expect
      .poll(
        () =>
          page.locator('.markdown-section .tex').evaluateAll((els) =>
            els.filter((el) => !el.querySelector('.katex') && !el.querySelector("span[style*='color:red']")).length
          ),
        { timeout: 20_000 }
      )
      .toBe(0)

    // 关键断言: 不应出现 KaTeX 渲染错误兜底(throwOnError 被 catch 后写入红色 span)
    const errorMarkers = await page
      .locator(".markdown-section .tex span[style*='color:red']")
      .count()
    expect(errorMarkers).toBe(0)

    // 已渲染的 .katex 数量应覆盖所有占位(全部成功升级)
    await expect
      .poll(() => page.locator('.markdown-section .tex .katex').count(), { timeout: 20_000 })
      .toBeGreaterThanOrEqual(texCount)

    // .katex 应有可见数学排版内容(katex 会注入 .katex-html 或带注解的 .katex-mathml)
    const katexHasContent = await page
      .locator('.markdown-section .tex .katex')
      .first()
      .evaluate((el) => !!el.querySelector('.katex-html, .katex-mathml, .base'))
    expect(katexHasContent).toBe(true)
  })
})

import { test, expect, goto, docWithMermaid, docWithMath, DOC, pathnameOf, openNavigationTools } from './fixtures'
import fs from 'fs'
import mermaid from 'mermaid'
import type { Locator } from '@playwright/test'

// 使用 .txt 保存 Markdown，避免构建器将测试夹具作为站点文档发布。
const mathFixture = fs.readFileSync(new URL('./data/math-rendering.txt', import.meta.url), 'utf8')

// 颜色基准来自 mermaid.live 管理的内置主题，不复制站点初始化逻辑。
async function expectModernTheme(svg: Locator, dark = false) {
  mermaid.initialize({ theme: dark ? 'redux-dark-color' : 'redux-color' })
  const variables = mermaid.mermaidAPI.getConfig().themeVariables
  const palette = {
    fills: variables.bkgColorArray as string[],
    borders: variables.borderColorArray as string[],
    background: variables.clusterBkg as string,
    text: variables.nodeTextColor as string,
  }
  await expect(svg).toBeVisible()
  const nodes = svg.locator('.cluster[data-color-id][data-look="neo"]')
  await expect(nodes.first()).toBeVisible()
  const matches = await nodes.evaluateAll((elements, colors) => {
    const normalize = (color: string) => {
      const probe = document.createElement('span')
      probe.style.color = color
      document.body.appendChild(probe)
      const result = getComputedStyle(probe).color
      probe.remove()
      return result
    }
    return elements.map(node => {
      const slot = Number(node.getAttribute('data-color-id')!.replace('color-', ''))
      const shape = getComputedStyle(node.querySelector('rect, polygon, circle, path')!)
      return {
        actual: { fill: shape.fill, stroke: shape.stroke },
        expected: { fill: normalize(colors.fills[slot] ?? colors.background), stroke: normalize(colors.borders[slot]) },
      }
    })
  }, palette)
  expect(matches.map(color => color.actual)).toEqual(matches.map(color => color.expected))
  const labelColor = await svg.evaluate((el, color) => {
    const probe = document.createElement('span')
    probe.style.color = color
    document.body.appendChild(probe)
    const expected = getComputedStyle(probe).color
    probe.remove()
    return { actual: getComputedStyle(el.querySelector('.node .nodeLabel p')!).color, expected }
  }, palette.text)
  expect(labelColor.actual).toBe(labelColor.expected)
  await expect(svg.locator('.node .nodeLabel').first()).toHaveCSS('font-family', /Recursive Variable/)
}

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
  test('打开的全屏查看器跟随系统主题重绘', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const jsonPath = DOC.replace(/\.html$/, '.md.json')
    await page.route(url => decodeURI(url.pathname) === jsonPath, async route => {
      const response = await route.fetch()
      const file = await response.json()
      file.content = '## 全屏主题回归\n\n```mermaid\nflowchart LR\n subgraph Plan[Plan]\n A[System light]\n end\n subgraph Result[Result]\n B[System dark]\n end\n A --> B\n```'
      await route.fulfill({ response, json: file })
    })
    await goto(page, DOC)
    await page.locator('.main-content .mermaid-source').scrollIntoViewIfNeeded()
    await expect(page.locator('.main-content .mermaid-source')).toHaveClass(/mermaid-rendered/, { timeout: 20_000 })
    await page.locator('.main-content').getByRole('button', { name: '全屏查看图表' }).click()
    const viewer = page.getByRole('dialog', { name: '查看', exact: true })
    const svg = viewer.locator('svg[id^="mermaid-viewer-"]')
    await expectModernTheme(svg)
    const previousId = await svg.getAttribute('id')
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(svg).not.toHaveAttribute('id', previousId!)
    await expectModernTheme(svg, true)
    await expect(viewer.locator('.svg-pan-zoom_viewport')).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('system::theme'))).toBeNull()
    await page.keyboard.press('Escape')
    await expect(viewer).toBeHidden()
    await expectModernTheme(page.locator('.main-content .mermaid-source svg'), true)
  })

  test('按图种采用默认主题，系统暗色、切回亮色和显式主题均正确', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ colorScheme: 'dark' })
    const jsonPath = DOC.replace(/\.html$/, '.md.json')
    await page.route(url => decodeURI(url.pathname) === jsonPath, async route => {
      const response = await route.fetch()
      const file = await response.json()
      file.content = [
        '## 图种默认主题回归',
        '```mermaid\nflowchart LR\n subgraph Plan[Plan]\n A[Research] --> B[Compare]\n end\n subgraph Result[Result]\n C[Fix]\n end\n B --> C\n```',
        '```mermaid\npie title Pie keeps its own default\n "A": 30\n "B": 70\n```',
        '```mermaid\n---\nconfig:\n  theme: forest\n---\nflowchart LR\n subgraph Authored[Authored forest]\n A[Keep this theme] --> B[Across site modes]\n end\n```',
      ].join('\n\n')
      await route.fulfill({ response, json: file })
    })
    await goto(page, DOC)
    await expect(page.locator('html')).toHaveClass(/dark/)
    expect(await page.evaluate(() => localStorage.getItem('system::theme'))).toBeNull()
    const sources = page.locator('.main-content .mermaid-source')
    for (let n = 0; n < 3; n++) {
      await sources.nth(n).scrollIntoViewIfNeeded()
      await expect(sources.nth(n)).toHaveClass(/mermaid-rendered/, { timeout: 20_000 })
    }
    const flow = sources.nth(0).locator('svg')
    const pie = sources.nth(1).locator('svg')
    const forest = sources.nth(2).locator('svg')
    await flow.scrollIntoViewIfNeeded()
    await expectModernTheme(flow, true)
    await expect(pie.locator('.pieCircle')).toHaveCount(2)
    await expect(forest.locator('.cluster[data-color-id]')).toHaveCount(0)
    const authoredFill = await forest.locator('.node rect').first().evaluate(el => getComputedStyle(el).fill)
    expect(await page.evaluate(() => Array.from(document.fonts).some(font =>
      font.family.replace(/["']/g, '') === 'Recursive Variable' && font.status === 'loaded'
    ))).toBe(true)

    const oldIds = await sources.locator('svg').evaluateAll(elements => elements.map(el => el.id))
    const navigation = await openNavigationTools(page)
    await navigation.locator('.theme-row .el-switch').click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await page.keyboard.press('Escape')
    await expect(navigation).toBeHidden()
    for (let n = 0; n < 3; n++) {
      await expect(sources.nth(n).locator('svg')).not.toHaveAttribute('id', oldIds[n])
    }
    await flow.scrollIntoViewIfNeeded()
    await expectModernTheme(flow)
    await expect(pie.locator('.pieCircle')).toHaveCount(2)
    expect(await forest.locator('.node rect').first().evaluate(el => getComputedStyle(el).fill)).toBe(authoredFill)
    await expect(page.locator('.mermaid-error-msg')).toHaveCount(0)
    await testInfo.attach('mermaid-live-defaults', { body: await page.screenshot(), contentType: 'image/png' })
  })

  test('KaTeX 固定夹具的行内、块级及分段公式均完成渲染', async ({ page }, testInfo) => {
    // #622: 固定公式与断言都由测试维护；DOC 仅提供动态发现的页面路由。
    // 知识文档改名、删除或内容演化不会改变被测公式。
    const jsonPath = DOC.replace(/\.html$/, '.md.json')
    await page.route(url => decodeURI(url.pathname) === jsonPath, async route => {
      const response = await route.fetch()
      const file = await response.json()
      file.content = mathFixture
      await route.fulfill({ response, json: file })
    })
    await goto(page, DOC)
    await expect(page.getByRole('heading', { name: '数学公式回归夹具' })).toBeVisible()

    const blocks = page.locator('.markdown-section .line_tex')
    const inline = page.locator('.markdown-section .inline_tex')
    await expect(blocks).toHaveCount(4)
    await expect(inline).toHaveCount(2)
    await expect(page.locator('.markdown-section .tex .katex')).toHaveCount(6, { timeout: 20_000 })
    await expect(page.locator(".markdown-section .tex span[style*='color:red']")).toHaveCount(0)
    await expect(blocks.first()).toHaveAttribute('raw', 'A = U \\Sigma V^T')
    await expect(blocks.locator('.katex-mathml mtable > mtr')).toHaveCount(2)
    await expect(inline.locator('annotation')).toHaveText(['V \\subseteq F^n', 'H_0'])
    await testInfo.attach('固定公式夹具渲染', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })

  test('右键预览支持 Mermaid 全屏缩放，重复打开不影响正文图表', async ({ page }) => {
    test.setTimeout(60_000)
    // 在文档数据边界提供固定图表，走真实 Markdown、右键预览与 Mermaid 渲染管线。
    const jsonPath = DOC.replace(/\.html$/, '.md.json')
    await page.route(url => decodeURI(url.pathname) === jsonPath, async route => {
      const response = await route.fetch()
      const file = await response.json()
      file.content = '## Mermaid 预览回归\n\n```mermaid\ngraph TD\n subgraph Input[Input]\n A[Preview start]\n end\n subgraph Output[Output]\n B[Preview end]\n end\n A --> B\n```'
      await route.fulfill({ response, json: file })
    })
    await goto(page, DOC)
    const mainSource = page.locator('.main-content .mermaid-source').first()
    await mainSource.scrollIntoViewIfNeeded()
    await expect(mainSource).toHaveClass(/mermaid-rendered/, { timeout: 20_000 })
    const mainSvg = mainSource.locator('svg')
    let mainSvgId = await mainSvg.getAttribute('id')
    await expectModernTheme(mainSvg)
    const beforePath = pathnameOf(page)
    const menuItem = page.locator('.el-menu .el-menu-item.is-active').first()
    const viewer = page.getByRole('dialog', { name: '查看', exact: true })
    // 先使用正文查看器，让其隐藏容器留在 DOM 中，验证预览不会操作错误实例。
    await page.locator('.main-content').getByRole('button', { name: '全屏查看图表' }).click()
    await expect(viewer.locator('.svg-pan-zoom_viewport')).toBeVisible({ timeout: 20_000 })
    await page.keyboard.press('Escape')
    await expect(viewer).toBeHidden()

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt === 1) {
        const navigation = await openNavigationTools(page)
        await navigation.locator('.theme-row .el-switch').click()
        await expect(page.locator('html')).toHaveClass(/dark/)
        await page.keyboard.press('Escape')
        await expect(navigation).toBeHidden()
        await expect(mainSvg).not.toHaveAttribute('id', mainSvgId!)
        mainSvgId = await mainSvg.getAttribute('id')
        await expectModernTheme(mainSvg, true)
      }
      await menuItem.click({ button: 'right' })
      const preview = page.getByRole('dialog', { name: '文档预览' })
      await expect(preview).toBeVisible()
      const source = preview.locator('.mermaid-source')
      await source.scrollIntoViewIfNeeded()
      await expect(source).toHaveClass(/mermaid-rendered/, { timeout: 20_000 })
      const svg = source.locator('svg')
      await expect(svg).toBeVisible()
      await expect(svg).toContainText('Preview start')
      await expectModernTheme(svg, attempt === 1)
      expect(await svg.getAttribute('id')).not.toBe(mainSvgId)
      await preview.getByRole('button', { name: '全屏查看图表' }).click()
      await expect(viewer).toBeVisible()
      await expect(viewer.locator('svg[id^="mermaid-viewer-"]')).toContainText('Preview start', { timeout: 20_000 })
      await expectModernTheme(viewer.locator('svg[id^="mermaid-viewer-"]'), attempt === 1)
      const viewport = viewer.locator('.svg-pan-zoom_viewport')
      await expect(viewport).toBeVisible()
      const transform = await viewport.getAttribute('transform')
      await viewer.locator('[id="svg-pan-zoom-zoom-in"]').click()
      await expect(viewport).not.toHaveAttribute('transform', transform!)
      await expect(preview).toBeVisible()
      if (attempt === 0) {
        const screenshot = test.info().outputPath('mermaid-default-light.png')
        await page.screenshot({ path: screenshot })
        await test.info().attach('mermaid-preview-fullscreen', {
          path: screenshot, contentType: 'image/png',
        })
        await page.keyboard.press('Escape')
      } else {
        const screenshot = test.info().outputPath('mermaid-default-dark.png')
        await page.screenshot({ path: screenshot })
        await test.info().attach('mermaid-preview-fullscreen-dark', {
          path: screenshot, contentType: 'image/png',
        })
        await viewer.locator('.el-dialog__headerbtn').click()
      }
      await expect(viewer).toBeHidden()
      await expect(preview).toBeVisible()
      await expect(svg).toBeVisible()
      await expect(mainSvg).toHaveAttribute('id', mainSvgId!)
      await expect(page.locator('.mermaid-error-msg')).toHaveCount(0)
      expect(pathnameOf(page)).toBe(beforePath)
      await preview.getByRole('button', { name: '关闭预览' }).click()
      await expect(preview).toBeHidden()
    }
    await page.locator('.main-content').getByRole('button', { name: '全屏查看图表' }).click()
    await expect(viewer.locator('.svg-pan-zoom_viewport')).toBeVisible({ timeout: 20_000 })
    await expect(viewer.locator('svg[id^="mermaid-viewer-"]')).toContainText('Preview start')
    await page.keyboard.press('Escape')
    await expect(viewer).toBeHidden()
  })

  test('无效 Mermaid 的全屏查看器显示错误，关闭后保留预览', async ({ page }) => {
    const jsonPath = DOC.replace(/\.html$/, '.md.json')
    await page.route(url => decodeURI(url.pathname) === jsonPath, async route => {
      const response = await route.fetch()
      const file = await response.json()
      file.content = '## 无效图表\n\n```mermaid\nnot-a-diagram\n```'
      await route.fulfill({ response, json: file })
    })
    await goto(page, DOC)
    await page.locator('.main-content .mermaid-wrapper').waitFor()
    await page.locator('.el-menu .el-menu-item.is-active').first().click({ button: 'right' })
    const preview = page.getByRole('dialog', { name: '文档预览' })
    await preview.getByRole('button', { name: '全屏查看图表' }).click()
    const viewer = page.getByRole('dialog', { name: '查看', exact: true })
    await expect(viewer.getByRole('alert')).toContainText('Mermaid 图表渲染失败', { timeout: 20_000 })
    await page.keyboard.press('Escape')
    await expect(viewer).toBeHidden()
    await expect(preview).toBeVisible()
    await preview.getByRole('button', { name: '关闭预览' }).click()
  })

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

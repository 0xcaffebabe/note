import { test, expect, goto, openNavigationTools, waitForPath, DOC } from './fixtures'

// 站点导航中的文档工具: 思维导图(jsMind/svg) / 知识网络(echarts) / 知识回顾(echarts 散点).
// 三个面板都是 defineAsyncComponent + panels[name] 开关首开才挂载(见 DocPage.setup.openPanel):
//   - 点击下拉项 -> $emit -> DocPage 调 openPanel -> 异步 chunk 下载 -> ref 就绪后 .show()
//   - 知识网络首开额外调 .init() 触发 echarts.init + 数据拉取
// 这里只断言「面板骨架 + 图表容器存在」, 不断言像素:
//   jsMind(svg) / echarts(canvas) 在 headless 下尺寸/绘制不稳, 容器 DOM 才是可靠信号.
// 合成一条 spec 摊薄文档加载(DOC 富渲染较重), 每个面板内嵌「开 -> 容器就绪 -> 关」.

// 每次选择后导航收起, 故每开一个面板前都要重新打开导航工具.
async function openDocTool(page: import('@playwright/test').Page, label: string) {
  const navigation = await openNavigationTools(page)
  await navigation.getByRole('button', { name: label }).click()
  await expect(navigation).toBeHidden()
}

test.describe('导航中的文档工具', () => {
  test('思维导图 / 知识网络 / 知识回顾 依次懒挂载、容器就绪并可关闭', async ({ page }) => {
    await goto(page, DOC)
    // 等正文异步注入后再操作导航
    await page.waitForSelector('.markdown-section h2', { timeout: 20000 })
    await expect(page.locator('.tool-box')).toHaveCount(0)

    // ---------- 思维导图 (jsMind, svg 引擎) ----------
    await openDocTool(page, '思维导图')
    // 面板骨架: 抽屉内 .mind-panel + 标题"思维导图"
    const mindPanel = page.locator('.mind-panel')
    await expect(mindPanel).toBeVisible({ timeout: 20000 })
    await expect(mindPanel.locator('.panel-title')).toHaveText('思维导图')
    // 图表容器: Mind.vue 渲染 #mindGraphMind.mind-container(jsMind 在内注入 svg/jmnodes)
    const mindContainer = page.locator('#mindGraphMind.mind-container')
    await expect(mindContainer).toBeAttached({ timeout: 20000 })
    // jsMind 初始化后会在容器内注入 jmnodes(根节点等); 给宽松超时(布局/绘制抖动)
    await expect(mindContainer.locator('jmnodes')).toBeAttached({ timeout: 20000 })
    // 关闭: 头部 .panel-close 按钮 (title="关闭 (Esc)")
    await mindPanel.locator('.panel-close').click()
    await expect(mindPanel).toBeHidden({ timeout: 20000 })

    // ---------- 知识网络 (echarts force/circular, 首开触发 init) ----------
    await openDocTool(page, '知识网络')
    const netPanel = page.locator('.net-panel')
    await expect(netPanel).toBeVisible({ timeout: 20000 })
    await expect(netPanel.locator('.panel-title')).toHaveText('知识网络')
    // echarts 容器: KnowledgeNetworkChart 渲染 .knowledge-network-chart-container.
    // 注意: 页面里同类容器有多份 —— TOC 区的 RightBottomPanel(轮播迷你图谱)/其放大对话框也各挂一份;
    // 故必须把容器锚定在工具栏抽屉 .net-panel 内, 否则 strict-mode 会撞上侧栏那几份.
    const netContainer = netPanel.locator('.knowledge-network-chart-container')
    await expect(netContainer).toBeAttached({ timeout: 20000 })
    // 首开 init() 调用 echarts.init(chartDom) -> 容器内注入 <canvas>; 即"图表已挂"信号(不验像素)
    await expect(netContainer.locator('canvas').first()).toBeAttached({ timeout: 20000 })
    await netPanel.locator('.panel-close').click()
    await expect(netPanel).toBeHidden({ timeout: 20000 })

    // ---------- 知识回顾 (echarts 散点 + 时间线) ----------
    await openDocTool(page, '知识回顾')
    const reviewPanel = page.locator('.review-panel')
    await expect(reviewPanel).toBeVisible({ timeout: 20000 })
    await expect(reviewPanel.locator('.panel-title')).toHaveText('知识回顾')
    // 散点容器: KnowledgeScatter 渲染 .knowledge-scatter-container > .container(echarts 宿主)
    const scatterHost = reviewPanel.locator('.knowledge-scatter-container')
    await expect(scatterHost).toBeAttached({ timeout: 20000 })
    const scatterChart = scatterHost.locator('.container')
    await expect(scatterChart).toBeAttached({ timeout: 20000 })
    // echarts 散点首次挂载注入 <canvas>; 容器存在即"图表已挂", 不断言坐标/像素
    await expect(scatterChart.locator('canvas').first()).toBeAttached({ timeout: 20000 })
    await reviewPanel.locator('.panel-close').click()
    await expect(reviewPanel).toBeHidden({ timeout: 20000 })
  })

  test('未展开导航可用快捷键，跨路由清理并恢复文档工具', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    await page.keyboard.press('Alt+l')
    const mindPanel = page.locator('.mind-panel')
    await expect(mindPanel).toBeVisible()
    await mindPanel.locator('.panel-close').click()
    await page.locator('.navigation-launcher').focus()
    await page.keyboard.press('Enter')
    await page.getByRole('navigation', { name: '站内导航' }).getByRole('link', { name: '标签', exact: true }).click()
    await expect(page.getByRole('heading', { name: '标签', exact: true })).toBeVisible()
    await expect(page.locator('.navigation-launcher')).toHaveCount(1)
    const navigation = await openNavigationTools(page)
    await expect(navigation.getByRole('group', { name: '文档工具' })).toHaveCount(0)
    await page.keyboard.press('Escape')
    await page.keyboard.press('Alt+l')
    await expect(mindPanel).toHaveCount(0)
    // 续读入口位于导航栏，工具弹层只包含站点设置和文档工具。
    await page.locator('.navigation-launcher').focus()
    await page.keyboard.press('Enter')
    const recent = page.getByRole('navigation', { name: '站内导航' })
    await recent.getByRole('link', { name: '返回最近文档', exact: true }).click()
    await waitForPath(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    await page.keyboard.press('Alt+l')
    await expect(mindPanel).toHaveCount(1)
    await expect(mindPanel).toBeVisible()
  })

  test('导航中的字号设置即时生效并在刷新后保留', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    await openDocTool(page, '更多设置')
    const settings = page.getByRole('dialog', { name: '更多设置', exact: true })
    await expect(settings).toBeVisible()
    const slider = settings.getByRole('slider', { name: '字体大小' })
    await slider.focus()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.main.markdown-section')).toHaveCSS('font-size', '15px')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.main.markdown-section')).toHaveCSS('font-size', '15px')
  })

  test('复制路径后收起导航并将键盘焦点返回入口', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: async (text: string) => { (window as any).__copiedText = text },
      })
    })
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    const navigation = await openNavigationTools(page)
    await navigation.getByRole('button', { name: '路径复制' }).click()
    await expect(navigation).toBeHidden()
    await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toBe(DOC.replace(/\.html$/, '.md'))
    await expect(page.locator('.navigation-launcher')).toBeFocused()
  })
})

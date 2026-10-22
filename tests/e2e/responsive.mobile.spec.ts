import { test, expect, goto, openNavigationTools, pathnameOf, waitForPath, waitForHtmlChange, stubAlgolia, docHitFixture, SEARCH_KW, DOC } from './fixtures'

// 响应式合流(P3a/P3b/P4)移动端验证。文件名含 mobile.spec.ts => 仅在 mobile-chromium(Pixel 5, ≤820, 粗指针)运行。
// 移动端 DocPage: 底部操作栏 / 章节抽屉 / 目录抽屉 / 站点导航中的文档工具 / 统一搜索。

// 移动端 URL 不变量(P5 合流: 移动端复用单一路由树, 不再有 /m 分流/重定向)。
// 这是 mobile project 唯一断言 URL 落点的地方 —— routing.spec.ts 跑在 desktop project, 不覆盖「移动视口下 URL 是否被改写」。
// (原 mobile.spec.ts 的两条 pathnameOf 断言并入此处; 否则若回归把移动端重定向到 /m, 纯渲染用例仍会绿、悄悄漏掉)
test.describe('mobile URL invariants (Pixel 5, no /m split)', () => {
  test('移动端首页同 URL 渲染移动外壳(无 /m 重定向)', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.main-layout.is-mobile')
    expect(pathnameOf(page)).toBe('/home.html')
    expect(pathnameOf(page)).not.toMatch(/^\/m\//)
  })

  test('移动端文档页同 URL 渲染底部操作栏(无 /m 重定向)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    expect(pathnameOf(page)).toBe(DOC)
    expect(pathnameOf(page)).not.toMatch(/^\/m\//)
  })
})

test.describe('mobile DocPage (Pixel 5)', () => {
  test('底部操作栏仅保留目录/章节/回顶三个入口, 无桌面 backtop', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await expect(page.locator('.mobile-bottom-bar button')).toHaveCount(3)
    await expect(page.locator(".mobile-bottom-bar button[aria-label='打开站点目录']")).toBeVisible()
    await expect(page.locator(".mobile-bottom-bar button[aria-label='打开本页章节']")).toBeVisible()
    await expect(page.locator('.mobile-bottom-bar').getByRole('button', { name: /搜索/ })).toHaveCount(0)
    await expect(page.locator(".mobile-bottom-bar button[aria-label='回到顶部']")).toBeVisible()
    await expect(page.locator('.el-backtop')).toHaveCount(0)
  })
  test('手机可从外层导航返回最近文档并切换到聚类页面', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await goto(page, DOC)
    await expect(page.locator('#app .main-content .markdown-section')).toBeVisible()
    const launcher = page.locator('.navigation-launcher')
    await expect(launcher).toHaveAttribute('aria-expanded', 'false')
    await launcher.tap()
    const navigation = page.getByRole('navigation', { name: '站内导航' })
    await expect(navigation).toBeInViewport({ ratio: 1 })
    await expect(page.locator('.dock-shortcuts')).toBeInViewport({ ratio: 1 })
    await expect(navigation.getByRole('button', { name: '返回最近文档', exact: true })).toBeDisabled()
    await navigation.getByRole('link', { name: '标签', exact: true }).tap()
    await waitForPath(page, '/tag.html')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await launcher.tap()
    await expect(page.locator('.dock-shortcuts')).toBeInViewport({ ratio: 1 })
    await testInfo.attach('recent-document-mobile-320px', { body: await page.screenshot(), contentType: 'image/png' })
    await navigation.getByRole('link', { name: '返回最近文档', exact: true }).tap()
    await waitForPath(page, DOC)
    await expect(page.locator('#app .main-content .markdown-section')).toBeVisible()
    await expect(launcher).toHaveAttribute('aria-expanded', 'false')
    await launcher.tap()
    await navigation.getByRole('link', { name: '聚类', exact: true }).tap()
    await waitForPath(page, '/cluster.html')
    await expect(page.locator('.cluster-host canvas').first()).toBeVisible({ timeout: 20000 })
    await expect(launcher).toHaveAttribute('aria-expanded', 'false')
  })

  test('章节按钮打开底部 TOC 抽屉(复用 contents-list mode=drawer)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await page.click(".mobile-bottom-bar button[aria-label='打开本页章节']")
    await page.waitForSelector('.mobile-toc-drawer .toc-container.mode-drawer')
    await expect(page.locator('.mobile-toc-drawer')).toBeVisible()
    await expect(page.locator('.mobile-toc-drawer .el-drawer__title')).toHaveText('本页章节')
  })

  test('TOC 抽屉点击章节: 滚动 + 写入 ?headingId + 关闭抽屉', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await page.click(".mobile-bottom-bar button[aria-label='打开本页章节']")
    await page.waitForSelector('.mobile-toc-drawer .toc-container.mode-drawer')
    const links = page.locator('.mobile-toc-drawer .toc a')
    const n = await links.count()
    test.skip(n === 0, '该文档无章节标题, 跳过')
    await links.first().click()
    await page.waitForFunction(() => new URL(location.href).searchParams.has('headingId'), undefined, { timeout: 20000 })
    await expect(page.locator('.mobile-toc-drawer')).toBeHidden()
  })

  test('目录按钮打开右侧分类抽屉(store.showCategory)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await page.click(".mobile-bottom-bar button[aria-label='打开站点目录']")
    await page.waitForSelector('.mobile-category-drawer .category-content.mobile')
    await expect(page.locator('.mobile-category-drawer')).toBeVisible()
    await expect(page.locator('.mobile-category-drawer .drawer-title')).toHaveText('目录')
    await expect(page.locator('.mobile-category-drawer .el-menu').first()).toBeVisible()
  })

  test('手机从 SiteNavigation 搜索, 可切换目录和全文模式', async ({ page }, testInfo) => {
    await stubAlgolia(page, { hits: docHitFixture() })
    await goto(page, DOC)
    await expect(page.locator('#app .main-content .markdown-section')).toBeVisible()
    await page.locator('.navigation-launcher').tap()
    const navigation = page.getByRole('navigation', { name: '站内导航' })
    await expect(navigation.getByRole('button', { name: /^搜索/ })).toBeInViewport({ ratio: 1 })
    await testInfo.attach('mobile-search-navigation', { body: await page.screenshot(), contentType: 'image/png' })
    await navigation.getByRole('button', { name: /^搜索/ }).tap()
    const palette = page.locator('.command-palette')
    const input = palette.locator('.palette-input')
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('placeholder', '搜索目录(支持拼音)…')
    await palette.getByRole('button', { name: '全文', exact: true }).tap()
    await expect(input).toHaveAttribute('placeholder', '全文搜索, 回车立即执行…')
    await input.fill(SEARCH_KW)
    await input.press('Enter')
    await expect(palette.locator('.palette-item.segment').first()).toContainText(`${SEARCH_KW} 片段示例`)
    await palette.getByRole('button', { name: '目录', exact: true }).tap()
    await expect(input).toHaveAttribute('placeholder', '搜索目录(支持拼音)…')
  })

  // 不硬编码 8 项: 改测不变量 —— 桌面独有的「在VSC打开」缺席(fullOnly 过滤)、核心功能项均在、触屏不显快捷键。
  test('移动导航文档工具: 含核心项、不含桌面独有「在VSC打开」、触屏无快捷键', async ({ page }) => {
    await goto(page, DOC)
    await expect(page.locator('.tool-box')).toHaveCount(0)
    const navigation = await openNavigationTools(page)
    // 桌面独有项缺席(移动端区分标记)
    await expect(navigation.locator('.action-name', { hasText: '在VSC打开' })).toHaveCount(0)
    // 核心功能项移动端也都在(顺序无关)
    for (const name of ['思维导图', '知识网络', '知识回顾', '知识助手', '路径复制', '知识复制', '随机复习', '更多设置']) {
      await expect(navigation.locator('.action-name', { hasText: name })).toHaveCount(1)
    }
    // 触屏端(isTouch)不渲染键盘提示
    await expect(navigation.locator('.action-keys kbd')).toHaveCount(0)
    await navigation.getByRole('button', { name: '知识助手', exact: true }).tap()
    await expect(navigation).toBeHidden()
    await expect(page.getByRole('dialog', { name: '模板生成问题', exact: true })).toBeVisible()
  })

  test('移动文档页: 正文 + 面包屑 + 更新历史, 无桌面标签页', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.main.markdown-section')
    expect((await page.locator('.main.markdown-section').innerText()).trim().length).toBeGreaterThan(0)
    await expect(page.locator('.el-breadcrumb')).toBeVisible()
    await expect(page.locator('.footer-wrapper .block')).toContainText('更新历史')
    await expect(page.locator('.tab-container')).toHaveCount(0)
  })

  test('宽正文不把统一导航挤出视口，文档字号设置仍可操作', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    // 模拟长表格/不可换行内容撑宽正文的情形。
    await page.addStyleTag({ content: '.main-content { min-width: 700px; }' })
    const launcher = page.locator('.navigation-launcher')
    await expect.poll(async () => {
      const box = (await launcher.boundingBox())!
      return box.x + box.width
    }).toBeLessThanOrEqual(page.viewportSize()!.width)
    await launcher.tap()
    await page.getByRole('button', { name: '站点导航与工具', exact: true }).tap()
    const navigation = page.getByRole('dialog', { name: '站点导航与工具', exact: true })
    await navigation.getByRole('button', { name: '更多设置', exact: true }).tap()
    await expect(navigation).toBeHidden()
    const slider = page.getByRole('dialog', { name: '更多设置', exact: true }).getByRole('slider', { name: '字体大小' })
    await expect(slider).toHaveAttribute('aria-valuemax', '48')
    await slider.focus()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.main.markdown-section')).toHaveCSS('font-size', '17px')
  })

  test('回顶按钮滚回顶部', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.main.markdown-section')
    await page.evaluate(() => window.scrollTo(0, 1200))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    await page.click(".mobile-bottom-bar button[aria-label='回到顶部']")
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('移动端仅一个 CategoryList(无桌面粘性列泄漏)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await expect(page.locator('.doc-aside')).toHaveCount(0)
    await page.click(".mobile-bottom-bar button[aria-label='打开站点目录']")
    await page.waitForSelector('.mobile-category-drawer .el-menu')
    // 根菜单数 = CategoryList 实例数(嵌套 el-menu--inline 不计)
    await expect(page.locator('.el-menu:not(.el-menu--inline)')).toHaveCount(1)
  })
})

test.describe('mobile home & charts (Pixel 5)', () => {

  test('移动首页: is-mobile 外壳 + 统计卡片网格', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.main-layout.is-mobile')
    await page.waitForSelector('.stat-section')
    // 旧 el-descriptions 表格式外壳已弃用, 改为指标卡网格(CSS 自适应, 不再 :column 切换)
    expect(await page.locator('.statistic-wrapper, .mobile-statistic-wrapper').count()).toBe(0)
    expect(await page.locator('.stat-section .stat-card').count()).toBeGreaterThan(0)
  })

  test('移动首页无横向溢出, 图表均在视口内', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.stat-section')
    await expect.poll(
      () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      { timeout: 20000 }
    ).toBeLessThanOrEqual(2)
  })

  test('快速入口在窄屏收为单列', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.quick-access')
    const cols = await page.evaluate(() => getComputedStyle(document.querySelector('.quick-access')!).gridTemplateColumns)
    expect(cols.trim().split(/\s+/).length).toBe(1)
  })
})

test.describe('mobile regression guards (fixed defects)', () => {
  // 修复前: 从目录抽屉选文档后抽屉不自动关闭, 新文档加载在抽屉之下。
  // 修复后: beforeRouteUpdate 提交 setShowCategory(false), 选文档后抽屉关闭。
  test('统一导航图标静置即可见(底色与图标色不同)', async ({ page }) => {
    await goto(page, DOC)
    const btn = page.locator('.navigation-launcher')
    await btn.waitFor({ state: 'visible' })
    const colors = await page.evaluate(() => {
      const b = document.querySelector('.navigation-launcher') as HTMLElement
      const svg = b.querySelector('svg') as SVGElement | null
      return {
        hasIcon: !!svg,
        bg: getComputedStyle(b.closest('.site-dock')!).backgroundColor,
        icon: svg ? getComputedStyle(svg).color : '',
      }
    })
    expect(colors.hasIcon).toBe(true)
    expect(colors.bg).not.toBe('rgba(0, 0, 0, 0)') // 底色不透明
    expect(colors.bg).not.toBe(colors.icon) // 底色 != 图标色 -> 有对比, 不会隐形
  })

  test('从目录抽屉选文档后抽屉应自动关闭', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await page.click(".mobile-bottom-bar button[aria-label='打开站点目录']")
    await page.waitForSelector('.mobile-category-drawer .el-menu-item')
    const before = pathnameOf(page)
    const leaf = page.locator('.mobile-category-drawer .el-menu-item:not(.is-active)')
    const count = await leaf.count()
    test.skip(count === 0, '目录中无可导航的其他叶子项, 跳过')
    const target = leaf.first()
    await target.scrollIntoViewIfNeeded()
    await target.click()
    await waitForHtmlChange(page, before)
    await expect(page.locator('.mobile-category-drawer .el-drawer__body')).toBeHidden()
  })
})

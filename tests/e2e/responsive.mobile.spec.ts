import { test, expect, goto, pathnameOf, waitForHtmlChange, openNavigationTools, DOC } from './fixtures'

// 响应式合流(P3a/P3b/P4)移动端验证。文件名含 mobile.spec.ts => 仅在 mobile-chromium(Pixel 5, ≤820, 粗指针)运行。
// 移动端 DocPage 折叠自原 MobileDocPage: 底部操作栏 / 章节抽屉 / 目录抽屉 / FAB 工具栏 / 统一搜索。

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
  test('底部操作栏 4 个入口(目录/章节/搜索/回顶), 无桌面 backtop', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await expect(page.locator('.mobile-bottom-bar button')).toHaveCount(4)
    await expect(page.locator(".mobile-bottom-bar button[aria-label='打开站点目录']")).toBeVisible()
    await expect(page.locator(".mobile-bottom-bar button[aria-label='打开本页章节']")).toBeVisible()
    await expect(page.locator(".mobile-bottom-bar button[aria-label='打开搜索']")).toBeVisible()
    await expect(page.locator(".mobile-bottom-bar button[aria-label='回到顶部']")).toBeVisible()
    await expect(page.locator('.el-backtop')).toHaveCount(0)
  })

  test('文档页点击展开横向导航，避开底栏与上方工具按钮', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    const dock = page.locator('.site-dock')
    const launcher = dock.locator('.navigation-launcher')
    const shortcuts = dock.locator('.dock-shortcuts')
    await expect(dock).toBeVisible()
    await expect(dock.locator('button:visible')).toHaveCount(1)
    await expect(launcher).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('.site-navigation-panel')).toBeHidden()
    await expect(page.locator('.site-header, .el-header, .header-toggle-button')).toHaveCount(0)
    const target = (await launcher.boundingBox())!
    expect(target.width).toBe(44)
    expect(target.height).toBe(44)
    await launcher.tap()
    await expect(shortcuts).toBeVisible()
    await expect(shortcuts.locator('.site-nav a')).toHaveCount(3)
    await expect(shortcuts.locator('.search-box')).toBeVisible()
    const dockBox = (await dock.boundingBox())!
    const bottomBar = (await page.locator('.mobile-bottom-bar').boundingBox())!
    expect(dockBox.y + dockBox.height).toBeLessThanOrEqual(bottomBar.y)
    expect(dockBox.x).toBeGreaterThanOrEqual(0)
    expect(dockBox.x + dockBox.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    const tools = (await page.locator('.tool-box.is-mobile').boundingBox())!
    expect(tools.y + tools.height).toBeLessThanOrEqual(dockBox.y)
    await launcher.tap()
    await expect(shortcuts).toBeHidden()
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

  test('搜索按钮经 EventBus 打开统一 CommandPalette', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await page.click(".mobile-bottom-bar button[aria-label='打开搜索']")
    await page.waitForSelector('.command-palette .palette-input')
    await expect(page.locator('.command-palette')).toHaveCount(1)
    await expect(page.locator('.command-palette .palette-input')).toBeVisible()
  })

  // 不硬编码 8 项: 改测不变量 —— 桌面独有的「在VSC打开」缺席(fullOnly 过滤)、核心功能项均在、触屏不显快捷键。
  test('移动 FAB 工具栏: 含核心项、不含桌面独有「在VSC打开」、触屏无快捷键', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.tool-box.is-mobile .tool-button')
    await page.click('.tool-box.is-mobile .tool-button')
    await page.waitForSelector('.dropdown-menu .action-name')
    // 桌面独有项缺席(移动端区分标记)
    await expect(page.locator('.dropdown-menu .action-name', { hasText: '在VSC打开' })).toHaveCount(0)
    // 核心功能项移动端也都在(顺序无关)
    for (const name of ['思维导图', '知识网络', '知识回顾', '知识助手', '路径复制', '知识复制', '随机复习', '更多设置']) {
      await expect(page.locator('.dropdown-menu .action-name', { hasText: name })).toHaveCount(1)
    }
    // 触屏端(isTouch)不渲染键盘提示
    await expect(page.locator('.dropdown-menu .action-keys kbd')).toHaveCount(0)
  })

  test('移动文档页: 正文 + 面包屑 + 更新历史, 无桌面标签页', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.main.markdown-section')
    expect((await page.locator('.main.markdown-section').innerText()).trim().length).toBeGreaterThan(0)
    await expect(page.locator('.el-breadcrumb')).toBeVisible()
    await expect(page.locator('.footer-wrapper .block')).toContainText('更新历史')
    await expect(page.locator('.tab-container')).toHaveCount(0)
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
  test('320px 横向导航可点开且不横溢，横屏工具面板可滚动到底部链接', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await goto(page, '/tag.html')
    const dock = page.locator('.site-dock')
    const launcher = dock.locator('.navigation-launcher')
    await expect(dock).toBeVisible()
    await expect(launcher).toHaveAttribute('aria-expanded', 'false')
    await launcher.tap()
    await expect(dock.locator('.dock-shortcuts')).toBeVisible()
    const dockBox = (await dock.boundingBox())!
    expect(dockBox.x).toBeGreaterThanOrEqual(0)
    expect(dockBox.x + dockBox.width).toBeLessThanOrEqual(320)
    await expect(dock.locator('.dock-action:visible')).toHaveCount(6)
    for (const action of await dock.locator('.dock-action:visible').all()) {
      const box = (await action.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.x).toBeGreaterThanOrEqual(dockBox.x)
      expect(box.x + box.width).toBeLessThanOrEqual(dockBox.x + dockBox.width)
    }
    await expect(page.locator('.site-navigation-panel')).toBeHidden()
    await launcher.tap()
    await expect(dock.locator('.dock-shortcuts')).toBeHidden()

    await page.setViewportSize({ width: 640, height: 260 })
    await expect(page.locator('.site-navigation-panel')).toBeHidden()
    const navigation = await openNavigationTools(page)
    const panel = navigation.locator('.site-navigation-panel')
    await expect(navigation.getByRole('switch')).toBeFocused()
    const panelBox = (await navigation.boundingBox())!
    expect(panelBox.y).toBeGreaterThanOrEqual(0)
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(260)
    expect(await panel.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
    const lastLink = panel.locator('.panel-links a').last()
    await lastLink.scrollIntoViewIfNeeded()
    await expect(lastLink).toBeInViewport()
    expect(await panel.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  })

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

  test('聚类从移动横向导航可达，跳转后收起', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await page.locator('.navigation-launcher').tap()
    const shortcuts = page.locator('.dock-shortcuts')
    const item = shortcuts.locator('.site-nav').getByRole('link', { name: '聚类', exact: true })
    await item.waitFor({ state: 'visible', timeout: 20000 })
    await item.click()
    await page.waitForFunction(() => location.pathname.endsWith('/cluster.html'), undefined, { timeout: 20000 })
    expect(pathnameOf(page)).toBe('/cluster.html')
    await expect(shortcuts).toBeHidden()
    await page.waitForSelector('.cluster-host canvas', { timeout: 20000 })
  })
})

test.describe('mobile regression guards (fixed defects)', () => {
  // 修复前: 从目录抽屉选文档后抽屉不自动关闭, 新文档加载在抽屉之下。
  // 修复后: beforeRouteUpdate 提交 setShowCategory(false), 选文档后抽屉关闭。
  // 修复前: 移动端用 type=primary(白图标), 但通用 .tool-button 卡片底色以更高特异度盖住蓝底,
  // 白图标落浅底"隐形", 唤起获得 :focus 蓝底后才显形。修复后: 与桌面端一致的描边+卡片底+深色图标。
  test('FAB 图标静置即可见(底色与图标色不同, 非两浅色相融)', async ({ page }) => {
    await goto(page, DOC)
    const btn = page.locator('.tool-box.is-mobile .tool-button')
    await btn.waitFor({ state: 'visible' })
    const colors = await page.evaluate(() => {
      const b = document.querySelector('.tool-box.is-mobile .tool-button') as HTMLElement
      const svg = b.querySelector('svg') as SVGElement | null
      return {
        hasIcon: !!svg,
        bg: getComputedStyle(b).backgroundColor,
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

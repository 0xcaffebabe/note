import { test, expect, goto, pathnameOf, waitForHtmlChange, DOC } from './fixtures'

// 响应式合流(P3a/P3b/P4)移动端验证。文件名含 mobile.spec.ts => 仅在 mobile-chromium(Pixel 5, ≤820, 粗指针)运行。
// 移动端 DocPage 折叠自原 MobileDocPage: 底部操作栏 / 章节抽屉 / 目录抽屉 / FAB 工具栏 / 统一搜索。

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

  test('移动 FAB 工具栏: 8 项(不含 full 档的在VSC打开)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.tool-box.is-mobile .tool-button')
    await page.click('.tool-box.is-mobile .tool-button')
    await page.waitForSelector('.dropdown-menu .action-name')
    await expect(page.locator('.dropdown-menu .action-name', { hasText: '在VSC打开' })).toHaveCount(0)
    expect(await page.locator('.dropdown-menu .action-name').count()).toBe(8)
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
  test('移动首页: is-mobile 外壳 + 统计 :column=1', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.main-layout.is-mobile')
    await page.waitForSelector('.mobile-statistic-wrapper')
    expect(await page.locator('.statistic-wrapper').count()).toBe(0)
    const labelsPerRow = await page.$$eval('.el-descriptions__body tr', rows => rows.map(r => r.querySelectorAll('.el-descriptions__label').length))
    expect(Math.max(...labelsPerRow)).toBe(1)
  })

  test('移动首页无横向溢出, 图表均在视口内', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.mobile-statistic-wrapper')
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

  test('聚类从移动顶栏溢出菜单可达', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await page.locator('.more-btn').click()
    const item = page.locator('.el-dropdown-menu__item', { hasText: '聚类' })
    await item.waitFor({ state: 'visible', timeout: 20000 })
    await item.click()
    await page.waitForFunction(() => location.pathname.endsWith('/cluster'), undefined, { timeout: 20000 })
    expect(pathnameOf(page)).toBe('/cluster')
    await page.waitForSelector('#docCluster canvas', { timeout: 20000 })
  })
})

test.describe('mobile regression guards (fixed defects)', () => {
  // 修复前: 从目录抽屉选文档后抽屉不自动关闭, 新文档加载在抽屉之下。
  // 修复后: beforeRouteUpdate 提交 setShowCategory(false), 选文档后抽屉关闭。
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

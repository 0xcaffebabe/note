import { test, expect, goto, pathnameOf, waitForPath, collectPageProblems, BENIGN_CONSOLE, DOC, DOC_NO_SUFFIX } from './fixtures'

// 响应式合流(P0–P6)桌面端验证: 单一无前缀路由树 + 响应式 DocPage/Home/Header/工具栏。
// 运行于 desktop-chromium(1440x900, 细指针)。断点为视口驱动, 故可用 setViewportSize 验证跨断点切换。
// 文件名不含 mobile.spec.ts => 仅在 desktop 工程运行。

// ── 路由完成后的桌面渲染 ─────────────────────────────────────────────────
// URL 落点本身(去前缀/自愈/重定向/query+hash 保留)归 routing.spec.ts 这个唯一 owner;
// 这里只断言「各路由跑通后, 桌面布局确实把正文/图渲染了出来」——render-after-route 是桌面专属角度。
test.describe('route-completion rendering (desktop)', () => {
  test('旧 /m/<doc> 去前缀+自愈后渲染正文(桌面)', async ({ page }) => {
    await goto(page, '/m' + DOC_NO_SUFFIX)
    await waitForPath(page, DOC)
    await expect(page.locator('.markdown-section').first()).toBeVisible()
  })

  test('旧 /m/cluster 去前缀后渲染聚类图(桌面)', async ({ page }) => {
    await goto(page, '/m/cluster')
    await waitForPath(page, '/cluster.html')
    await page.waitForSelector('.cluster-host canvas', { timeout: 20000 })
    expect(await page.locator('.cluster-host canvas').count()).toBeGreaterThan(0)
  })

  test('无后缀+尾斜杠自愈后渲染正文(桌面)', async ({ page }) => {
    await goto(page, DOC_NO_SUFFIX + '/')
    await waitForPath(page, DOC)
    await expect(page.locator('.markdown-section').first()).toBeVisible()
  })

  test('聚类从桌面顶栏导航可达并渲染', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section')
    await page.locator('.site-nav .nav-item', { hasText: '聚类' }).click()
    await waitForPath(page, '/cluster.html')
    expect(pathnameOf(page)).toBe('/cluster.html')
    await page.waitForSelector('.cluster-host canvas', { timeout: 20000 })
  })
})

// ── 桌面文档页布局 ──────────────────────────────────────────────────────
test.describe('desktop DocPage layout', () => {
  test('三栏布局: 正文 + TOC 列 + 分类侧栏 + 标签页, 无移动底栏', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    expect(pathnameOf(page)).toBe(DOC)
    await expect(page.locator('.doc-layout')).toHaveCount(1)
    await expect(page.locator('.doc-layout.is-mobile')).toHaveCount(0)
    await expect(page.locator('.doc-contents-and-panel .toc-container')).toHaveCount(1)
    await expect(page.locator('.doc-aside')).toBeVisible()
    await expect(page.locator('.tab-container .nav-tab-item').first()).toBeVisible()
    await expect(page.locator('.mobile-bottom-bar')).toHaveCount(0)
  })

  test('侧栏收起按钮隐藏/恢复分类列(showAside 接线)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    await expect(page.locator('.doc-aside')).toBeVisible()
    await page.locator('.aside-toggle-btn').click()
    await expect(page.locator('.doc-aside')).toBeHidden()
    await page.locator('.aside-toggle-btn').click()
    await expect(page.locator('.doc-aside')).toBeVisible()
  })

  // 不再逐字断言整份 9 项清单 + kbd==16(改词/调序/加一项即误挂、却无行为回归)。
  // 改测承载性不变量: 必备项均在(顺序无关)、「在VSC打开」是桌面独有标记、桌面非触屏下确有键盘提示。
  test('桌面工具栏下拉含必备项与桌面独有「在VSC打开」及键盘提示', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    await expect(page.locator('.tool-box.is-mobile')).toHaveCount(0)
    await page.locator('.tool-box .tool-button').click()
    await page.waitForSelector('.dropdown-menu .dropdown-item')
    // 必备功能项均存在(顺序无关)
    const mustHave = ['思维导图', '知识网络', '知识回顾', '知识助手', '路径复制', '知识复制', '随机复习', '更多设置']
    for (const name of mustHave) {
      await expect(page.locator('.dropdown-menu .action-name', { hasText: name })).toHaveCount(1)
    }
    // 「在VSC打开」是桌面独有(ToolBox fullOnly: true), 移动端用例断言其缺席 —— 二者构成区分桌/移动的不变量
    await expect(page.locator('.dropdown-menu .action-name', { hasText: '在VSC打开' })).toHaveCount(1)
    // 桌面(非触屏)应渲染键盘提示: 不数死 16, 只要确有 kbd 即证明 v-if 接线生效
    await expect.poll(() => page.locator('.dropdown-menu .action-keys kbd').count(), { timeout: 20_000 }).toBeGreaterThan(0)
  })

  test('正文中仅一个 LinkPopover(死实例已移除, 真实例在 CategoryList 内)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    await page.waitForSelector('.el-menu .el-menu-item')
    await expect(page.locator('body > .popover')).toHaveCount(1)
  })

  test('滚动时 TOC 活动标题高亮(IntersectionObserver)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.doc-contents-and-panel .toc-container')
    await page.waitForSelector('.markdown-section h2')
    await page.evaluate(() => {
      const hs = document.querySelectorAll('.main.markdown-section h1,.main.markdown-section h2,.main.markdown-section h3')
      if (hs.length) (hs[hs.length - 1] as HTMLElement).scrollIntoView()
    })
    await expect.poll(() => page.locator('.doc-contents-and-panel .toc a.active').count(), { timeout: 20000 }).toBe(1)
  })

  test('el-backtop 滚动后出现(桌面)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    await expect(page.locator('.el-backtop')).toHaveCount(0)
    await page.evaluate(() => window.scrollTo(0, 1500))
    await expect.poll(() => page.locator('.el-backtop').count(), { timeout: 20000 }).toBe(1)
  })
})

// ── 折叠隐患 / 静默损坏修复 ─────────────────────────────────────────────
test.describe('folded hazards & silent-break fixes (desktop)', () => {
  // 注: 正文内的跨文档链接大多被 DocService 抽取进"关联内容"面板并从正文剥离, 故
  // .markdown-section a[origin-link] 在多数文档中不存在; 站内链接路由 + 即时预览/外链归档
  // 的挂载已由审计在含 origin-link 的文档上实机验证。此处改测"加载不崩溃"作为稳健回归。
  test('文档页加载无控制台错误(事件注册 + 外链/预览组件挂载不崩溃)', async ({ page }) => {
    // 同时捕获未捕获异常与 console.error(只听 pageerror 会漏掉被 catch 后 console.error 的失败)
    const problems = collectPageProblems(page, BENIGN_CONSOLE)
    await goto(page, DOC)
    await page.waitForSelector('.main.markdown-section')
    await page.waitForSelector('.markdown-section h2') // 正文+标题已注入
    // 真实信号: 懒加载 chunk / 数据拉取已静默, 取代盲等 2s; 限时并吞掉超时(SW 后台流量可能永不 idle, 不让它拖到 30s)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    expect(problems).toEqual([])
  })

  test('桌面仅一个 CategoryList(粘性列, 无移动抽屉)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.doc-aside .el-menu')
    await expect(page.locator('.doc-aside')).toHaveCount(1)
    await expect(page.locator('.mobile-category-drawer')).toHaveCount(0)
    // CategoryList 渲染嵌套 el-menu(根 + el-menu--inline 子菜单); 用根菜单计 CategoryList 实例数
    await expect(page.locator('.el-menu:not(.el-menu--inline)')).toHaveCount(1)
  })

  test('搜索统一到 CommandPalette: Ctrl+Q / Ctrl+K 均开同一面板', async ({ page }) => {
    await goto(page, '/home.html')
    await page.locator('.search-box').waitFor({ state: 'visible' })
    await page.keyboard.press('Control+q')
    await page.waitForSelector('.command-palette .palette-input')
    await expect(page.locator('.command-palette')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('.command-palette .palette-input')).toBeHidden()
    await page.keyboard.press('Control+k')
    await page.waitForSelector('.command-palette .palette-input')
    await expect(page.locator('.command-palette')).toHaveCount(1)
  })

  test('仅一个 ToolBox 实例(单一 keydown 层), 下拉项不重复', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.tool-box .tool-button')
    await expect(page.locator('.tool-box')).toHaveCount(1)
    await page.locator('.tool-box .tool-button').click()
    await page.waitForSelector('.dropdown-menu .dropdown-item')
    // 「不重复」= 每个必备项恰好出现 1 次(双实例会让同名项变 2 个); 不再硬编码总数 9
    for (const name of ['思维导图', '知识网络', '在VSC打开', '更多设置']) {
      await expect(page.locator('.dropdown-menu .action-name', { hasText: name })).toHaveCount(1)
    }
  })
})

// ── 首页 + 响应式图表 ───────────────────────────────────────────────────
test.describe('home & responsive charts (desktop)', () => {
  test('首页渲染 banner + 快速入口 + 统计(卡片化)', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.stat-section')
    await page.waitForSelector('.quick-access')
    expect(await page.locator('.stat-section').count()).toBe(1)
    // 旧 el-descriptions 表格式外壳已弃用, 改为指标卡网格
    expect(await page.locator('.statistic-wrapper, .mobile-statistic-wrapper').count()).toBe(0)
    expect(await page.locator('.stat-section .stat-card').count()).toBeGreaterThan(0)
    expect(await page.locator('.main-layout.is-mobile').count()).toBe(0)
    await expect(page.locator('.hero .hero-title')).toBeVisible()
  })

  test('echarts 图表均挂载 canvas(代码构成/提交日历/各时段/趋势)', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.stat-section')
    // 4 张 echarts 图(代码构成/提交日历/各时段/趋势) + 词云, 各自在卡片内挂载 canvas
    await expect.poll(() => page.locator('.stat-section .chart-card canvas').count(), { timeout: 20000 }).toBeGreaterThanOrEqual(4)
  })

  test('词云绘制内容且 2D/3D 切换工作', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('#wordcloud')
    await page.waitForSelector('.wordcloud-wrapper .mode-switch .el-radio-button')
    await expect(page.locator('.wordcloud-wrapper .mode-switch .el-radio-button')).toHaveCount(2)
    // 桌面默认 3D(第 2 个)
    await expect(page.locator('.wordcloud-wrapper .mode-switch .el-radio-button:nth-child(2)')).toHaveClass(/is-active/)
    await page.click('.wordcloud-wrapper .mode-switch .el-radio-button:nth-child(1)')
    await expect(page.locator('.wordcloud-wrapper .mode-switch .el-radio-button:nth-child(1)')).toHaveClass(/is-active/)
  })

  test('首页加载无未捕获的图表数据解析异常(CommitTotalTrend try/catch)', async ({ page }) => {
    // 这里只关心 JSON 解析类异常(图表数据), 故不套 BENIGN 过滤, 直接按 JSON 报错特征筛 pageerror+console.error
    const problems = collectPageProblems(page)
    await goto(page, '/home.html')
    await page.waitForSelector('.stat-section')
    // 等图表数据(含 CommitTotalTrend)拉取静默, 取代盲等 4s; 限时并吞掉超时, 避免 SW 后台流量拖到 30s
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    expect(problems.filter(e => /is not valid JSON|Unexpected token|JSON\.parse/.test(e))).toHaveLength(0)
  })
})

// ── 跨断点响应式切换 ────────────────────────────────────────────────────
test.describe('responsive breakpoint switching (resize)', () => {
  test('文档页 1440→800→1440 外壳与栏目正确切换, URL 不变且无 /m', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.doc-contents-and-panel')
    const before = pathnameOf(page)
    await page.setViewportSize({ width: 800, height: 900 })
    await page.waitForSelector('.main-layout.is-mobile')
    await expect(page.locator('.mobile-bottom-bar')).toBeVisible()
    await expect(page.locator('.mobile-bottom-bar button')).toHaveCount(4)
    await expect(page.locator('.doc-contents-and-panel')).toHaveCount(0)
    await expect(page.locator('.tool-box.is-mobile')).toHaveCount(1)
    expect(pathnameOf(page)).toBe(before)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForFunction(() => !document.querySelector('.main-layout')?.classList.contains('is-mobile'))
    await expect(page.locator('.doc-contents-and-panel .toc-container')).toHaveCount(1)
    await expect(page.locator('.mobile-bottom-bar')).toHaveCount(0)
    expect(pathnameOf(page)).toBe(DOC)
  })

  test('Header 内联导航(>820) ↔ 图标按钮(≤820) 随宽度切换', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('.main-layout')
    await expect(page.locator('.site-nav')).toHaveCount(1)
    await expect(page.locator('.icon-btn')).toHaveCount(0)
    await page.setViewportSize({ width: 800, height: 900 })
    await page.waitForSelector('.main-layout.is-mobile')
    await expect(page.locator('.site-nav')).toHaveCount(0)
    await expect(page.locator('.icon-btn')).toHaveCount(3)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForFunction(() => !document.querySelector('.main-layout')?.classList.contains('is-mobile'))
    await expect(page.locator('.site-nav')).toHaveCount(1)
  })

  test('中档(821–1279): 非移动但 TOC 列收起为浮层(消除旧死区)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    await page.setViewportSize({ width: 1000, height: 900 })
    await page.waitForFunction(() => {
      const b = document.querySelector('.toc-toggle-btn')
      return b && getComputedStyle(b).display !== 'none'
    }, undefined, { timeout: 20000 })
    await expect(page.locator('.doc-layout.is-mobile')).toHaveCount(0)
    await expect(page.locator('.mobile-bottom-bar')).toHaveCount(0)
    await expect(page.locator('.doc-contents-and-panel.collapsed')).toHaveCount(1)
  })
})

// ── 回归守护: 本次 E2E 审计发现并已修复的缺陷 ───────────────────────────
test.describe('regression guards (fixed defects)', () => {
  // 修复前: P6 新增的 ResizeObserver/暗色重入 init() 无条件回退 3D, 2D 被静默改回 3D。
  // 修复后: init() 尊重 is3D, 2D 重入仍渲染 2D(canvas cursor=default 而非 3D 的 grab)。
  test('词云选 2D 后, 容器 resize 触发重排不应回退 3D', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForSelector('#wordcloud')
    await page.waitForSelector('.wordcloud-wrapper .mode-switch .el-radio-button')
    await expect.poll(() => page.evaluate(() => {
      const c = document.getElementById('wordcloud') as HTMLCanvasElement | null
      return c && c.width ? 1 : 0
    }), { timeout: 20000 }).toBe(1)
    await page.click('.wordcloud-wrapper .mode-switch .el-radio-button:nth-child(1)') // 选 2D
    // 触发 ResizeObserver 重入 init(): 须落到使卡片(--home-max 1080 限宽)实际变窄的宽度, 仍 >820 不切移动
    await page.setViewportSize({ width: 1100, height: 900 })
    await expect.poll(() => page.evaluate(() => {
      const c = document.getElementById('wordcloud') as HTMLCanvasElement | null
      return c ? c.style.cursor : ''
    }), { timeout: 20000 }).toBe('default') // 2D => default 光标; 若回退 3D 则为 grab
    await expect(page.locator('.wordcloud-wrapper .mode-switch .el-radio-button:nth-child(1)')).toHaveClass(/is-active/)
  })

  // 修复前: showMobileToc / vuex showCategory 在离开移动断点时未复位, 回到移动端抽屉自动重开。
  test('移动 TOC 抽屉不应在 desktop↔mobile 往返后自动重开', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 })
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await page.locator('.mobile-bottom-bar button', { hasText: '章节' }).click()
    await expect(page.locator('.mobile-toc-drawer .el-drawer__body')).toBeVisible()
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForSelector('.doc-contents-and-panel')
    await page.setViewportSize({ width: 800, height: 900 })
    await page.waitForSelector('.mobile-bottom-bar')
    await expect(page.locator('.mobile-toc-drawer .el-drawer__body')).toBeHidden()
  })

  test('移动目录抽屉不应在 desktop↔mobile 往返后自动重开', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 })
    await goto(page, DOC)
    await page.waitForSelector('.mobile-bottom-bar')
    await page.locator('.mobile-bottom-bar button', { hasText: '目录' }).click()
    await expect(page.locator('.mobile-category-drawer .el-drawer__body')).toBeVisible()
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForSelector('.doc-contents-and-panel')
    await page.setViewportSize({ width: 800, height: 900 })
    await page.waitForSelector('.mobile-bottom-bar')
    await expect(page.locator('.mobile-category-drawer .el-drawer__body')).toBeHidden()
  })
})

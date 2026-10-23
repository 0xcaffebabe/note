import { test, expect, goto, pathnameOf, waitForHtmlChange, DOC } from './fixtures'
import DocUtils from '../../src/core/util/DocUtils'

// 覆盖文档标签导航 DocTabNav.vue + TabNavContextMenu.vue + vuex 的
// removeFromCategoryList / removeFromCategoryListExcept。
// 真实选择器(读组件源得到):
//   标签容器: .tab-container  /  标签项: .nav-tab-item(激活态加 .active)
//   标签主体按钮: .tab-main  /  关闭键: .close-btn(仅 cateList.length>1 时渲染)
//   右键菜单: .context-menu[role=menu] 内 .menu-item, 文案为
//     「固定标签栏 / 取消固定标签栏」「关闭标签」「关闭其他标签」(分隔线 .menu-divider)
// 标签列表由 vuex currentCategoryList 驱动: 每访问一篇文档 setCurrentCategory 会把它的 link 追加进去。

// 打开 DOC, 再经侧栏 .el-menu .el-menu-item 打开「另一篇」文档, 直到出现 >=2 个标签。
// 返回 [第一个标签的 url, 第二个标签的 url]。
async function openTwoTabs(page: any): Promise<{ first: string; second: string }> {
  await goto(page, DOC)
  await page.waitForSelector('.markdown-section h2')
  await page.waitForSelector('.tab-container .nav-tab-item')
  await page.waitForSelector('.el-menu .el-menu-item', { state: 'visible', timeout: 20_000 })

  // 当前 DOC 自身对应一个标签; 点一个「不是当前激活页」的侧栏叶子项跳到第二篇文档。
  // .is-active 是当前文档, 排除它后取首个可见叶子。
  const candidate = page.locator('.el-menu .el-menu-item:not(.is-active)').first()
  await candidate.waitFor({ state: 'visible', timeout: 20_000 })
  const before = pathnameOf(page)
  await Promise.all([waitForHtmlChange(page, before), candidate.click()])
  await page.waitForSelector('.markdown-section h2')

  // 等到标签条出现至少 2 个标签(setCurrentCategory 异步追加)
  await expect
    .poll(() => page.locator('.tab-container .nav-tab-item').count(), { timeout: 20_000 })
    .toBeGreaterThanOrEqual(2)

  const urls = await page.locator('.tab-container .nav-tab-item').evaluateAll((els: Element[]) =>
    els.map((e) => e.getAttribute('url') || '')
  )
  return { first: urls[0], second: urls[1] }
}

test.describe('文档标签导航 DocTabNav', () => {
  test('访问两篇文档后标签条出现 >=2 个标签, 且当前文档标签为激活态', async ({ page }) => {
    await openTwoTabs(page)
    const tabs = page.locator('.tab-container .nav-tab-item')
    expect(await tabs.count()).toBeGreaterThanOrEqual(2)
    // 恰有一个激活标签(对应当前路由)
    await expect(page.locator('.tab-container .nav-tab-item.active')).toHaveCount(1)
    // 激活标签内含 aria-current=page 的主体按钮(无障碍接线)
    await expect(page.locator('.nav-tab-item.active .tab-main[aria-current="page"]')).toHaveCount(1)
  })

  test('点击非激活标签: 切换激活态并改变路由(仍以 .html 结尾)', async ({ page }) => {
    await openTwoTabs(page)
    const before = pathnameOf(page)

    // 找一个当前未激活的标签, 点它的主体按钮
    const inactive = page.locator('.tab-container .nav-tab-item:not(.active)').first()
    await expect(inactive).toBeVisible()
    const inactiveUrl = await inactive.getAttribute('url')

    await Promise.all([waitForHtmlChange(page, before), inactive.locator('.tab-main').click()])
    await page.waitForSelector('.markdown-section h2')

    // 路由变了且仍是 .html
    expect(pathnameOf(page)).toMatch(/\.html$/)
    expect(pathnameOf(page)).not.toBe(before)

    // 刚点的那个标签现在是激活态(按 url 定位), 且全局仍只有一个激活标签
    await expect(page.locator(`.nav-tab-item[url="${inactiveUrl}"]`)).toHaveClass(/active/)
    await expect(page.locator('.tab-container .nav-tab-item.active')).toHaveCount(1)
  })

  test('点击非激活标签的关闭键: 标签数减一, 路由不变(关的不是当前页)', async ({ page }) => {
    await openTwoTabs(page)
    const countBefore = await page.locator('.tab-container .nav-tab-item').count()
    const routeBefore = pathnameOf(page)

    // 关一个非激活标签 -> 当前页不受影响, 路由不应改变
    const inactive = page.locator('.tab-container .nav-tab-item:not(.active)').first()
    await inactive.hover() // 关闭键 hover/focus 才显现
    await inactive.locator('.close-btn').click()

    await expect
      .poll(() => page.locator('.tab-container .nav-tab-item').count(), { timeout: 20_000 })
      .toBe(countBefore - 1)
    // 关掉的是非当前标签 -> 路由保持不变, 激活标签仍唯一
    expect(pathnameOf(page)).toBe(routeBefore)
    await expect(page.locator('.tab-container .nav-tab-item.active')).toHaveCount(1)
  })

  test('关闭当前激活标签: 路由切换到另一标签(仍以 .html 结尾)', async ({ page }) => {
    await openTwoTabs(page)
    const countBefore = await page.locator('.tab-container .nav-tab-item').count()
    const routeBefore = pathnameOf(page)

    const active = page.locator('.tab-container .nav-tab-item.active')
    await active.hover()
    await Promise.all([waitForHtmlChange(page, routeBefore), active.locator('.close-btn').click()])

    // 标签数减一
    await expect
      .poll(() => page.locator('.tab-container .nav-tab-item').count(), { timeout: 20_000 })
      .toBe(countBefore - 1)
    // 关闭激活标签后路由换到了相邻标签, 且仍是 .html
    expect(pathnameOf(page)).toMatch(/\.html$/)
    expect(pathnameOf(page)).not.toBe(routeBefore)
    await expect(page.locator('.tab-container .nav-tab-item.active')).toHaveCount(1)
  })

  test('右键标签弹出上下文菜单, 含「关闭标签 / 关闭其他标签 / 固定标签栏」真实文案', async ({ page }) => {
    await openTwoTabs(page)
    const menu = page.locator('.context-menu[role="menu"]')

    await page.locator('.tab-container .nav-tab-item').first().click({ button: 'right' })
    await expect(menu).toBeVisible()

    // 三个菜单项(读源得到的真实文案; 固定项随 fixed 状态文案在「固定标签栏/取消固定标签栏」间切换)
    await expect(menu.locator('.menu-item', { hasText: '关闭标签' })).toHaveCount(1)
    await expect(menu.locator('.menu-item', { hasText: '关闭其他标签' })).toHaveCount(1)
    await expect(menu.locator('.menu-item', { hasText: /固定标签栏/ })).toHaveCount(1)
  })

  test('「关闭其他标签」把标签条收敛为 1 个标签', async ({ page }) => {
    const { first } = await openTwoTabs(page)
    expect(await page.locator('.tab-container .nav-tab-item').count()).toBeGreaterThanOrEqual(2)

    // 在第一个标签上右键 -> 关闭其他
    await page.locator(`.nav-tab-item[url="${first}"]`).click({ button: 'right' })
    const menu = page.locator('.context-menu[role="menu"]')
    await expect(menu).toBeVisible()
    await menu.locator('.menu-item', { hasText: '关闭其他标签' }).click()

    await expect
      .poll(() => page.locator('.tab-container .nav-tab-item').count(), { timeout: 20_000 })
      .toBe(1)
    // 只剩一个标签时 close-btn 不再渲染(v-if cateList.length>1)
    await expect(page.locator('.tab-container .nav-tab-item .close-btn')).toHaveCount(0)
    // 仅存的标签即被保留的那一个
    await expect(page.locator(`.nav-tab-item[url="${first}"]`)).toHaveCount(1)
  })

  test('「关闭标签」菜单项关闭右键的那个标签, 标签数减一', async ({ page }) => {
    const { second } = await openTwoTabs(page)
    const countBefore = await page.locator('.tab-container .nav-tab-item').count()

    await page.locator(`.nav-tab-item[url="${second}"]`).click({ button: 'right' })
    const menu = page.locator('.context-menu[role="menu"]')
    await expect(menu).toBeVisible()
    await menu.locator('.menu-item', { hasText: '关闭标签' }).click()

    await expect
      .poll(() => page.locator('.tab-container .nav-tab-item').count(), { timeout: 20_000 })
      .toBe(countBefore - 1)
    // 被右键的那个标签消失
    await expect(page.locator(`.nav-tab-item[url="${second}"]`)).toHaveCount(0)
  })

  test('Escape 关闭右键上下文菜单', async ({ page }) => {
    await openTwoTabs(page)
    const menu = page.locator('.context-menu[role="menu"]')

    await page.locator('.tab-container .nav-tab-item').first().click({ button: 'right' })
    await expect(menu).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
  })
})

test.describe('标签栏横向滚动', () => {
  test.use({ serviceWorkers: 'block' })

  test('标签挤满后仅在栏内滚动，跨宽屏断点及切换文档均不撑宽页面', async ({ page }) => {
    const catalog = await page.request.get('/category.json')
    expect(catalog.ok()).toBe(true)
    type Category = { link?: string; chidren?: Category[] }
    const linksOf = (nodes: Category[]): string[] => nodes.flatMap(node => [
      ...(node.link ? [node.link] : []), ...linksOf(node.chidren || []),
    ])
    const currentId = DocUtils.htmlUrl2Id(DOC)
    const links = [...new Set(linksOf(await catalog.json()))]
    const current = links.find(link => DocUtils.docUrl2Id(link) === currentId)!
    expect(current).toBeTruthy()
    // 恢复九个真实标签，选长标题保证在居中壳的最大宽度下也会挤满。
    const others = links.filter(link => link !== current)
      .sort((a, b) => DocUtils.docId2DisplayName(DocUtils.docUrl2Id(b)).length
        - DocUtils.docId2DisplayName(DocUtils.docUrl2Id(a)).length)
      .slice(0, 8)
    expect(others).toHaveLength(8)
    await page.addInitScript(tabs => {
      localStorage.setItem('system::currentCategoryList', JSON.stringify(tabs))
    }, [...others, current])

    // 固定正文与关联列，隔离文章更新和正文长表格等其他溢出来源。
    await page.route(url => decodeURI(url.pathname) === DOC.replace(/\.html$/, '.md.json'), async route => {
      const response = await route.fetch()
      const file = await response.json()
      file.content = '# 标签栏滚动回归\n\n## 正文\n\n阅读正文时，标签栏应在自身范围内滚动。\n\n'
        + '## 关联内容\n\n- [关联文档](/' + DocUtils.docId2Url(DocUtils.docUrl2Id(others[0])) + ') 继续阅读'
      delete file.relatedLinks
      await route.fulfill({ response, json: file })
    })
    await page.setViewportSize({ width: 2040, height: 900 })
    await goto(page, DOC)
    await expect(page.locator('.tab-container .nav-tab-item')).toHaveCount(9)
    await expect(page.locator('.doc-related-column')).toBeVisible()
    const wrapper = page.locator('.tab-container-wrapper')
    const tabs = page.locator('.tab-container .nav-tab-item')

    for (const width of [2040, 2560, 3440, 1920, 1440, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await expect.poll(() => page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth), {
        message: `标签挤满时 ${width}px 视口不应横向溢出`,
      }).toBeLessThanOrEqual(1)
      expect(await wrapper.evaluate(el => el.scrollWidth - el.clientWidth)).toBeGreaterThan(100)
      await wrapper.hover()
      await page.mouse.wheel(0, -10_000)
      // 滚动位置可能落在子像素上，容许不到 1% 的边缘舍入。
      await expect(tabs.first()).toBeInViewport({ ratio: 0.99 })
      await page.mouse.wheel(0, 10_000)
      await expect.poll(() => wrapper.evaluate(el => el.scrollLeft)).toBeGreaterThan(0)
      await expect(tabs.last()).toBeInViewport({ ratio: 0.99 })
      expect(await page.evaluate(() => window.scrollX)).toBe(0)
    }

    await page.setViewportSize({ width: 2040, height: 900 })
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await expect(page.locator('html')).toHaveClass(colorScheme === 'dark' ? /dark/ : /^(?!.*dark)/)
      await test.info().attach(`filled-doc-tabs-${colorScheme}`, {
        body: await page.screenshot(), contentType: 'image/png',
      })
    }
    await wrapper.hover()
    await page.mouse.wheel(0, -10_000)
    await expect(tabs.first()).toBeInViewport({ ratio: 0.99 })
    await Promise.all([waitForHtmlChange(page, DOC), tabs.first().locator('.tab-main').click()])
    await expect(page.locator('.nav-tab-item.active')).toBeInViewport({ ratio: 0.99 })
    expect(pathnameOf(page)).toBe(DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(others[0])))
    expect(await page.evaluate(() => window.scrollX)).toBe(0)
    await page.goBack()
    await expect(tabs.last()).toHaveClass(/active/)
    await expect(tabs.last()).toBeInViewport({ ratio: 0.99 })
    expect(await page.evaluate(() => window.scrollX)).toBe(0)
  })
})

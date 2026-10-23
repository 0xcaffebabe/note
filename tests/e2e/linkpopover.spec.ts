import { test, expect, goto, pathnameOf, waitForPath, openNavigationTools, DOC } from './fixtures'
import type { Locator, Page } from '@playwright/test'
import DocUtils from '../../src/core/util/DocUtils'

type Category = { link?: string; chidren?: Category[] }
const MAIN_TITLE = '多卡片阅读夹具'
const FIRST_TITLE = '预览卡片甲'
const SECOND_TITLE = '预览卡片乙'

function documentPaths(categories: Category[]): string[] {
  return categories.flatMap(category => [
    ...(category.link?.endsWith('.md')
      ? [DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(category.link))] : []),
    ...documentPaths(category.chidren || []),
  ])
}

async function prepareDocuments(page: Page, options: { failFirstPreview?: boolean; navigation?: boolean; emptySecond?: boolean } = {}) {
  // 使用真实文档地址，固定网络边界的正文，避免依赖知识内容中恰好有两条内链或足够长的正文。
  const catalog = await page.request.get('/category.json')
  expect(catalog.ok()).toBe(true)
  const paths = [...new Set(documentPaths(await catalog.json()))]
    .filter(path => path !== DOC && !['/README.html', '/SUMMARY.html'].includes(path))
  const [firstPath, secondPath, relatedPath] = paths
  if (!firstPath || !secondPath) throw new Error('多卡片阅读夹具需要两篇不同的现有文档')
  const firstMarkdown = firstPath.replace(/\.html$/, '.md')
  const secondMarkdown = secondPath.replace(/\.html$/, '.md')
  const relatedMarkdown = (relatedPath || DOC).replace(/\.html$/, '.md')
  const firstJsonPath = firstPath.replace(/\.html$/, '.md.json')
  let failFirstPreview = !!options.failFirstPreview
  const longContent = (title: string) => [
    '# ' + title,
    '## 继续阅读',
    ...(title === FIRST_TITLE && !options.navigation ? [`[从卡片继续阅读](${secondMarkdown})`] : []),
    ...Array.from({ length: 45 }, (_, i) =>
      `第 ${i + 1} 段：每张卡片可以保留自己的阅读位置，以便比较不同文档并继续阅读。`),
    ...(options.navigation ? [
      '## 深入阅读',
      `[从卡片继续阅读](${secondMarkdown})`,
      ...Array.from({ length: 15 }, () => '后续内容让标题可以定位到当前卡片滚动区域顶部。'),
      '## 关联内容',
      `- [${relatedMarkdown}](${relatedMarkdown}) 继续阅读关联主题`,
    ] : []),
  ].join('\n\n')
  const documents = new Map([
    [DOC.replace(/\.html$/, '.md.json'), {
      title: MAIN_TITLE,
      content: [
        '# ' + MAIN_TITLE,
        '## 预览入口',
        `[正文预览甲](${firstMarkdown})`,
        `[正文预览乙](${secondMarkdown})`,
        ...(options.navigation ? ['## 深入阅读', `[背景引用](${secondMarkdown})`] : []),
        ...Array.from({ length: 28 }, (_, i) => `第 ${i + 1} 段正文，用于比较预览卡片并继续阅读当前文档。`),
        '## 关联内容',
        `- [${firstMarkdown}](${firstMarkdown}) 关联预览入口`,
      ].join('\n\n'),
    }],
    [firstJsonPath, { title: FIRST_TITLE, content: longContent(FIRST_TITLE) }],
    [secondPath.replace(/\.html$/, '.md.json'), { title: SECOND_TITLE, content: options.emptySecond ? '没有章节和链接的短文。' : longContent(SECOND_TITLE) }],
  ])
  await page.route(url => documents.has(decodeURI(url.pathname)), async route => {
    if (decodeURI(new URL(route.request().url()).pathname) === firstJsonPath && failFirstPreview) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: 'null' })
      return
    }
    const response = await route.fetch()
    const file = await response.json()
    const document = documents.get(decodeURI(new URL(route.request().url()).pathname))!
    file.name = document.title + '.md'
    file.content = document.content
    if (options.navigation) {
      file.commitList = [{ hash: '654abc', date: '2026-10-20T00:00:00Z', message: '预览历史回归记录' }]
      file.hasMoreCommit = true
      file.totalCommits = 12
    }
    if (options.emptySecond && document.title === SECOND_TITLE) file.commitList = []
    delete file.relatedLinks
    await route.fulfill({ response, json: file })
  })
  await goto(page, DOC)
  await expect(page.locator('#app .main-content .markdown-section').getByRole('heading', { name: MAIN_TITLE })).toBeVisible()
  return { firstPath, secondPath, relatedPath: relatedPath || DOC, allowFirstPreview: () => { failFirstPreview = false } }
}

function card(page: Page, title: string): Locator {
  return page.getByRole('dialog', { name: '文档预览', exact: true })
    .filter({ has: page.locator('.popover-title', { hasText: title }) })
}

async function openFromBody(page: Page, which: '甲' | '乙') {
  await page.locator('#app .main-content .markdown-section')
    .getByRole('link', { name: '正文预览' + which, exact: true }).click({ modifiers: ['Alt'] })
  const preview = card(page, which === '甲' ? FIRST_TITLE : SECOND_TITLE)
  await expect(preview.locator('.preview-markdown').getByRole('heading', { name: which === '甲' ? FIRST_TITLE : SECOND_TITLE })).toBeVisible()
  expect(pathnameOf(page)).toBe(DOC)
  return preview
}

async function moveCard(page: Page, preview: Locator, x: number, y: number) {
  const box = await preview.boundingBox()
  const header = await preview.locator('.popover-header').boundingBox()
  if (!box || !header) throw new Error('预览卡片未显示')
  const handleX = header.x + 24
  const handleY = header.y + header.height / 2
  await page.mouse.move(handleX, handleY)
  await page.mouse.down()
  await page.mouse.move(handleX + x - box.x, handleY + y - box.y, { steps: 5 })
  await page.mouse.up()
}

async function resizeCard(page: Page, preview: Locator, width: number, height: number) {
  const box = await preview.boundingBox()
  const handle = await preview.getByRole('button', { name: '调整预览大小' }).boundingBox()
  if (!box || !handle) throw new Error('预览卡片未显示')
  const x = handle.x + handle.width / 2
  const y = handle.y + handle.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + width - box.width, y + height - box.height, { steps: 5 })
  await page.mouse.up()
  await expect.poll(async () => Math.round((await preview.boundingBox())!.width)).toBe(width)
  await expect.poll(async () => Math.round((await preview.boundingBox())!.height)).toBe(height)
}

async function readFurther(page: Page, preview: Locator, delta: number) {
  const body = preview.locator('.popover-body')
  await body.hover()
  await page.mouse.wheel(0, delta)
  await expect.poll(() => body.evaluate(el => el.scrollTop)).toBe(delta)
  return body.evaluate(el => el.scrollTop)
}

async function expectCenteredNavigation(preview: Locator) {
  const body = (await preview.locator('.popover-content').boundingBox())!
  const tabs = (await preview.locator('.preview-nav-tabs').boundingBox())!
  expect(Math.abs(tabs.y + tabs.height / 2 - body.y - body.height / 2)).toBeLessThanOrEqual(1)
  expect(tabs.y).toBeGreaterThanOrEqual(body.y)
  expect(tabs.y + tabs.height).toBeLessThanOrEqual(body.y + body.height)
}

async function expectSavedState(preview: Locator, box: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>, scrollTop: number) {
  await expect.poll(async () => {
    const restored = (await preview.boundingBox())!
    return ['x', 'y', 'width', 'height'].every(key =>
      Math.abs(restored[key as keyof typeof restored] - box[key as keyof typeof box]) <= 2)
  }).toBe(true)
  await expect.poll(() => preview.locator('.popover-body').evaluate(el => el.scrollTop)).toBe(scrollTop)
}

test.describe('文档预览卡片', () => {
  test.use({ serviceWorkers: 'block', colorScheme: 'light' })
  test.setTimeout(60_000)

  test('吸附目录和相关链接只定位当前卡片，底部展示该文档提交历史', async ({ page }) => {
    const { firstPath, relatedPath } = await prepareDocuments(page, { navigation: true })
    const first = await openFromBody(page, '甲')
    await expectCenteredNavigation(first)
    await expect(first.getByRole('button', { name: '本页章节', exact: true }).locator('.preview-nav-count')).toHaveText('3')
    await expect(first.getByRole('button', { name: '相关链接', exact: true }).locator('.preview-nav-count')).toHaveText('2')
    await first.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await moveCard(page, first, 800, 400)
    await resizeCard(page, first, 500, 450)
    const second = await openFromBody(page, '乙')
    await second.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await moveCard(page, second, 24, 100)
    await moveCard(page, first, 700, 100)
    await expectCenteredNavigation(first)
    await first.screenshot({ path: 'test-results/preview-docked-tabs-light.png' })
    const backgroundScroll = await page.evaluate(() => window.scrollY)
    const backgroundActive = await page.locator('#app .toc .active').getAttribute('href')
    const tocButton = first.getByRole('button', { name: '本页章节', exact: true })
    const toc = first.getByRole('region', { name: '本页章节', exact: true })
    await expect(tocButton).toHaveAttribute('aria-expanded', 'false')
    await tocButton.hover()
    await expect(toc).toBeVisible()
    const headingLink = toc.getByRole('link', { name: '深入阅读', exact: true })
    await headingLink.click()
    await expect.poll(() => first.locator('.popover-body').evaluate(el => el.scrollTop)).toBeGreaterThan(500)
    await expect(headingLink).toHaveClass(/active/)
    await expect.poll(() => toc.locator('.toc-progress-bar').evaluate(el => parseFloat((el as HTMLElement).style.width))).toBeGreaterThan(50)
    await expect(second.locator('.popover-body')).toHaveJSProperty('scrollTop', 0)
    expect(await page.evaluate(() => window.scrollY)).toBe(backgroundScroll)
    expect(await page.locator('#app .toc .active').getAttribute('href')).toBe(backgroundActive)
    await first.screenshot({ path: 'test-results/preview-navigation-light.png' })
    await first.locator('.popover-title').hover()
    await expect(toc).toBeHidden()

    // 从卡片内回到开头，再用“其他链接”定位同一份预览中的引用。
    await tocButton.focus()
    await expect(toc).toBeVisible()
    await toc.getByRole('link', { name: FIRST_TITLE, exact: true }).click()
    await expect.poll(() => first.locator('.popover-body').evaluate(el => el.scrollTop)).toBeLessThan(300)
    const relatedButton = first.getByRole('button', { name: '相关链接', exact: true })
    await relatedButton.hover()
    const related = first.getByRole('region', { name: '相关链接', exact: true })
    await expect(related).toBeVisible()
    await first.screenshot({ path: 'test-results/preview-related-light.png' })
    await related.getByRole('link', { name: /从卡片继续阅读/ }).click()
    await expect(first.locator('.preview-markdown').getByRole('link', { name: '从卡片继续阅读' })).toBeInViewport({ ratio: 1 })
    expect(await page.evaluate(() => window.scrollY)).toBe(backgroundScroll)
    await expect(second.locator('.popover-body')).toHaveJSProperty('scrollTop', 0)
    expect(pathnameOf(page)).toBe(DOC)
    await first.locator('.popover-title').hover()
    await relatedButton.focus()
    await expect(related).toBeVisible()
    await first.getByRole('button', { name: '调整预览大小' }).focus()
    await expect(related).toBeHidden()

    const history = first.getByRole('contentinfo', { name: '提交历史' })
    await history.getByRole('link', { name: '预览历史回归记录' }).scrollIntoViewIfNeeded()
    await expect(history).toBeInViewport()
    await expect(history.getByRole('link', { name: '预览历史回归记录' })).toHaveAttribute('href', /\/commit\/654abc$/)
    expect(await history.getByRole('link', { name: '全部历史(12条)' }).getAttribute('href'))
      .toBe('https://github.com/0xcaffebabe/note/tree/master/doc' + firstPath.replace(/\.html$/, '.md'))
    await first.screenshot({ path: 'test-results/preview-history-light.png' })
    await relatedButton.click()
    await related.getByRole('link', { name: /继续阅读关联主题/ }).click()
    await waitForPath(page, relatedPath)
  })

  test('暗色窄卡片的导航保持在边界内', async ({ page }) => {
    await prepareDocuments(page, { navigation: true })
    const first = await openFromBody(page, '甲')
    await first.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await moveCard(page, first, 24, 100)
    await resizeCard(page, first, 280, 160)
    await expectCenteredNavigation(first)
    await resizeCard(page, first, 280, 300)
    const tools = await openNavigationTools(page)
    await tools.locator('.theme-row .el-switch').click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.setViewportSize({ width: 390, height: 700 })
    await expectCenteredNavigation(first)
    await first.getByRole('button', { name: '本页章节', exact: true }).focus()
    const toc = first.getByRole('region', { name: '本页章节', exact: true })
    await expect(toc).toBeVisible()
    const cardBox = (await first.boundingBox())!
    const panelBox = (await toc.boundingBox())!
    expect(panelBox.x).toBeGreaterThanOrEqual(cardBox.x)
    expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width)
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height)
    await first.screenshot({ path: 'test-results/preview-navigation-dark-narrow.png' })
    await first.locator('.popover-title').hover()
    await first.screenshot({ path: 'test-results/preview-docked-tabs-dark-narrow.png' })
  })

  test('没有章节、链接和提交记录时显示历史空态', async ({ page }) => {
    await prepareDocuments(page, { emptySecond: true })
    await page.locator('#app .main-content .markdown-section')
      .getByRole('link', { name: '正文预览乙', exact: true }).click({ modifiers: ['Alt'] })
    const second = card(page, SECOND_TITLE)
    await expect(second.locator('.preview-markdown')).toContainText('没有章节和链接的短文。')
    await expect(second.locator('.preview-nav')).toHaveCount(0)
    await expect(second.getByRole('contentinfo', { name: '提交历史' })).toContainText('暂无提交历史')
  })

  test('目录预览与正文 Alt 点击共用卡片，多张固定后可独立置前和关闭', async ({ page }) => {
    await prepareDocuments(page)
    await page.locator('.doc-aside .el-menu-item.is-active').click({ button: 'right' })
    await expect(card(page, MAIN_TITLE)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: '文档预览', exact: true })).toHaveCount(0)

    const first = await openFromBody(page, '甲')
    await first.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await resizeCard(page, first, 460, 350)
    await moveCard(page, first, 24, 400)
    const second = await openFromBody(page, '乙')
    await second.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await resizeCard(page, second, 460, 350)
    await moveCard(page, second, 800, 400)

    await page.locator('#app .main-content .markdown-section').getByRole('heading', { name: MAIN_TITLE }).click()
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()
    await page.screenshot({ path: 'test-results/link-preview-multiple-light.png' })
    const tools = await openNavigationTools(page)
    await tools.getByRole('switch').press('Space')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.keyboard.press('Escape')
    await expect(tools).toBeHidden()
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()
    await page.screenshot({ path: 'test-results/link-preview-multiple-dark.png' })
    // 重开同一文档保留固定状态和已有卡片；Esc 只关闭刚被置前的一张。
    await openFromBody(page, '甲')
    await expect(page.getByRole('dialog', { name: '文档预览', exact: true })).toHaveCount(2)
    await expect(first.getByTitle('取消固定', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(first).toHaveCount(0)
    await expect(second).toBeVisible()
    await second.getByRole('button', { name: '关闭预览', exact: true }).click()
    await expect(second).toHaveCount(0)
  })

  test('两篇文档分别记住拖动、缩放和滚动位置，刷新后重新打开仍恢复', async ({ page }) => {
    await prepareDocuments(page)
    const first = await openFromBody(page, '甲')
    await resizeCard(page, first, 510, 380)
    await moveCard(page, first, 40, 80)
    const firstScroll = await readFurther(page, first, 240)
    const firstBox = (await first.boundingBox())!
    await first.getByRole('button', { name: '关闭预览', exact: true }).click()

    const second = await openFromBody(page, '乙')
    await resizeCard(page, second, 430, 330)
    await moveCard(page, second, 800, 300)
    const secondScroll = await readFurther(page, second, 560)
    const secondBox = (await second.boundingBox())!
    await second.getByRole('button', { name: '关闭预览', exact: true }).click()

    await goto(page, DOC)
    await expect(page.locator('#app .main-content .markdown-section').getByRole('heading', { name: MAIN_TITLE })).toBeVisible()
    await expect(page.getByRole('dialog', { name: '文档预览', exact: true })).toHaveCount(0)
    await expectSavedState(await openFromBody(page, '甲'), firstBox, firstScroll)
    await first.getByRole('button', { name: '关闭预览', exact: true }).click()
    await expectSavedState(await openFromBody(page, '乙'), secondBox, secondScroll)
  })

  test('隐藏单张或全部预览，导航角标恢复后保留固定状态、布局和阅读进度', async ({ page }) => {
    await prepareDocuments(page)
    const first = await openFromBody(page, '甲')
    await first.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await resizeCard(page, first, 460, 330)
    await moveCard(page, first, 24, 400)
    const firstScroll = await readFurther(page, first, 240)
    const firstBox = (await first.boundingBox())!
    const second = await openFromBody(page, '乙')
    await resizeCard(page, second, 430, 330)
    await moveCard(page, second, 800, 400)
    const secondScroll = await readFurther(page, second, 400)
    const secondBox = (await second.boundingBox())!
    const navigation = page.getByRole('navigation', { name: '站内导航', exact: true })
    const restore = navigation.getByRole('button', { name: '恢复全部 2 个隐藏预览', exact: true })
    const restoreOne = navigation.getByRole('button', { name: '恢复全部 1 个隐藏预览', exact: true })

    const hideTools = await openNavigationTools(page)
    await hideTools.getByRole('button', { name: '隐藏所有预览', exact: true }).click()
    await expect(hideTools).toBeHidden()
    await expect(first).toBeHidden()
    await expect(second).toBeHidden()
    await expect(restore).toBeFocused()
    // 隐藏期间点击、滚动正文和 Esc 不得关闭任何卡片。
    await page.keyboard.press('Escape')
    await page.locator('#app .main-content .markdown-section').getByRole('heading', { name: MAIN_TITLE }).click()
    await page.mouse.move(700, 150)
    await page.mouse.wheel(0, 300)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    await expect(restore).toBeVisible()
    await page.screenshot({ path: 'test-results/link-preview-hidden-light.png' })
    await restore.click()
    await expect(restore).toHaveCount(0)
    await expectSavedState(first, firstBox, firstScroll)
    await expectSavedState(second, secondBox, secondScroll)
    await expect(first.getByTitle('取消固定', { exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(second.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true })).toHaveAttribute('aria-pressed', 'false')
    await expect(second).toBeFocused()

    await second.getByRole('button', { name: '隐藏预览', exact: true }).click()
    await expect(first).toBeVisible()
    await expect(second).toBeHidden()
    await expect(restoreOne).toBeVisible()
    await page.screenshot({ path: 'test-results/link-preview-partially-hidden.png' })
    // 可以继续逐个收起卡片，隐藏数量随之累加。
    await first.getByRole('button', { name: '隐藏预览', exact: true }).click()
    await expect(restore).toBeVisible()
    // 再次请求隐藏文档只恢复该卡片；其余隐藏预览仍保留。
    await openFromBody(page, '甲')
    await expect(restoreOne).toBeVisible()
    await expect(second).toBeHidden()
    await first.getByRole('button', { name: '关闭预览', exact: true }).click()
    await expect(restoreOne).toBeVisible()
    await restoreOne.focus()
    await page.keyboard.press('Enter')
    await expectSavedState(second, secondBox, secondScroll)
    await expect(restoreOne).toHaveCount(0)

    // 隐藏的临时卡片在打开另一篇预览时仍保留；小屏及暗色下入口可操作。
    await second.getByRole('button', { name: '隐藏预览', exact: true }).click()
    await openFromBody(page, '甲')
    await expect(restoreOne).toBeVisible()
    await first.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    const tools = await openNavigationTools(page)
    await tools.getByRole('switch').press('Space')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await tools.getByRole('button', { name: '隐藏所有预览', exact: true }).click()
    await expect(tools).toBeHidden()
    await expect(restore).toBeFocused()
    await page.screenshot({ path: 'test-results/link-preview-hidden-dark.png' })
    // 计数角标属于同一个导航，拖动后仍可恢复卡片。
    const launcher = navigation.locator('.navigation-launcher')
    const launcherBox = (await launcher.boundingBox())!
    await page.mouse.move(launcherBox.x + launcherBox.width / 2, launcherBox.y + launcherBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(220, 220, { steps: 6 })
    await page.mouse.up()
    await expect.poll(async () => (await launcher.boundingBox())!.x).toBeLessThan(300)
    await page.setViewportSize({ width: 393, height: 851 })
    await expect(restore).toBeInViewport()
    await page.screenshot({ path: 'test-results/link-preview-hidden-mobile.png' })
    await restore.focus()
    await page.keyboard.press('Space')
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()
    await expect(restore).toHaveCount(0)
    // 恢复后的 Esc 仍仅关闭最上层，关闭后不留下恢复入口。
    await page.keyboard.press('Escape')
    await expect(first).toHaveCount(0)
    await expect(second).toBeVisible()
    await second.getByRole('button', { name: '关闭预览', exact: true }).click()
    await expect(page.getByRole('button', { name: /恢复全部 .* 个隐藏预览/ })).toHaveCount(0)
  })

  test('刷新自动恢复固定卡片及层叠顺序，关闭和取消固定后不再恢复', async ({ page }) => {
    test.setTimeout(90_000)
    await prepareDocuments(page)
    const first = await openFromBody(page, '甲')
    await first.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await resizeCard(page, first, 510, 330)
    await moveCard(page, first, 40, 450)
    const firstScroll = await readFurther(page, first, 240)
    const firstBox = (await first.boundingBox())!

    const second = await openFromBody(page, '乙')
    await second.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await resizeCard(page, second, 430, 300)
    await moveCard(page, second, 800, 450)
    const secondScroll = await readFurther(page, second, 560)
    const secondBox = (await second.boundingBox())!
    // 激活第一张卡片，刷新后应保留它在最上层的顺序和各自的阅读进度。
    await first.locator('.popover-title').click()

    await goto(page, DOC)
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()
    await expect(first.getByTitle('取消固定', { exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(second.getByTitle('取消固定', { exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expectSavedState(first, firstBox, firstScroll)
    await expectSavedState(second, secondBox, secondScroll)
    await page.keyboard.press('Escape')
    await expect(first).toHaveCount(0)
    await expect(second).toBeVisible()

    // 关闭卡片和取消固定都要同步更新刷新恢复的列表。
    await goto(page, DOC)
    await expect(second).toBeVisible()
    await expect(first).toHaveCount(0)
    await expectSavedState(second, secondBox, secondScroll)
    await second.getByTitle('取消固定', { exact: true }).click()
    await expect(second.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true })).toHaveAttribute('aria-pressed', 'false')
    await goto(page, DOC)
    await expect(page.locator('#app .main-content .markdown-section').getByRole('heading', { name: MAIN_TITLE })).toBeVisible()
    await expect(first).toHaveCount(0)
    await expect(second).toHaveCount(0)
  })

  test('刷新保留部分和全部隐藏，临时卡片隐藏后也能继续恢复阅读', async ({ page }) => {
    test.setTimeout(90_000)
    await prepareDocuments(page)
    const first = await openFromBody(page, '甲')
    await first.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await resizeCard(page, first, 460, 330)
    await moveCard(page, first, 24, 400)
    const firstScroll = await readFurther(page, first, 240)
    const firstBox = (await first.boundingBox())!
    const second = await openFromBody(page, '乙')
    await resizeCard(page, second, 430, 330)
    await moveCard(page, second, 800, 400)
    const secondScroll = await readFurther(page, second, 400)
    const secondBox = (await second.boundingBox())!
    const restoreOne = page.getByRole('button', { name: '恢复全部 1 个隐藏预览', exact: true })
    const restoreAll = page.getByRole('button', { name: '恢复全部 2 个隐藏预览', exact: true })

    await second.getByRole('button', { name: '隐藏预览', exact: true }).click()
    await goto(page, DOC)
    await expect(restoreOne).toBeVisible()
    await expect(second).toBeHidden()
    await expectSavedState(first, firstBox, firstScroll)
    await first.getByRole('button', { name: '隐藏预览', exact: true }).click()
    await goto(page, DOC)
    await expect(restoreAll).toBeVisible()
    await expect(first).toBeHidden()
    await expect(second).toBeHidden()
    await restoreAll.click()
    await expectSavedState(first, firstBox, firstScroll)
    await expectSavedState(second, secondBox, secondScroll)
    await expect(first.getByTitle('取消固定', { exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(second.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true })).toHaveAttribute('aria-pressed', 'false')

    // 恢复后刷新，未固定卡片不再自动打开；固定卡片继续显示。
    await goto(page, DOC)
    await expect(first).toBeVisible()
    await expect(second).toHaveCount(0)
    await expect(restoreOne).toHaveCount(0)
    await expect(restoreAll).toHaveCount(0)
    await first.getByRole('button', { name: '关闭预览', exact: true }).click()
    await goto(page, DOC)
    await expect(first).toHaveCount(0)
    await expect(restoreOne).toHaveCount(0)
  })

  test('首页和标签页隐藏固定卡片，返回文档后恢复布局和阅读进度', async ({ page }) => {
    test.setTimeout(120_000)
    await prepareDocuments(page)
    const preview = await openFromBody(page, '甲')
    await preview.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await resizeCard(page, preview, 430, 320)
    await moveCard(page, preview, 40, 450)
    const scrollTop = await readFurther(page, preview, 240)
    const box = (await preview.boundingBox())!

    const followNavigation = async (name: '首页' | '标签' | '返回最近文档') => {
      const launcher = page.locator('.navigation-launcher')
      await expect(launcher).toHaveCount(1)
      if (await launcher.getAttribute('aria-expanded') === 'false') {
        await launcher.focus()
        await page.keyboard.press('Enter')
      }
      await page.getByRole('navigation', { name: '站内导航', exact: true })
        .getByRole('link', { name, exact: true }).click()
    }
    const returnToDocument = async () => {
      await followNavigation('返回最近文档')
      await waitForPath(page, DOC)
      await expect(preview.getByTitle('取消固定', { exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expectSavedState(preview, box, scrollTop)
    }

    for (const { name, path } of [
      { name: '首页', path: '/home.html' },
      { name: '标签', path: '/tag.html' },
    ] as const) {
      // 使用站内导航切换，验证同一个 App 内的预览层卸载与恢复。
      await followNavigation(name)
      await waitForPath(page, path)
      await expect(page.getByRole('dialog', { name: '文档预览', exact: true })).toHaveCount(0)
      await returnToDocument()

      // 非文档页刷新也不恢复浮窗，重新进入文档页时再恢复。
      await goto(page, path)
      await expect(page.locator('.navigation-launcher')).toBeVisible()
      await expect(page.getByRole('dialog', { name: '文档预览', exact: true })).toHaveCount(0)
      await returnToDocument()
    }

    // 直接进入文档页也能恢复固定卡片。
    await goto(page, DOC)
    await expectSavedState(preview, box, scrollTop)
  })

  test('相关链接两组均支持 Alt 点击预览，并保留当前正文', async ({ page }) => {
    await prepareDocuments(page)
    const tab = page.locator('#app .related-floating').getByRole('button', { name: '相关链接', exact: true })
    const panel = page.getByRole('region', { name: '相关链接', exact: true })
    await tab.hover()
    await panel.getByRole('link', { name: /关联预览入口/ }).click({ modifiers: ['Alt'] })
    await expect(card(page, FIRST_TITLE)).toBeVisible()
    expect(pathnameOf(page)).toBe(DOC)
    await card(page, FIRST_TITLE).getByRole('button', { name: '关闭预览', exact: true }).click()

    await tab.hover()
    await panel.getByRole('link', { name: /正文预览乙/ }).click({ modifiers: ['Alt'] })
    await expect(card(page, SECOND_TITLE)).toBeVisible()
    expect(pathnameOf(page)).toBe(DOC)
    await expect(page.locator('#app .main-content .markdown-section').getByRole('heading', { name: MAIN_TITLE })).toBeInViewport()
  })

  test('固定卡片在正常跳转及桌面和手机布局切换后继续显示', async ({ page }) => {
    const { secondPath } = await prepareDocuments(page)
    const first = await openFromBody(page, '甲')
    await first.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await resizeCard(page, first, 400, 350)
    await moveCard(page, first, 24, 400)
    const second = await openFromBody(page, '乙')
    await second.getByTitle('固定(点击外部/滚动不再关闭)', { exact: true }).click()
    await resizeCard(page, second, 400, 350)
    await moveCard(page, second, 1000, 400)

    await first.locator('.preview-markdown').getByRole('link', { name: '从卡片继续阅读', exact: true }).click()
    await waitForPath(page, secondPath)
    await expect(page.locator('#app .main-content .markdown-section').getByRole('heading', { name: SECOND_TITLE })).toBeVisible()
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()
    await page.setViewportSize({ width: 800, height: 900 })
    await expect(page.locator('.mobile-bottom-bar')).toBeVisible()
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page.locator('.mobile-bottom-bar')).toHaveCount(0)
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()
    expect(pathnameOf(page)).toBe(secondPath)
  })

  test('临时预览被下一张替换，点击外部或滚动正文时关闭', async ({ page }) => {
    await prepareDocuments(page)
    const first = await openFromBody(page, '甲')
    await resizeCard(page, first, 400, 350)
    await moveCard(page, first, 24, 400)
    const second = await openFromBody(page, '乙')
    await expect(first).toHaveCount(0)
    await expect(second).toBeVisible()
    await page.locator('#app .main-content .markdown-section').getByRole('heading', { name: MAIN_TITLE }).click()
    await expect(second).toHaveCount(0)

    await openFromBody(page, '甲')
    await page.mouse.move(700, 150)
    await page.mouse.wheel(0, 500)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    await expect(first).toHaveCount(0)
  })

  test('文档预览加载失败后可在卡片内重试，当前正文保持可用', async ({ page }) => {
    const { allowFirstPreview } = await prepareDocuments(page, { failFirstPreview: true })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.locator('#app .main-content .markdown-section').getByRole('link', { name: '正文预览甲', exact: true }).click({ modifiers: ['Alt'] })
    const preview = page.getByRole('dialog', { name: '文档预览', exact: true })
    await expect(preview.getByRole('status')).toContainText('文档预览加载失败')
    allowFirstPreview()
    await preview.getByRole('button', { name: '重试', exact: true }).click()
    await expect(card(page, FIRST_TITLE).locator('.preview-markdown').getByRole('heading', { name: FIRST_TITLE })).toBeVisible()
    expect(pathnameOf(page)).toBe(DOC)
    await expect(page.locator('#app .main-content .markdown-section').getByRole('heading', { name: MAIN_TITLE })).toBeVisible()
    expect(errors).toEqual([])
  })
})

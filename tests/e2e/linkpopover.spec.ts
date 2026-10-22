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

async function prepareDocuments(page: Page, options: { failFirstPreview?: boolean } = {}) {
  // 使用真实文档地址，固定网络边界的正文，避免依赖知识内容中恰好有两条内链或足够长的正文。
  const catalog = await page.request.get('/category.json')
  expect(catalog.ok()).toBe(true)
  const paths = [...new Set(documentPaths(await catalog.json()))]
    .filter(path => path !== DOC && !['/README.html', '/SUMMARY.html'].includes(path))
  const [firstPath, secondPath] = paths
  if (!firstPath || !secondPath) throw new Error('多卡片阅读夹具需要两篇不同的现有文档')
  const firstMarkdown = firstPath.replace(/\.html$/, '.md')
  const secondMarkdown = secondPath.replace(/\.html$/, '.md')
  const firstJsonPath = firstPath.replace(/\.html$/, '.md.json')
  let failFirstPreview = !!options.failFirstPreview
  const longContent = (title: string) => [
    '# ' + title,
    '## 继续阅读',
    ...(title === FIRST_TITLE ? [`[从卡片继续阅读](${secondMarkdown})`] : []),
    ...Array.from({ length: 45 }, (_, i) =>
      `第 ${i + 1} 段：每张卡片可以保留自己的阅读位置，以便比较不同文档并继续阅读。`),
  ].join('\n\n')
  const documents = new Map([
    [DOC.replace(/\.html$/, '.md.json'), {
      title: MAIN_TITLE,
      content: [
        '# ' + MAIN_TITLE,
        '## 预览入口',
        `[正文预览甲](${firstMarkdown})`,
        `[正文预览乙](${secondMarkdown})`,
        ...Array.from({ length: 28 }, (_, i) => `第 ${i + 1} 段正文，用于比较预览卡片并继续阅读当前文档。`),
        '## 关联内容',
        `- [${firstMarkdown}](${firstMarkdown}) 关联预览入口`,
      ].join('\n\n'),
    }],
    [firstJsonPath, { title: FIRST_TITLE, content: longContent(FIRST_TITLE) }],
    [secondPath.replace(/\.html$/, '.md.json'), { title: SECOND_TITLE, content: longContent(SECOND_TITLE) }],
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
    delete file.relatedLinks
    await route.fulfill({ response, json: file })
  })
  await goto(page, DOC)
  await expect(page.locator('#app .main-content .markdown-section').getByRole('heading', { name: MAIN_TITLE })).toBeVisible()
  return { firstPath, secondPath, allowFirstPreview: () => { failFirstPreview = false } }
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

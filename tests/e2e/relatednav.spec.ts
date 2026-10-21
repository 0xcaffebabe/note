import { test, expect, goto, pathnameOf, waitForPath, waitForHtmlChange, DOC } from './fixtures'
import type { Page } from '@playwright/test'
import DocUtils from '../../src/core/util/DocUtils'

type Category = { link?: string; chidren?: Category[] }
const FIXTURE_TITLE = '关联阅读回归夹具'
const REFERENCE_TEXT = '正文引用定位目标'

function documentPaths(categories: Category[]): string[] {
  return categories.flatMap(category => [
    ...(category.link?.endsWith('.md')
      ? [DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(category.link))] : []),
    ...documentPaths(category.chidren || []),
  ])
}

async function prepareRelatedDocument(page: Page): Promise<string> {
  // 目录只用于发现有效落地页；被测关联内容与正文引用由测试固定提供，不扫描或试访文章。
  const catalog = await page.request.get('/category.json')
  expect(catalog.ok()).toBe(true)
  const paths = [...new Set(documentPaths(await catalog.json()))]
    .filter(path => path !== DOC && !['/README.html', '/SUMMARY.html'].includes(path))
  const [relatedPath, referencePath] = paths
  if (!relatedPath || !referencePath) throw new Error('关联阅读夹具需要两篇不同的现有文档')
  const relatedMarkdown = relatedPath.replace(/\.html$/, '.md')
  const referenceMarkdown = referencePath.replace(/\.html$/, '.md')
  const content = [
    '# ' + FIXTURE_TITLE,
    '## 长文阅读',
    ...Array.from({ length: 24 }, (_, index) =>
      '第 ' + (index + 1) + ' 段：阅读正文后，可以通过相关链接查找引用位置，或继续阅读另一篇关联主题。'),
    '## 文中引用',
    '继续阅读时可查阅[' + REFERENCE_TEXT + '](' + referenceMarkdown + ')，这条引用保留在正文里。',
    '## 关联内容',
    '- [' + relatedMarkdown + '](' + relatedMarkdown + ') 继续阅读关联主题',
  ].join('\n\n')
  const jsonPath = DOC.replace(/\.html$/, '.md.json')
  await page.route(url => decodeURI(url.pathname) === jsonPath, async route => {
    const response = await route.fetch()
    const file = await response.json()
    file.content = content
    delete file.relatedLinks
    await route.fulfill({ response, json: file })
  })
  return relatedPath
}

test.describe('相关链接阅读', () => {
  // 确保正文数据经过受控边界，避免 SW 返回旧文档。
  test.use({ serviceWorkers: 'block' })

  test('悬停打开相关链接后，可继续阅读关联文档', async ({ page }) => {
    const relatedPath = await prepareRelatedDocument(page)
    await goto(page, DOC)
    const body = page.locator('#app .main-content .markdown-section')
    await expect(body.getByRole('heading', { name: FIXTURE_TITLE })).toBeVisible()
    await page.locator('#app .related-floating').getByRole('button', { name: '相关链接', exact: true }).hover()
    const panel = page.getByRole('region', { name: '相关链接', exact: true })
    await panel.getByRole('link', { name: /继续阅读关联主题/ }).click()
    await waitForPath(page, relatedPath)
    await expect(body).toBeVisible()
    await expect(body).not.toContainText(FIXTURE_TITLE)
  })

  test('点击正文引用时定位到该链接，继续留在当前文档', async ({ page }) => {
    await prepareRelatedDocument(page)
    await goto(page, DOC)
    const body = page.locator('#app .main-content .markdown-section')
    await expect(body.getByRole('heading', { name: FIXTURE_TITLE })).toBeVisible()
    const reference = body.getByRole('link', { name: REFERENCE_TEXT, exact: true })
    await expect(reference).not.toBeInViewport()
    await page.locator('#app .related-floating').getByRole('button', { name: '相关链接', exact: true }).hover()
    const panel = page.getByRole('region', { name: '相关链接', exact: true })
    await panel.getByRole('link', { name: new RegExp(REFERENCE_TEXT) }).click()
    await expect(reference).toBeInViewport({ ratio: 1 })
    expect(pathnameOf(page)).toBe(DOC)
    await expect(panel).toBeVisible()
  })
})

test.describe('prev/next pager (P1)', () => {
  test('上一篇/下一篇卡片点击换 URL 并渲染新正文', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('#app .main-content .markdown-section h2')

    // DocPrevNext: created() 里 await getOrderedDocList(), 卡片渲染是异步的 —— 等容器出现。
    const nav = page.locator('.doc-prev-next')
    // 当前文档若在有序列表里既是首篇又是末篇(列表仅 1 篇)则无 nav; 极少见但仍兜底 skip。
    const navAppeared = await nav
      .waitFor({ state: 'attached', timeout: 20_000 })
      .then(() => true)
      .catch(() => false)
    test.skip(!navAppeared, 'DocPrevNext 未渲染(有序文档列表中无前后篇)')

    // 取一张「带真实 .html href」的卡片(prev 或 next)。router-link 渲染成 <a href=".../*.html">。
    const cards = nav.locator('.pn-card[href$=".html"]')
    const count = await cards.count()
    test.skip(count === 0, '当前文档无前/后篇卡片(列表边界)')

    const card = cards.first()
    await expect(card).toBeVisible()
    const href = await card.getAttribute('href')
    expect(href).toBeTruthy()
    expect(href!).toMatch(/\.html$/)
    // 卡片标题非空(prev.name / next.name)
    const title = ((await card.locator('.pn-title').textContent()) ?? '').trim()
    expect(title.length).toBeGreaterThan(0)

    const before = pathnameOf(page)
    await Promise.all([waitForHtmlChange(page, before), card.click()])

    const after = pathnameOf(page)
    expect(after).not.toBe(before)
    expect(after).toMatch(/\.html$/)
    // 新正文上屏(旧静态正文已被替换, 轮询直到新文档的 h2 就绪)
    await page.waitForSelector('#app .main-content .markdown-section h2', { timeout: 20_000 })
    const h2 = ((await page.locator('#app .main-content .markdown-section h2').first().textContent()) ?? '').trim()
    expect(h2.length).toBeGreaterThan(0)
  })
})

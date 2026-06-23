import { test, expect, goto, pathnameOf, waitForHtmlChange, docWithRelated, DOC } from './fixtures'
import fs from 'fs'
import path from 'path'
import DocUtils from '../../src/core/util/DocUtils'

// 「其他链接」组(docLinks)只在「剥离关联内容后正文里仍有独立站内 .html 内链」时才出现, 较稀少。
// docWithRelated() 只挑首篇含「## 关联内容」段的文档, 它未必留有 docLinks。
// 故这里另起一个 fs 候选集: 构建产物 .html 里含站内内链的文档(它们更可能在面板里产出「其他链接」组),
// 测试时按序导航、找首篇真出现该组的文档来跑 locate() 流; 一篇都没有才 skip。不硬编码任何具体文档。
const DIST_DIR = process.env.E2E_DIST ?? path.resolve(process.cwd(), 'dist')
function htmlLinkCandidates(limit = 40): string[] {
  const cat = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'category.json'), 'utf8'))
  const flat: any[] = []
  const walk = (ns: any[]) => { for (const n of ns || []) { if (n?.link) flat.push(n); walk(n?.chidren) } }
  walk(cat)
  const out: string[] = []
  for (const n of flat) {
    let id: string
    try { id = DocUtils.docUrl2Id(n.link) } catch { continue }
    if (!id) continue
    const hp = DocUtils.docId2HtmlPath(id)
    const fp = path.join(DIST_DIR, hp.slice(1))
    if (!fs.existsSync(fp)) continue
    if (/<a\s[^>]*href="[^"]*\.html"/i.test(fs.readFileSync(fp, 'utf8'))) out.push(hp)
    if (out.length >= limit) break
  }
  return out
}

// 两条流:
// (1) 右缘悬浮「相关链接」面板 (src/pages/doc/RelatedContent.vue)
//     - 桌面 1440x900 非超宽档(isUltra=false), DocPage 渲染 <related-content>(非 inline) 即 .related-floating + .rf-tab。
//     - .rf-tab 按钮(@click="toggle") 上点击展开面板(v-show=open); 用真实点击切换, 不靠 hover(reveal/scheduleHide)。
//     - 「关联内容」组(file.relatedLinks): 点击 .rf-item 走 go() -> $router.push(href) 跳到 .html 文档。
//     - 「其他链接」组(DocService.resolveDocLinks 正文内链): 点击 .rf-item 走 locate() -> window.scrollTo 到正文中该链接处
//       (只断言 window.scrollY 变化, 不验确切高亮)。
//     总数徽标 .rf-tab-count = related.length + docLinks.length。按内容特征发现含「## 关联内容」段的文档。
// (2) 上一篇/下一篇翻页 (src/pages/doc/nav/DocPrevNext.vue)
//     - <nav.doc-prev-next> 内 router-link.pn-card(.prev / .next), to=docId2HtmlPath(...) 真实 .html。
//     - 点击换 URL 且渲染新正文(轮询 .markdown-section h2); 无卡片(单篇/边界)时 skip。

test.describe('related content panel (P1)', () => {
  test('悬浮标签点击展开面板, 计数与「关联内容」组件就绪', async ({ page }) => {
    const d = docWithRelated()
    test.skip(!d, '构建产物中未发现含「## 关联内容」段的文档')
    await goto(page, d!)
    await page.waitForSelector('.markdown-section h2') // 等 SPA 把正文渲进来(关联抽取也在此后就绪)

    // 桌面非超宽档: 渲染右缘悬浮容器与标签(非 inline)
    const floating = page.locator('.related-floating')
    await expect(floating).toBeAttached({ timeout: 20_000 })
    const tab = floating.locator('.rf-tab')
    await expect(tab).toBeVisible({ timeout: 20_000 })

    // 总数徽标应 >0(发现的文档至少有关联内容条目)
    const total = parseInt(((await tab.locator('.rf-tab-count').textContent()) ?? '0').trim(), 10)
    expect(total).toBeGreaterThan(0)

    const panel = floating.locator('.rf-panel')
    // 展开前: 面板被 v-show 隐藏(open=false), aria-expanded=false
    await expect(tab).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toBeHidden()

    // 用 toggle 处理器展开(不靠 hover 的 reveal)。
    // 注意: 容器 @mouseenter=reveal()/@mouseleave=scheduleHide() 与 @click=toggle 同在;
    // Playwright 的 click() 会先把指针移到元素上(触发 mouseenter -> reveal() 置 open=true),
    // 紧接着 click 的 toggle() 又把 open 翻回 false —— 净效果反而收起。
    // 故直接 dispatchEvent('click') 调用 toggle 处理器本身, 隔离 hover 桥, 这才是「点击展开」的真实路径。
    await tab.dispatchEvent('click')
    await expect(tab).toHaveAttribute('aria-expanded', 'true')
    await expect(panel).toBeVisible()
    await expect(tab).toHaveClass(/active/)

    // 面板头部标题与计数与标签徽标一致
    await expect(panel.locator('.rf-head-title')).toHaveText('相关链接')
    await expect(panel.locator('.rf-head-count')).toHaveText(String(total))

    // 面板内条目总数 == 徽标总数(两组之和)
    await expect.poll(() => panel.locator('.rf-item').count()).toBe(total)

    // 至少出现一个分组标题(关联内容 / 其他链接)
    const groupCount = await panel.locator('.rf-group').count()
    expect(groupCount).toBeGreaterThan(0)

    // 再调一次 toggle 收起(open 翻回 false)
    await tab.dispatchEvent('click')
    await expect(tab).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toBeHidden()
  })

  test('点击「关联内容」条目 router.push 到 .html 文档', async ({ page }) => {
    const d = docWithRelated()
    test.skip(!d, '构建产物中未发现含「## 关联内容」段的文档')
    await goto(page, d!)
    await page.waitForSelector('.markdown-section h2')

    const tab = page.locator('.related-floating .rf-tab')
    await expect(tab).toBeVisible({ timeout: 20_000 })
    // toggle 处理器展开(dispatchEvent 隔离 hover 桥, 见首条用例注释)
    await tab.dispatchEvent('click')
    const panel = page.locator('.related-floating .rf-panel')
    await expect(panel).toBeVisible()

    // 「关联内容」组紧跟在含「关联内容」文字的 .rf-group 之后, 一直到下一个 .rf-group(或面板末尾)。
    // 用该组首条 .rf-item 即可: 它的 @click.prevent + go() 走 $router.push。
    // 发现器以「## 关联内容」段命中, 故 relatedLinks 必非空 -> 关联组存在。
    const relatedGroup = panel.locator('.rf-group', { hasText: '关联内容' })
    await expect(relatedGroup).toBeAttached({ timeout: 20_000 })

    // 取「关联内容」组下首个条目(DOM 顺序: 关联组在其他链接组之前, related 渲染在前)
    const firstRelated = panel.locator('.rf-item').first()
    await expect(firstRelated).toBeVisible()
    // 该条目的 href 应为站内 .html(go() 用同一 href 做 router.push)
    const href = await firstRelated.getAttribute('href')
    expect(href).toBeTruthy()
    expect(href!).toMatch(/\.html(\?|#|$)/)

    const before = pathnameOf(page)
    // go() 调 $router.push -> SPA 换路由; click.prevent 已阻止 <a> 默认导航
    await Promise.all([waitForHtmlChange(page, before), firstRelated.click()])

    // URL 落到「另一篇」.html, 且新正文渲染出来
    const after = pathnameOf(page)
    expect(after).not.toBe(before)
    expect(after).toMatch(/\.html$/)
    await page.waitForSelector('.markdown-section h2', { timeout: 20_000 })
    const h2 = ((await page.locator('.markdown-section h2').first().textContent()) ?? '').trim()
    expect(h2.length).toBeGreaterThan(0)
  })

  test('点击「其他链接」条目触发 locate() 正文内滚动(scrollY 变化)', async ({ page }) => {
    // 该用例可能逐篇导航多达 N 篇候选来找「其他链接」组, 给足时间(默认 30s 不够)。
    test.setTimeout(120_000)
    // 「其他链接」组稀少且不一定落在 docWithRelated() 那篇上: 在含站内内链的候选里逐篇找首篇真出现该组的文档。
    const candidates = htmlLinkCandidates()
    test.skip(candidates.length === 0, '构建产物中未发现正文含站内 .html 内链的文档')

    const panel = page.locator('.related-floating .rf-panel')
    const otherGroup = panel.locator('.rf-group', { hasText: '其他链接' })
    let found = false
    for (const hp of candidates) {
      await goto(page, hp)
      await page.waitForSelector('.markdown-section h2', { timeout: 20_000 }).catch(() => {})
      const tab = page.locator('.related-floating .rf-tab')
      if ((await tab.count()) === 0) continue
      await tab.dispatchEvent('click') // toggle 展开(隔离 hover 桥, 见首条用例注释)
      await expect(panel).toBeVisible()
      if ((await otherGroup.count()) > 0) {
        found = true
        break
      }
    }
    // 全候选都没有「其他链接」组(所有内链都被关联内容吸收/排除): 这条流无可点击对象, skip
    test.skip(!found, '候选文档剥离关联内容后均无独立站内内链(其他链接组为空)')

    // 其他链接条目带上下文片段 .rf-context(关联条目则是 .rf-desc), 据此精确选中其他链接组的条目。
    // locate() 在 .markdown-section 里按 docId 找正文 <a>: 其他链接组条目正是从正文内链抽取的, 故必能命中并滚动。
    const item = panel.locator('.rf-item').filter({ has: page.locator('.rf-context') }).first()
    await expect(item).toBeVisible()
    const href = await item.getAttribute('href')
    expect(href).toBeTruthy()
    expect(href!).toMatch(/\.html(\?|#|$)/)

    // 先把视口滚到顶, 确保后续 locate 的滚动是从已知起点发生、变化可观测。
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)

    const beforePath = pathnameOf(page)
    await item.click() // @click.prevent + locate(); 不应触发路由跳转

    // locate() 用 window.scrollTo({behavior:'smooth'}); NO_ANIM 把 scroll-behavior 改为 auto, 滚动立即生效。
    // 只断言 scrollY 发生了变化(滚到了正文中该链接处), 不验确切高亮颜色。
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 20_000 }).toBeGreaterThan(0)

    // 关键: locate 是页内滚动, URL 不应变(没有 router.push)
    expect(pathnameOf(page)).toBe(beforePath)
    // 面板仍开着(locate 里清掉了关闭计时器)
    await expect(panel).toBeVisible()
  })
})

test.describe('prev/next pager (P1)', () => {
  test('上一篇/下一篇卡片点击换 URL 并渲染新正文', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')

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
    await page.waitForSelector('.markdown-section h2', { timeout: 20_000 })
    const h2 = ((await page.locator('.markdown-section h2').first().textContent()) ?? '').trim()
    expect(h2.length).toBeGreaterThan(0)
  })
})

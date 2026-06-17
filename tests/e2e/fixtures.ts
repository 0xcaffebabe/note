import { test as base, expect, Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
// DocUtils 是无依赖的纯函数模块 在 Node(Playwright)侧直接相对引入即可 不依赖 @ 别名
import DocUtils from '../../src/util/DocUtils'

// 动态发现夹具文档: 不硬编码任何具体文档(内容更新后某篇可能被改名/删除)
// 从构建产物 dist/category.json(路由 recoverDocPath 用的同一份目录)里挑一篇「确实存在 .html」的真实文档
// 这样内容怎么重排 套件都自适应地挑到现存文档 不会因夹具消失而误报
const DIST_DIR = process.env.E2E_DIST ?? path.resolve(process.cwd(), 'dist')
// 排除非正文的特殊入口 优先挑真正的内容文档
const SPECIAL = new Set(['README', 'SUMMARY', 'overview', 'CLAUDE', 'AGENTS', 'readme_template', 'CONTRIBUTING'])

// 拍平 category.json -> 所有「.html 真实存在」的内容文档(docId + htmlPath) 内容怎么变都自适应
function listExistingDocs(): Array<{ htmlPath: string; docId: string }> {
  const catFile = path.join(DIST_DIR, 'category.json')
  if (!fs.existsSync(catFile)) {
    throw new Error(`找不到 ${catFile} —— E2E 需先 npm run build 产出 dist/(或设 E2E_DIST 指向构建产物目录)`)
  }
  const tree = JSON.parse(fs.readFileSync(catFile, 'utf8'))
  const flat: any[] = []
  const walk = (nodes: any[]) => {
    for (const n of nodes || []) {
      if (n?.link) flat.push(n)
      walk(n?.chidren) // 注: 源数据字段确实拼作 chidren
    }
  }
  walk(tree)
  const docs: Array<{ htmlPath: string; docId: string }> = []
  for (const n of flat) {
    let docId: string
    try {
      docId = DocUtils.docUrl2Id(n.link)
    } catch {
      continue
    }
    if (!docId || SPECIAL.has(docId)) continue
    const htmlPath = DocUtils.docId2HtmlPath(docId)
    if (htmlPath && fs.existsSync(path.join(DIST_DIR, htmlPath.slice(1)))) {
      docs.push({ htmlPath, docId })
    }
  }
  if (docs.length === 0) throw new Error('未能从 category.json 找到任一 .html 存在的真实文档')
  return docs
}

const existingDocs = listExistingDocs()

// 读取某篇文档构建产物的 .html(预渲染正文 含 static-content) 供各「按内容特征挑文档」的发现器复用
const readDocHtml = (d: { htmlPath: string }): string => fs.readFileSync(path.join(DIST_DIR, d.htmlPath.slice(1)), 'utf8')

// 发现层只保证「.html 存在」 但大量用例硬性要求正文里有 <h2>(waitForSelector('.markdown-section h2')、
// 标题带 slug、TOC 等)。若 DFS 首篇恰是无标题短文档/索引页 这些 P0 会以莫名其妙的选择器超时整批误挂——
// 这正是「自适应夹具」本应防住的。故主夹具文档再过滤一道:挑首篇「正文含 >=1 个 <h2>」的真实文档。
// 找不到就在「发现期」直接抛错(而非静默回退到 existingDocs[0] 让用例 20s 超时挂死), 报错即定位。
const HAS_H2 = /<h2[\s>]/
const fixtureDoc = (() => {
  const withH2 = existingDocs.find((d) => HAS_H2.test(readDocHtml(d)))
  if (!withH2) {
    throw new Error('未能从 category.json 找到任一含 <h2> 的文档 —— 夹具需要带正文标题的文档(请检查构建产物是否完整)')
  }
  return withH2
})()

// 找一篇含「Prism 会真正高亮的语言」代码块的文档(不假设主夹具文档有 也不挑只含 mermaid/text 的)
// 语言集对齐 vite.config 里 VitePluginPrismjs 实际加载的那批(含常见别名 sh/shell/py/ts)
const HL_LANG = /class="language-(javascript|js|ts|typescript|java|python|py|go|golang|rust|bash|sh|shell|sql|json|yaml|yml|c|css|kotlin|scala|ruby|groovy|nginx|http|ini|properties|docker|dockerfile)\b/
let _docWithCode: string | null | undefined
export function docWithCode(): string | null {
  if (_docWithCode !== undefined) return _docWithCode
  for (const d of existingDocs) {
    if (HL_LANG.test(readDocHtml(d))) {
      _docWithCode = d.htmlPath
      return _docWithCode
    }
  }
  _docWithCode = null
  return null
}

// 找一篇正文含「站内 .html 内链」的文档:跨文档链接常被抽进关联面板、从正文剥离 故不能假设主夹具文档有。
// 内链测试改用它并在 null 时 skip 不再死压在 DOC 上(DOC 可能是叶子文档 正文无内链)。
const HAS_INTERNAL_LINK = /<a\s[^>]*href="[^"]*\.html"/i
let _docWithInternalLink: string | null | undefined
export function docWithInternalLink(): string | null {
  if (_docWithInternalLink !== undefined) return _docWithInternalLink
  for (const d of existingDocs) {
    if (HAS_INTERNAL_LINK.test(readDocHtml(d))) {
      _docWithInternalLink = d.htmlPath
      return _docWithInternalLink
    }
  }
  _docWithInternalLink = null
  return null
}
// 运行时发现的真实文档: 所有路由/恢复/渲染用例都基于它 不再依赖某篇固定文档存在
export const DOC = fixtureDoc.htmlPath // 形如 /运维/Docker.html(具体随内容而定)
export const DOC_ID = fixtureDoc.docId // 形如 运维-Docker
export const DOC_NO_SUFFIX = DOC.replace(/\.html$/i, '') // CDN 308 去后缀场景

// 关掉一切动画/过渡/平滑滚动 让抽屉开合、轮播、滚动定位类断言稳定(以信号而非 sleep 同步)
export const NO_ANIM =
  '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;' +
  'transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important}'

// 中文路径统一: 用 encodeURI 导航 用 decodeURI 断言(page.url() 是百分号编码 直接比中文会静默失败)
export async function goto(page: Page, p: string) {
  await page.goto(encodeURI(p), { waitUntil: 'domcontentloaded' })
  await page.addStyleTag({ content: NO_ANIM }).catch(() => {})
}

export function pathnameOf(page: Page): string {
  return decodeURI(new URL(page.url()).pathname)
}

// 等到解码后的 pathname 等于目标(信号同步 替代 networkidle / 盲等)。
// 默认精确匹配:套件里所有调用方传的都是规范全路径(DOC / '/home.html' / '/cluster.html' 等), 精确更安全。
// 旧的 endsWith 语义有锋利边——/m/<doc>.html 在去前缀前就以 <doc>.html 结尾会提前命中(已坑过一次), 故改为显式 opt-in。
export async function waitForPath(page: Page, target: string, opts: { endsWith?: boolean } = {}) {
  await page.waitForFunction(
    ({ t, ew }) => (ew ? decodeURI(location.pathname).endsWith(t) : decodeURI(location.pathname) === t),
    { t: target, ew: !!opts.endsWith },
    { timeout: 20_000 }
  )
}

// 等到 pathname 变成「另一个」.html(用于点击导航后确认确实换了页 而非盲等固定毫秒)
export async function waitForHtmlChange(page: Page, before: string) {
  await page.waitForFunction(
    (b) => {
      const p = decodeURI(location.pathname)
      return p.endsWith('.html') && p !== b
    },
    before,
    { timeout: 20_000 }
  )
}

// 续读记录: addInitScript 在每次导航前注入 用于「根路径 / -> 上次阅读」用例
export async function seedLastRead(page: Page, docId: string) {
  await page.addInitScript((id) => localStorage.setItem('doc-service:last-read', id), docId)
}

// 在网络边界拦截 algolia(及自建 ES) PR 无密钥/无网络也能确定性地跑搜索 仍命中 SearchService 真实的高亮过滤逻辑
export async function stubAlgolia(page: Page, opts: { hits?: any[]; suggestions?: any[] } = {}) {
  const { hits = [], suggestions = [] } = opts
  await page.route(/(algolia\.net|algolianet\.com)\/1\/indexes\//, (route) => {
    const url = route.request().url()
    const body = url.includes('note_query_suggestions') ? { hits: suggestions } : { hits, processingTimeMS: 1 }
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
}

// 搜索用例的关键词: 必须与 docHitFixture 的高亮文本一致 —— SearchService 会按关键词过滤片段
// 若两者不一致 所有片段会被过滤掉、结果为空(用一个常量绑定二者 防止漂移)
export const SEARCH_KW = 'docker'

// 指向所发现文档的 algolia 高亮结构(_highlightResult.segments[].{id,txt}.value 内含 <mark> 且含 SEARCH_KW)
export function docHitFixture() {
  return [
    {
      url: DOC,
      createTime: '2020-01-01',
      _highlightResult: {
        url: { value: DOC },
        segments: [
          { id: { value: `安装 <mark>${SEARCH_KW}</mark>` }, txt: { value: `<mark>${SEARCH_KW}</mark> 片段示例` } },
        ],
      },
    },
  ]
}

// 收集页面运行期问题: 未捕获异常(pageerror) + console.error。
// 「加载无错误」类守卫用它而非只听 pageerror —— 后者只抓未捕获抛错, 漏掉被 catch 后 console.error 的失败/Vue 警告/拉取错误。
// ignore: 滤掉与被测无关的已知噪声(如 ResizeObserver 回环、favicon/可选资源 404)。返回的数组在导航/交互后读取即可。
export function collectPageProblems(page: Page, ignore: RegExp[] = []): string[] {
  const problems: string[] = []
  const keep = (s: string) => !ignore.some((re) => re.test(s))
  page.on('pageerror', (e) => {
    const s = String(e)
    if (keep(s)) problems.push('[pageerror] ' + s)
  })
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const s = msg.text()
    if (keep(s)) problems.push('[console.error] ' + s)
  })
  return problems
}

// 与被测无关的已知控制台噪声(不应让「加载无错误」守卫误红)。
// 注意: 不再笼统过滤「任何 404」—— 那会把真实关键资源(如某个 .json 接口)的 404 一并吞掉、让回归悄悄变绿。
// 只滤站点图标与 sourcemap 这类「可选」资源; 真正资源的 404 仍应让守卫失败。
export const BENIGN_CONSOLE = [
  /ResizeObserver loop/i, // 浏览器无害告警
  /favicon\.ico/i, // 站点图标(可选)
  /source ?map|\.map(\b|$)/i, // sourcemap 拉取失败(可选, 不影响功能)
  /Download the (Vue|React) Devtools/i,
]

export const test = base
export { expect }

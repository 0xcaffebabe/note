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
const fixtureDoc = existingDocs[0]

// 找一篇含「Prism 会真正高亮的语言」代码块的文档(不假设主夹具文档有 也不挑只含 mermaid/text 的)
// 语言集对齐 vite.config 里 VitePluginPrismjs 实际加载的那批(含常见别名 sh/shell/py/ts)
const HL_LANG = /class="language-(javascript|js|ts|typescript|java|python|py|go|golang|rust|bash|sh|shell|sql|json|yaml|yml|c|css|kotlin|scala|ruby|groovy|nginx|http|ini|properties|docker|dockerfile)\b/
let _docWithCode: string | null | undefined
export function docWithCode(): string | null {
  if (_docWithCode !== undefined) return _docWithCode
  for (const d of existingDocs) {
    const html = fs.readFileSync(path.join(DIST_DIR, d.htmlPath.slice(1)), 'utf8')
    if (HL_LANG.test(html)) {
      _docWithCode = d.htmlPath
      return _docWithCode
    }
  }
  _docWithCode = null
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

// 等到解码后的 pathname 以 suffix 结尾(信号同步 替代 networkidle / 盲等)
export async function waitForPath(page: Page, suffix: string) {
  await page.waitForFunction((s) => decodeURI(location.pathname).endsWith(s), suffix, { timeout: 20_000 })
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

export const test = base
export { expect }

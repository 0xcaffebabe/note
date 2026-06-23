import TagSumItem from '../domain/tag/TagSumItem'
import { KnowledgeLinkNode } from '../domain/KnowledgeNode'
import IdGenUtils from '../util/IdGenUtils'
import Slugger from '../util/Slugger'
import DocUtils from '../util/DocUtils'
import { escapeHtml, escapeAttr } from '../util/StringUtils'
import type { MarkdownPort, MdRenderer, MdBlockToken } from '../ports'
import type { DomParserPort } from '../ports'

// 数据源切换功能已移除: 本地图片与资源一律走与本文档同源的根路径
const baseUrl = () => '/'

// GFM admonition标记 → callout样式与中文标签
const CALLOUT_META: Record<string, { cls: string; label: string }> = {
  NOTE: { cls: 'note', label: '提示' },
  INFO: { cls: 'note', label: '信息' },
  TIP: { cls: 'tip', label: '技巧' },
  IMPORTANT: { cls: 'important', label: '重要' },
  WARNING: { cls: 'warning', label: '注意' },
  CAUTION: { cls: 'danger', label: '警告' },
  DANGER: { cls: 'danger', label: '危险' },
}

function localImageProxy(url: string | null): string | null {
  if (!url) {
    return url
  }
  if (url.startsWith('http') || url.startsWith('//')) {
    return url
  }
  if (url.startsWith('/')) {
    url = url.replace('/', '')
  } else {
    url = url.replace('./', '')
  }
  return baseUrl() + url
}

function buildDocLink(id: string, headingId: string): string {
  if (!id) {
    return ''
  }
  let url = DocUtils.docId2HtmlPath(id)
  if (headingId) {
    url += '?headingId=' + headingId
  }
  return url
}

/**
 * 文档渲染引擎: 把 markdown 经底层 md 引擎(MarkdownPort) + 站内自定义渲染规则转为 HTML。
 * 不直接依赖 marked / DOMParser, 而是通过注入的 MarkdownPort / DomParserPort 驱动,
 * 故渲染规则(站内链接/代码块/图片代理/callout/标题锚点)属 core, 可迁移到任意平台。
 */
export default class DocRender {
  constructor(
    private readonly markdown: MarkdownPort,
    private readonly dom: DomParserPort,
  ) {}

  public render(
    mdContent: string,
    docId: string,
    _tagList: TagSumItem[],
    _knowledgeLinkList: KnowledgeLinkNode[],
  ): string {
    const dom = this.dom
    const render: MdRenderer = this.markdown.createRenderer()

    // 自定义url渲染
    render.link = (token): string => {
      const href = token.href
      let text = token.text
      if (!href?.startsWith('http')) {
        let { id } = DocUtils.resloveDocUrl(href!)
        const { headingId } = DocUtils.resloveDocUrl(href!)
        // 纯页内锚点 [x](#frag): resloveDocUrl 得到空 id 但有 headingId,
        // 回落到当前文档自身 docId, 使链接在本文档内跳转而非丢失锚点
        if (!id && headingId) {
          id = docId
        }
        // 当text为html的情况下 排除掉dom中sup节点 文本化
        text = Array.from(dom.parse(text!).body.childNodes)
          .filter(n => (n as HTMLElement).tagName != 'SUP')
          .map(n => n.textContent)
          .join('')
        return `<a href='${buildDocLink(id, headingId!)}' origin-link='${href}'>${text}</a>`
      } else {
        return `<a href='${escapeAttr(href)}' target="_blank" rel="noopener noreferrer">${escapeHtml(text!)}</a>`
      }
    }
    // 自定义代码块渲染
    render.code = (token): string => {
      const language = token.lang
      const code = token.text
      // 如果语言是mermaid 特殊处理 转为mermaid
      if (language == 'mermaid') {
        return `
          <div class="mermaid-wrapper" data-raw="${escapeAttr(code)}">
            <div class="fullscreen">
              <button type="button" aria-label="全屏查看图表">全屏</button>
            </div>
            <div id='mermaid-${IdGenUtils.uuid()}' class="mermaid-source">${escapeHtml(code)}</div>
          </div>
        `
      }
      // 代码高亮不在解析阶段同步执行 由DocPostRender在内容上屏后分片处理
      const lang = language || 'text'
      return `<div class="code-block" data-lang="${escapeAttr(lang)}">`
        + `<div class="code-block-toolbar"><span class="code-lang">${escapeAttr(lang)}</span>`
        + `<button class="code-copy" type="button" aria-label="复制代码">复制</button></div>`
        + `<pre><code class="language-${escapeAttr(lang)}">${escapeHtml(code)}</code></pre>`
        + `</div>`
    }
    // 自定义图片渲染
    render.image = (token): string => {
      let href = token.href
      const text = token.text
      if (href?.startsWith('/')) {
        href = baseUrl() + href.replace('/', '')
      }
      // 不加crossorigin: 外链图床多数不返回CORS头 加了反而导致本可正常显示的图被拒绝渲染
      // figure/figcaption语义化 替代非法的p嵌套p; 不写假宽高 由CSS按自然尺寸约束
      return `<figure class="img-wrapper"><img loading="lazy" src='${localImageProxy(href ?? null)}' alt="${escapeAttr(text || '')}"/><figcaption class="img-title">${text}</figcaption></figure>`
    }

    const slugger = new Slugger()
    const oriTableRender = render.table!
    render.table = function (token: MdBlockToken) {
      const tableRenderText = oriTableRender.call(render, token)
      return `<div class="table-wrapper">${tableRenderText}</div>`
    }
    // GFM风格提示块: > [!NOTE] / [!TIP] / [!WARNING]... 渲染为语义callout卡片
    const oriBlockquoteRender = render.blockquote!
    render.blockquote = function (token: MdBlockToken) {
      const html = oriBlockquoteRender.call(render, token)
      const match = html.match(/^<blockquote>\s*<p>\[!([A-Z]+)\]\s*(<br\s*\/?>\s*)?/i)
      const meta = match && CALLOUT_META[match[1].toUpperCase()]
      if (!meta) {
        return html
      }
      const inner = html
        .replace(match[0], '<blockquote><p>')
        .replace(/^<blockquote>\s*<p>\s*<\/p>/, '<blockquote>')
        .replace(/^<blockquote>/, '')
        .replace(/<\/blockquote>\s*$/, '')
      return `<div class="callout callout-${meta.cls}"><p class="callout-title">${meta.label}</p>${inner}</div>`
    }
    render.heading = (token) => {
      const text = render.parser.parseInline(token.tokens)
      // 保持站内"md一级标题渲染为h2"的层级约定 但夹紧到h6 避免产生非法的h7
      const level = Math.min(token.depth + 1, 6)
      const raw = token.raw
        .toLowerCase()
        .trim()
        .replace(/<[!\/a-z].*?>/gi, '')
      const id = slugger.slug(raw)
      // hover显现的锚链接: 中键/修饰键点击可新开标签 普通点击由事件层复制链接
      const anchor = `<a class="heading-anchor" href="${buildDocLink(docId, id)}" aria-label="标题锚点">#</a>`
      return `<h${level} id="${id}">${text}${anchor}</h${level}>\n`
    }
    return this.markdown.parse(mdContent, { renderer: render, breaks: true })
  }
}

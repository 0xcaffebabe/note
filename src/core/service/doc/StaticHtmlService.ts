import type { MarkdownPort, DomParserPort } from '../../ports'
import DocFileInfo from '../../domain/DocFileInfo'
import { escapeHtmlText } from '../../util/StringUtils'

// 静态首屏 HTML 生成(平台无关): 以构建产物 index.html 为模板, 为单篇文档生成可直接访问的
// 静态 html(含 SEO/og/twitter meta + 可见 .static-content 直出正文)。marked/jsdom 经
// MarkdownPort/DomParserPort 注入, 自身零库 import; escapeHtmlText 已是 core。
// 提取自 build/plugins/DocBuildMove(逐字), driver 只剩读模板/文件 + fs 写出。
export class StaticHtmlService {
  constructor(
    private readonly markdown: MarkdownPort,
    private readonly dom: DomParserPort,
  ) {}

  /**
   * 以 template(index.html)为模板生成 info 文档对应的静态 html。
   * 正文以可见 .static-content 直出(首屏 + 爬虫), Vue 挂载后由 main.ts 移除。
   */
  buildStaticHtml(template: string, info: DocFileInfo, preloadTags: string = '', jsonPath: string = ''): string {
    const renderer = this.markdown.createRenderer()
    renderer.text = (token) => token.text
    let html = this.markdown.parse(info.content, { renderer }) as string
    html = html.replaceAll(/\.md/gi, '.html')
    // 保留换行: 压成单行会破坏 <pre><code> 代码块格式, 也让 view-source 不可读。
    // 用 body 包裹后取 textContent, 与原 jsdom innerHTML 写法等价。
    let text = this.dom.parse(`<!DOCTYPE html><body>${html}</body></html>`).body.textContent || ''
    text = text.replace(/\n/ig, '')
    const description = escapeHtmlText(text.substring(0, Math.min(100, text.length)))
    // 替换值用函数形式: 字符串形式会解释 $$/$& 等替换模式, 文档内容含 '$$'(KaTeX)时会被吞掉。
    // 捕获组用 [\s\S]*? 非贪婪到 </title>: title 自身含 '<'(如 'A & B <X>')时不会被截断。
    const siteName = escapeHtmlText(template.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '')
    const title = escapeHtmlText(info.name)
    // og/twitter 卡片: 让文档链接在微信/Slack/Twitter 等处分享时带标题与摘要预览
    const socialMeta = [
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${description}...">`,
      `<meta property="og:type" content="article">`,
      `<meta property="og:site_name" content="${siteName}">`,
      `<meta name="twitter:card" content="summary">`,
    ].join('\n  ')
    // 文档数据 json 预取: 与 js chunk 并行下载, 缩短可交互时间
    const jsonPreload = jsonPath ? `<link rel="preload" as="fetch" href="${jsonPath}">` : ''
    return template
      .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
      .replace('</head>', () => `<meta name="description" content="${description}...">\n  ${socialMeta}\n  ${preloadTags}\n  ${jsonPreload}\n  </head>`)
      .replace('</body>', () => `<div class='content static-content'>${html}</div></body>`)
  }

  /** 渲染 SUMMARY.md 为目录 html, 并把站内链接 ./xxx.md 重写为 /xxx.html。 */
  renderSummaryLinks(summaryMd: string): string {
    const renderer = this.markdown.createRenderer()
    return (this.markdown.parse(summaryMd, { renderer }) as string)
      .replaceAll(/\.\//gi, '/')
      .replaceAll(/\.md/gi, '.html')
  }
}

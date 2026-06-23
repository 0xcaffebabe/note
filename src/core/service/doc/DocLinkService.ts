import DocUtils from '../../util/DocUtils'
import { RelatedLink } from '../../domain/RelatedLink'
import type { DomParserPort } from '../../ports'

/**
 * 文档链接抽取子服务: 从已渲染 HTML 里抽图片地址 / 全部 <a> / 站内文档关联链接。
 *
 * 从 DocService 原样搬出, 行为字节级保持:
 *  - getImageUrlList 取 .img-wrapper 内 <img> 的 src;
 *  - resolveLinkList 取全部 <a> 的 innerText/href;
 *  - resolveDocLinks 仅挑指向其他文档的站内 .html 链接, 排除外链/锚点/自链/已排除 href, 并去重;
 *  - extractLinkContext 截链接所在块前后各 radius 字做上下文, 越界补省略号, 找不到锚文本时降级。
 *
 * 这些方法本就未被 @cache 修饰, 子服务自身不参与记忆化。
 */
export class DocLinkService {
  constructor(private readonly dom: DomParserPort) {}

  public getImageUrlList(docHtml: string): string[] {
    const document = this.dom.parse(docHtml)
    const imgList = document.querySelectorAll('.img-wrapper img')
    const result: string[] = []
    for (const i of imgList) {
      result.push(i.getAttribute('src') || '')
    }
    return result
  }

  public resolveLinkList(docHtml: string): { text: string, link: string }[] {
    const document = this.dom.parse(docHtml)
    const aList = document.querySelectorAll('a')
    const result: { text: string, link: string }[] = []
    for (const i of aList) {
      result.push({ text: i.innerText, link: i.getAttribute('href') || '' })
    }
    return result
  }

  public resolveDocLinks(docHtml: string, currentDocId: string, excludeHrefs: string[] = []): RelatedLink[] {
    const exclude = new Set(excludeHrefs)
    const seen = new Set<string>()
    const result: RelatedLink[] = []
    const document = this.dom.parse(docHtml)
    for (const anchor of Array.from(document.querySelectorAll('a'))) {
      const link = anchor.getAttribute('href') || ''
      if (!/\.html(\?|#|$)/.test(link)) {
        continue
      }
      const cleanLink = link.split(/[?#]/)[0]
      let docId: string
      try {
        docId = DocUtils.htmlUrl2Id(cleanLink)
      } catch {
        continue
      }
      if (!docId || docId === currentDocId) {
        continue
      }
      const href = DocUtils.docId2HtmlPath(docId)
      if (exclude.has(href) || seen.has(docId)) {
        continue
      }
      seen.add(docId)
      result.push({ href, path: DocUtils.docId2Url(docId), desc: '', context: this.extractLinkContext(anchor) })
    }
    return result
  }

  public extractLinkContext(anchor: Element, radius = 36): RelatedLink['context'] {
    const block = anchor.closest('p, li, td, th, dd, blockquote, h1, h2, h3, h4, h5, h6') || anchor.parentElement
    const full = (block?.textContent || '').replace(/\s+/g, ' ').trim()
    const text = (anchor.textContent || '').replace(/\s+/g, ' ').trim()
    if (!full || !text) {
      return undefined
    }
    const idx = full.indexOf(text)
    if (idx < 0) {
      return undefined
    }
    let before = full.slice(Math.max(0, idx - radius), idx)
    let after = full.slice(idx + text.length, idx + text.length + radius)
    if (idx - radius > 0) {
      before = '…' + before
    }
    if (idx + text.length + radius < full.length) {
      after = after + '…'
    }
    return { before, text, after }
  }
}

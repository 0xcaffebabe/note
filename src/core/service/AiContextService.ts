import type DocFileInfo from '../domain/DocFileInfo'
import type { DomParserPort } from '../ports/DomParserPort'
import DocUtils from '../util/DocUtils'

interface DocumentReader {
  getDocFileInfo(id: string): Promise<DocFileInfo>
  renderMd(file: DocFileInfo): string
}
export interface PublishedDocumentSection { headingId: string; title: string; text: string }
export interface PublishedDocumentContent {
  docId: string
  title: string
  url: string
  headings: { id: string; title: string }[]
  sources: PublishedDocumentSection[]
}

/** Static data extraction shared with the site renderer. Agent selection/budgets live in Note Bridge. */
export class AiContextService {
  constructor(private readonly docs: DocumentReader, private readonly dom: DomParserPort) {}

  async load(docId: string): Promise<PublishedDocumentContent> {
    const file = await this.docs.getDocFileInfo(docId)
    const body = this.dom.parse(this.docs.renderMd(file)).body
    body.querySelectorAll('script,style,button,.heading-anchor,.code-block-toolbar,sup').forEach(node => node.remove())
    const sources: PublishedDocumentSection[] = []
    const headings: PublishedDocumentContent['headings'] = []
    let current: PublishedDocumentSection = { headingId: '', title: file.name, text: '' }
    sources.push(current)
    const walk = (node: Node) => {
      if (node.nodeType === 3) { current.text += node.textContent || ''; return }
      if (node.nodeType !== 1) return
      const element = node as Element
      if (/^H[1-6]$/.test(element.tagName) && element.id) {
        const title = element.textContent || file.name
        current = { headingId: element.id, title, text: title + '\n' }
        sources.push(current)
        headings.push({ id: element.id, title })
        return
      }
      if (element.tagName === 'PRE' || element.classList.contains('mermaid-source')) {
        current.text += '\n```\n' + (element.textContent || '') + '\n```\n'
        return
      }
      if (element.tagName === 'IMG') { current.text += element.getAttribute('alt') || ''; return }
      if (element.tagName === 'TABLE') {
        current.text += '\n' + Array.from(element.querySelectorAll('tr'), row =>
          Array.from(row.querySelectorAll('th,td'), cell => cell.textContent?.trim() || '').join('\t')).join('\n') + '\n'
        return
      }
      Array.from(element.childNodes).forEach(walk)
      if (/^(P|DIV|LI|TR|BLOCKQUOTE|UL|OL|BR)$/.test(element.tagName)) current.text += '\n'
      if (/^(TD|TH)$/.test(element.tagName)) current.text += '\t'
    }
    Array.from(body.childNodes).forEach(walk)
    return { docId, title: file.name, url: encodeURI(DocUtils.docId2HtmlPath(docId)), headings,
      sources: sources.filter(source => source.text.trim().length > 0) }
  }
}

import type DocFileInfo from '../domain/DocFileInfo'
import type { DomParserPort } from '../ports/DomParserPort'
import type { AiContext, AiContextDocument, AiSource } from '../ports/AiBridgePort'
import DocUtils from '../util/DocUtils'
import { safeTextPrefix } from '../util/StringUtils'

export const AI_CONTEXT_BUDGET = 24000
export const AI_RELATED_LIMIT = 2

interface DocumentReader {
  getDocFileInfo(id: string): Promise<DocFileInfo>
  renderMd(file: DocFileInfo): string
}

export interface AiDocumentSelection {
  docId: string
  /** Empty means include all sections, subject to the visible budget. */
  headingIds?: string[]
}

/** Build context from the same rendered headings as the reader, preserving code whitespace. */
export class AiContextService {
  constructor(private readonly docs: DocumentReader, private readonly dom: DomParserPort) {}

  async load(docId: string): Promise<AiContextDocument> {
    const file = await this.docs.getDocFileInfo(docId)
    const body = this.dom.parse(this.docs.renderMd(file)).body
    body.querySelectorAll('script,style,button,.heading-anchor,.code-block-toolbar,sup').forEach(node => node.remove())
    const sources: AiSource[] = []
    const headings: AiContextDocument['headings'] = []
    let current: AiSource = { sourceId: '', headingId: '', title: file.name, text: '' }
    sources.push(current)
    const walk = (node: Node) => {
      if (node.nodeType === 3) {
        current.text += node.textContent || ''
        return
      }
      if (node.nodeType !== 1) return
      const element = node as Element
      if (/^H[1-6]$/.test(element.tagName) && element.id) {
        const title = element.textContent || file.name
        current = { sourceId: '', headingId: element.id, title, text: `${title}\n` }
        sources.push(current)
        headings.push({ id: element.id, title })
        return
      }
      if (element.tagName === 'PRE' || element.classList.contains('mermaid-source')) {
        current.text += `\n\`\`\`\n${element.textContent || ''}\n\`\`\`\n`
        return
      }
      if (element.tagName === 'IMG') {
        current.text += element.getAttribute('alt') || ''
        return
      }
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
    // This fingerprint identifies the exact local content; it is not a security hash.
    let hash = 2166136261
    for (let i = 0; i < file.content.length; i++) hash = Math.imul(hash ^ file.content.charCodeAt(i), 16777619)
    return {
      docId,
      title: file.name,
      url: encodeURI(DocUtils.docId2HtmlPath(docId)),
      contentHash: `fnv1a:${(hash >>> 0).toString(16)}`,
      metadata: file.formattedMetadata,
      headings,
      relatedLinks: (file.relatedLinks || []).map(link => ({ url: link.href, title: link.path })),
      sources: sources.filter(source => source.text.trim().length > 0),
      truncated: false,
    }
  }

  async build(selections: AiDocumentSelection[], budget = AI_CONTEXT_BUDGET): Promise<AiContext> {
    const unique = selections.filter((entry, index) => selections.findIndex(other => other.docId === entry.docId) === index)
    if (!unique.length || unique.length > AI_RELATED_LIMIT + 1) throw new Error('请选择当前文档及最多 2 篇关联文档')
    if (budget < 2000) throw new Error('上下文预算不足')
    const documents = await Promise.all(unique.map(async (selection, docIndex) => {
      const document = await this.load(selection.docId)
      // Cap auxiliary fields as well as source text; huge metadata must not bypass the budget.
      document.headings = document.headings.slice(0, 100).map(heading => ({ ...heading, title: safeTextPrefix(heading.title, 200) }))
      document.relatedLinks = document.relatedLinks.slice(0, 10)
      if (JSON.stringify(document.metadata).length > 2000) {
        document.metadata = { omitted: '元数据超过 2000 字符，已省略' }
        document.truncated = true
      }
      const selected = selection.headingIds?.length
        ? document.sources.filter(source => selection.headingIds!.includes(source.headingId))
        : document.sources
      if (!selected.length) throw new Error(`文档「${document.title}」所选范围没有正文，请选择其他章节或移除此关联文档`)
      if (selected.length > 256) document.truncated = true
      document.sources = selected.slice(0, 256).map((source, sourceIndex) => ({ ...source, sourceId: `D${docIndex + 1}S${sourceIndex + 1}` }))
      const allowance = Math.floor(budget / unique.length)
      let used = JSON.stringify({ ...document, sources: [] }).length + 100
      const sources: AiSource[] = []
      for (const source of document.sources) {
        const room = allowance - used - JSON.stringify({ ...source, text: '' }).length - 10
        if (room <= 80) { document.truncated = true; break }
        // Keep the original text (including indentation) and visibly mark a partial section.
        const text = source.text.length > room ? safeTextPrefix(source.text, room - 12) + '\n[本节已截断]' : source.text
        if (text !== source.text) document.truncated = true
        sources.push({ ...source, text })
        used += JSON.stringify(sources[sources.length - 1]).length
      }
      document.sources = sources
      if (!sources.length) throw new Error(`文档「${document.title}」的标题或元数据已占满预算，请减少关联文档或所选范围`)
      return document
    }))
    const context = { documents }
    // JSON escaping can expand code samples. Enforce the actual wire budget, not an estimate.
    while (JSON.stringify(context).length > budget) {
      const largest = documents.flatMap(document => document.sources.map(source => ({ document, source })))
        .sort((a, b) => b.source.text.length - a.source.text.length)[0]
      if (!largest || largest.source.text.length < 100) throw new Error('标题或元数据过长，请减少所选章节或关联文档')
      largest.source.text = safeTextPrefix(largest.source.text, Math.floor(largest.source.text.length * 0.8)) + '\n[本节已截断]'
      largest.document.truncated = true
    }
    return context
  }
}

/** Citations only resolve to our source map; model-supplied URLs never become links. */
export function aiCitationLinks(text: string, context: AiContext): { sourceId: string; title: string; url: string }[] {
  const ids = new Set(Array.from(text.matchAll(/\[(D\d+S\d+)\]/g), match => match[1]))
  return context.documents.flatMap(document => document.sources
    .filter(source => ids.has(source.sourceId))
    .map(source => ({ sourceId: source.sourceId, title: `${document.title} · ${source.title}`,
      url: document.url + (source.headingId ? `?headingId=${encodeURIComponent(source.headingId)}` : '') })))
}

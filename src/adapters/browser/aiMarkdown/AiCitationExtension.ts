import type { TokenizerAndRendererExtension } from 'marked'
import type { AiCitation } from '@/core/domain/AiDocumentTools'
import type { AiCitationLink } from './AiCitationLink'
import { escapeMarkup, safeCitationLink } from './AiMarkdownPolicy'

/**
 * 为本次回答创建独立引用索引，只识别来源列表中已校验的引用标记。
 * Marked 仅在行内语法中调用扩展，代码块和行内代码中的标记保持原样。
 */
export function createCitationExtension(sources: AiCitation[]): TokenizerAndRendererExtension {
  const citations = new Map<string, AiCitationLink>()
  for (const source of sources) {
    const url = safeCitationLink(source?.url)
    if (url && /^D\d{1,24}S\d{1,8}$/.test(source.sourceId) && !citations.has(source.sourceId)) {
      citations.set(source.sourceId, { source, url, index: citations.size + 1 })
    }
  }

  return {
    name: 'aiCitation',
    level: 'inline',
    start: (text) => text.indexOf('[D'),
    tokenizer(text) {
      const match = /^\[(D\d{1,24}S\d{1,8})\]/.exec(text)
      if (match && citations.has(match[1])) {
        return { type: 'aiCitation', raw: match[0], sourceId: match[1] }
      }
    },
    renderer(token) {
      const citation = citations.get(token.sourceId as string)
      if (!citation) {
        return escapeMarkup(token.raw)
      }
      const title = escapeMarkup(citation.source.title)
      return [
        `<a class="ai-citation" href="${escapeMarkup(citation.url)}"`,
        ` title="${title}" aria-label="${title}">`,
        `[${citation.index}]</a>`,
      ].join('')
    },
  }
}

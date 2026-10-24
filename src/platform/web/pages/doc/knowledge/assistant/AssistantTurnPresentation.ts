import type { AiSessionTurn } from '@/core/ports/AiBridgePort'
import type { AiCitation } from '@/core/domain/AiDocumentTools'

const sourceCache = new WeakMap<AiSessionTurn, AiCitation[]>()
const toolLabels: Record<string, string> = {
  get_document: '读取文档',
  get_toc: '读取文档目录',
  get_knowledge_network: '读取知识网络',
  get_related_documents: '读取关联文档',
  search_documents: '查找文档',
  get_knowledge_overview: '读取知识库概览',
}

/** 仅允许站内文档引用，供 Markdown 和来源导航共同使用同一安全边界。 */
export function turnSources(turn: AiSessionTurn): AiCitation[] {
  const cached = sourceCache.get(turn)
  if (cached) {
    return cached
  }
  const sources = turn.sources.filter(
    (source) =>
      /^D\d+S\d+$/.test(source.sourceId) &&
      source.url.startsWith('/') &&
      !source.url.startsWith('//') &&
      !/[\u0000-\u0020\u007f\\]/.test(source.url) &&
      /^[^?#]*\.html(?:[?#]|$)/.test(source.url),
  )
  sourceCache.set(turn, sources)
  return sources
}

/** 来源导航只展示回答实际使用的引用，不展示工具读取过的全部文档。 */
export function citations(turn: AiSessionTurn) {
  const used = new Set(Array.from(turn.answer.matchAll(/\[(D\d+S\d+)\]/g), (match) => match[1]))
  return turnSources(turn).filter((source) => used.has(source.sourceId))
}

export function toolLabel(name: string) {
  return toolLabels[name] || name
}

export function answerPlaceholder(turn: AiSessionTurn) {
  if (turn.status === 'running') {
    return '正在思考…'
  }
  if (turn.status === 'cancelled') {
    return '回答已停止'
  }
  return turn.error ? '未能生成回答' : '未收到回答'
}

import type { AiDocumentToolResult, AiToolCallOverview } from '../domain/AiDocumentTools'
import { safeTextPrefix } from '../util/StringUtils'

type ObjectValue = Record<string, unknown>
const MAX_ITEMS = 8
const CONTROL = /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/
const knownTools = new Set(['get_knowledge_overview', 'search_documents', 'get_knowledge_network', 'get_toc', 'get_document', 'get_related_documents'])
const object = (value: unknown): value is ObjectValue => !!value && typeof value === 'object' && !Array.isArray(value)
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000
const bounded = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && !CONTROL.test(value)

function label(value: unknown, max = 200): string | undefined {
  if (typeof value !== 'string') return
  const clean = value.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return
  return clean.length > max ? safeTextPrefix(clean, max - 1) + '…' : clean
}

/** Strict bounds on persisted metadata, copying only declared display fields. */
export function copyAiToolCallOverview(value: unknown): AiToolCallOverview | undefined {
  if (!object(value) || !Array.isArray(value.input) || value.input.length > 8
    || !value.input.every(field => object(field) && bounded(field.label, 32) && bounded(field.value, 256))
    || (value.summary !== undefined && !bounded(value.summary, 320))
    || (value.items !== undefined && (!Array.isArray(value.items) || value.items.length > MAX_ITEMS || !value.items.every(item => bounded(item, 200))))
    || (value.note !== undefined && !bounded(value.note, 400))) return
  return {
    input: value.input.map(field => ({ label: field.label as string, value: field.value as string })),
    ...(value.summary !== undefined ? { summary: value.summary as string } : {}),
    ...(value.items !== undefined ? { items: [...value.items as string[]] } : {}),
    ...(value.note !== undefined ? { note: value.note as string } : {}),
  }
}

/** Extract only known arguments and result metadata. Raw text, snippets, URLs and extra fields never enter history. */
export function buildAiToolCallOverview(name: string, argumentsValue: unknown, result?: AiDocumentToolResult): AiToolCallOverview | undefined {
  if (!knownTools.has(name)) return
  const args = object(argumentsValue) ? argumentsValue : {}
  const input: AiToolCallOverview['input'] = []
  const add = (field: string, value: unknown) => { const text = label(value, 256); if (text) input.push({ label: field, value: text }) }
  const docId = label(args.docId, 256)
  if (docId) add('文档', docId)
  if (name === 'get_knowledge_overview') add('范围', label(args.category) ? `分类：${label(args.category)}` : '整个知识库')
  if (name === 'get_knowledge_network') {
    if (!docId) add('范围', '整个知识库')
    add('关联方向', !docId || args.direction === undefined || args.direction === 'both' ? '双向关联'
      : args.direction === 'incoming' ? '引用本文' : args.direction === 'outgoing' ? '本文引用' : undefined)
  }
  if (name === 'search_documents') {
    add('搜索词', args.query)
    add('范围', args.scope === 'catalog' ? '文档标题与路径' : args.scope === 'fulltext' ? '全文索引' : args.scope === undefined || args.scope === 'all' ? '全文与目录' : undefined)
  }
  if (name === 'get_document') {
    if (args.section === undefined || count(args.section)) add('章节', `第 ${((args.section as number | undefined) ?? 0) + 1} 节`)
    if (count(args.maxChars)) add('最多读取', `${args.maxChars} 个字符`)
  }
  if (count(args.offset) && args.offset > 0) add(name === 'get_document' ? '起始字符' : '起始位置', String(args.offset))
  if (count(args.limit)) add('本页上限', `${args.limit} 项`)
  if (name === 'get_knowledge_overview') {
    if (count(args.categoryOffset) && args.categoryOffset > 0) add('分类起始位置', String(args.categoryOffset))
    if (count(args.categoryLimit)) add('分类上限', `${args.categoryLimit} 项`)
  }
  const overview: AiToolCallOverview = { input }
  if (!result) return overview
  const data = object(result.data) ? result.data : {}
  const notes: string[] = []
  const items: string[] = []
  const list = (key: string): ObjectValue[] | undefined => Array.isArray(data[key]) && data[key].every(object) ? data[key] : undefined
  const titles = (values: ObjectValue[] | undefined, prefix = '') => {
    for (const value of values || []) { const title = label(value.title); if (title) items.push(prefix + title) }
  }
  const documents = list('documents')
  const documentTitle = label(data.title)
  if (documentTitle && docId) input.find(field => field.label === '文档')!.value = label(`${documentTitle}（${docId}）`, 256)!
  switch (name) {
    case 'get_knowledge_overview': {
      if (count(data.totalDocuments) && count(data.totalCategories) && documents) {
        overview.summary = `知识库共 ${data.totalDocuments} 篇文档、${data.totalCategories} 个分类，本次返回 ${documents.length} 篇文档。`
      }
      for (const category of list('categories') || []) {
        const title = label(category.category === '(root)' ? '根目录' : category.category)
        if (title && count(category.documentCount)) items.push(`${title}：${category.documentCount} 篇文档`)
      }
      titles(documents, '文档：')
      if (data.categoriesTruncated === true || count(data.nextCategoryOffset)) notes.push('仍有分类未返回，可继续读取下一页。')
      break
    }
    case 'search_documents': {
      if (count(data.total) && documents) overview.summary = `找到 ${data.total} 篇匹配文档，本次返回 ${documents.length} 篇。`
      titles(documents)
      const fulltext = object(data.fulltext) ? data.fulltext : {}
      if (fulltext.status === 'failed' || fulltext.status === 'unavailable') notes.push(fulltext.status === 'failed'
        ? '全文索引查询失败，本次仅返回文档标题与路径匹配，不能据此判断正文是否包含关键词。'
        : '全文索引不可用，本次仅返回文档标题与路径匹配，不能据此判断正文是否包含关键词。')
      else if (fulltext.status === 'ok') notes.push('全文索引最多检索 200 个候选，可能滞后或未覆盖所有文档；匹配片段需读取正文核实。')
      break
    }
    case 'get_knowledge_network': {
      const nodes = list('nodes'), edges = list('edges')
      if (nodes && edges && count(data.totalEdges)) overview.summary = `本次返回 ${nodes.length} 篇文档间的 ${edges.length} 条关联，共有 ${data.totalEdges} 条关联可读取。`
      titles(nodes)
      break
    }
    case 'get_toc': {
      const headings = list('headings')
      if (headings && count(data.total)) overview.summary = `本次返回 ${headings.length} / ${data.total} 个章节。`
      for (const heading of headings || []) {
        const title = label(heading.title)
        if (title && count(heading.section)) items.push(`第 ${heading.section + 1} 节：${title}`)
      }
      break
    }
    case 'get_document': {
      const sectionTitle = label(data.sectionTitle)
      if (typeof data.text === 'string') {
        const title = label([documentTitle, sectionTitle].filter(Boolean).join(' · '))
        overview.summary = `已读取${title ? `《${title}》` : '当前章节'}的 ${Array.from(data.text).length} 个字符。`
      }
      if (count(data.section)) {
        const section = input.find(field => field.label === '章节')
        if (section) section.value = label(`第 ${data.section + 1} 节${sectionTitle ? `：${sectionTitle}` : ''}`, 256)!
      }
      if (count(data.nextSection)) notes.push('文档还有其他章节，本次仅包含当前章节的内容。')
      break
    }
    case 'get_related_documents':
      if (documents && count(data.total)) overview.summary = `找到 ${data.total} 篇相关文档，本次返回 ${documents.length} 篇。`
      titles(documents)
      break
  }
  if (data.truncated === true || count(data.nextOffset)) notes.push(name === 'get_document'
    ? '当前章节尚未读完，可继续读取剩余内容。'
    : name === 'get_toc' ? '仍有章节未返回，可继续读取下一页。'
      : name === 'get_knowledge_network' ? '仍有关联未返回，可继续读取下一页。'
        : '仍有文档未返回，可继续读取下一页。')
  if (items.length) overview.items = items.slice(0, MAX_ITEMS).map(item => label(item)!)
  if (items.length > MAX_ITEMS) notes.push(`概览仅列出前 ${MAX_ITEMS} 项。`)
  overview.summary ??= '工具已执行，暂无可展示的结果概览。'
  if (notes.length) overview.note = label(notes.join(' '), 400)
  return overview
}

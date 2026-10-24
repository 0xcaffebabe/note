import { describe, expect, it } from 'vitest'
import { buildAiToolCallOverview, copyAiToolCallOverview } from '@/core/service/AiToolCallOverview'

describe('工具调用概览', () => {
  it('知识库概览保存真实总数、分类和文档标题，并区分分页与展示截断', () => {
    const overview = buildAiToolCallOverview('get_knowledge_overview', { limit: 10, categoryLimit: 1 }, { data: {
      totalDocuments: 306, totalCategories: 14, categories: [{ category: '软件工程', documentCount: 96 }],
      documents: Array.from({ length: 10 }, (_, i) => ({ title: `文档 ${i + 1}`, text: '不保存正文' })),
      nextOffset: 10, categoriesTruncated: true, truncated: true,
    } })!
    expect(overview.input).toContainEqual({ label: '范围', value: '整个知识库' })
    expect(overview.summary).toBe('知识库共 306 篇文档、14 个分类，本次返回 10 篇文档。')
    expect(overview.items).toEqual(['软件工程：96 篇文档', ...Array.from({ length: 7 }, (_, i) => `文档：文档 ${i + 1}`)])
    expect(overview.note).toContain('仍有分类未返回')
    expect(overview.note).toContain('仍有文档未返回')
    expect(overview.note).toContain('概览仅列出前 8 项')
    expect(JSON.stringify(overview)).not.toContain('不保存正文')
    expect(copyAiToolCallOverview(overview)).toEqual(overview)
  })

  it('搜索摘要含查询与实际匹配数，全文失败明确说明退回目录且不保存索引片段', () => {
    const overview = buildAiToolCallOverview('search_documents', { query: '事务隔离', scope: 'fulltext', offset: 3, token: 'hidden-input' }, { data: {
      total: 4, documents: [{ title: '数据库事务', snippets: ['hidden-snippet'] }], nextOffset: null,
      fulltext: { status: 'failed', message: 'hidden-message' }, secret: 'hidden-result',
    } })!
    expect(overview.input).toEqual([
      { label: '搜索词', value: '事务隔离' }, { label: '范围', value: '全文索引' }, { label: '起始位置', value: '3' },
    ])
    expect(overview.summary).toBe('找到 4 篇匹配文档，本次返回 1 篇。')
    expect(overview.items).toEqual(['数据库事务'])
    expect(overview.note).toContain('全文索引查询失败，本次仅返回文档标题与路径匹配')
    expect(JSON.stringify(overview)).not.toContain('hidden-')
    for (const [status, expected] of [['ok', '可能滞后或未覆盖所有文档'], ['unavailable', '全文索引不可用']]) {
      expect(buildAiToolCallOverview('search_documents', {}, { data: { total: 0, documents: [], fulltext: { status } } })?.note).toContain(expected)
    }
    expect(buildAiToolCallOverview('search_documents', {}, { data: { total: 0, documents: [], fulltext: { status: 'not_requested' } } })?.note).toBeUndefined()
  })

  it('读取正文显示文档、章节、字符数和未读范围，但从不保留原文或外站链接', () => {
    const args = { docId: '数据库_事务', section: 2, offset: 100, maxChars: 256 }
    expect(buildAiToolCallOverview('get_document', args)?.input).toContainEqual({ label: '章节', value: '第 3 节' })
    const overview = buildAiToolCallOverview('get_document', args, { data: {
      title: '事务', section: 2, sectionTitle: '隔离级别', text: '正文🔒', nextSection: 3, nextOffset: 104, truncated: true,
      url: 'https://outside.test', metadata: { apiKey: 'private-key' },
    } })!
    expect(overview.input).toContainEqual({ label: '文档', value: '事务（数据库_事务）' })
    expect(overview.input).toContainEqual({ label: '章节', value: '第 3 节：隔离级别' })
    expect(overview.summary).toBe('已读取《事务 · 隔离级别》的 3 个字符。')
    expect(overview.note).toContain('文档还有其他章节')
    expect(overview.note).toContain('当前章节尚未读完')
    expect(JSON.stringify(overview)).not.toMatch(/正文|outside|private-key/)
  })

  it('TOC、知识网络和相关文档分别展示章节与文档计数及标题', () => {
    const toc = buildAiToolCallOverview('get_toc', { docId: 'doc' }, { data: {
      title: '目录文档', total: 5, headings: [{ section: 2, title: '一致性' }], nextOffset: 3,
    } })!
    expect(toc.summary).toBe('本次返回 1 / 5 个章节。')
    expect(toc.items).toEqual(['第 3 节：一致性'])
    expect(toc.note).toContain('仍有章节未返回')
    const network = buildAiToolCallOverview('get_knowledge_network', { docId: 'doc', direction: 'incoming' }, { data: {
      nodes: [{ title: '事务' }, { title: '一致性' }], edges: [{ from: 'a', to: 'b' }], totalEdges: 3, truncated: true,
    } })!
    expect(network.input).toContainEqual({ label: '关联方向', value: '引用本文' })
    expect(network.summary).toBe('本次返回 2 篇文档间的 1 条关联，共有 3 条关联可读取。')
    expect(network.items).toEqual(['事务', '一致性'])
    expect(network.note).toContain('仍有关联未返回')
    expect(buildAiToolCallOverview('get_knowledge_network', {})?.input).toContainEqual({ label: '范围', value: '整个知识库' })
    const related = buildAiToolCallOverview('get_related_documents', { docId: 'doc' }, { data: {
      total: 1, documents: [{ title: '分布式事务' }], nextOffset: null,
    } })!
    expect(related.summary).toBe('找到 1 篇相关文档，本次返回 1 篇。')
    expect(related.items).toEqual(['分布式事务'])
    expect(related.note).toBeUndefined()
  })

  it('缺失和无效元数据不臆造计数，运行态只提取白名单参数', () => {
    expect(buildAiToolCallOverview('unknown_tool', { query: 'hidden' })).toBeUndefined()
    expect(buildAiToolCallOverview('search_documents', { query: '关键词', extra: 'hidden' })).toEqual({ input: [
      { label: '搜索词', value: '关键词' }, { label: '范围', value: '全文与目录' },
    ] })
    const overview = buildAiToolCallOverview('get_toc', { docId: 'doc' }, { data: { total: -1, headings: ['secret'] } })!
    expect(overview.summary).toContain('暂无可展示的结果概览')
    expect(overview.items).toBeUndefined()
    expect(JSON.stringify(overview)).not.toContain('secret')
  })

  it('长标题和参数有界且清除控制字符，持久化副本只包含声明字段', () => {
    const overview = buildAiToolCallOverview('search_documents', { query: 'a'.repeat(255) + '🔒'.repeat(200) + '\u202e' }, { data: {
      total: 1, documents: [{ title: '\u0000' + '长'.repeat(500) }],
    } })!
    expect(overview.input[0].value.length).toBeLessThanOrEqual(256)
    expect(overview.items![0].length).toBeLessThanOrEqual(200)
    const copy = copyAiToolCallOverview({ ...overview, raw: 'hidden', input: [{ ...overview.input[0], token: 'hidden' }] })!
    expect(copy).toEqual({ ...overview, input: [overview.input[0]] })
    expect(JSON.stringify(copy)).not.toContain('hidden')
    expect(JSON.stringify(copy)).not.toMatch(/\\u(?:d[89ab][0-9a-f]{2}|0000|202e)/i)
    expect(copy).not.toBe(overview)
    expect(copy.items).not.toBe(overview.items)
    for (const invalid of [
      { input: [], summary: 'a'.repeat(321) }, { input: [], items: Array(9).fill('title') },
      { input: [{ label: 'query', value: 'a'.repeat(257) }] }, { input: [], note: '\u0000' },
      { input: [], items: [{ text: 'not a string' }] }, { input: Array(9).fill({ label: 'x', value: 'y' }) },
    ]) expect(copyAiToolCallOverview(invalid)).toBeUndefined()
  })
})

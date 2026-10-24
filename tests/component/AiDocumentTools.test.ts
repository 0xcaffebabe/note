import { describe, expect, it, vi } from 'vitest'
import { AiDocumentTools, AI_TOOL_RESULT_BYTES } from '@/core/service/AiDocumentTools'
import { AiContextService } from '@/core/service/AiContextService'
import DocFileInfo from '@/core/domain/DocFileInfo'
import DocRender from '@/core/render/DocRender'
import { markedMarkdown } from '@/adapters/libs/MarkedMarkdownAdapter'
import { browserDomParser } from '@/adapters/browser/BrowserDomParser'
import type Category from '@/core/domain/Category'
import Cache from '@/core/cache/Cache'
import CacheService from '@/core/cache/CacheService'

function setup(content = '# 标题一\n正文\n\n```python\nif True:\n    print("hello")\n```\n\n# 标题二\n下一节') {
  const render = new DocRender(markedMarkdown, browserDomParser)
  const getDocFileInfo = vi.fn(async (id: string) => Object.assign(new DocFileInfo(), { id, name: id, content }))
  const context = new AiContextService({ getDocFileInfo, renderMd: doc => render.render(doc.content, doc.id, [], []) }, browserDomParser)
  const categories = { getFlatCategoryList: vi.fn(async () => [
    { name: '测试文档', link: './doc/test/doc.md' },
    { name: '关联文档', link: './doc/related.md' },
    { name: '另一个文档', link: './doc/other.md' },
    { name: '恶意 URL', link: 'https://evil.example/secret.md' },
    { name: '越界路径', link: './doc/../secret.md' },
  ] as Category[]) }
  const docs = { getSimliarDoc: vi.fn(async () => ['./doc/related.md', './doc/related.md', './doc/unknown.md', './doc/test/doc.md', 'https://evil.example/secret.md']) }
  const knowledge = { getKnowledgeNetwork: vi.fn(async () => [
    { id: 'test-doc', links: [{ id: 'related', name: '相关知识' }, { id: 'unknown', name: '未知' }] },
    { id: 'other', links: [{ id: 'test-doc', name: '被引用' }] },
    { id: 'unknown', links: [{ id: 'test-doc', name: '未知来源' }] },
  ]) }
  const tools = new AiDocumentTools(context, docs, categories, knowledge)
  const controller = new AbortController()
  const execute = (name: string, args: unknown, signal = controller.signal) => tools.execute(name, args, signal)
  return { context, getDocFileInfo, categories, docs, knowledge, tools, controller, execute }
}

describe('AiDocumentTools', () => {
  it('只公开五种只读工具，未知参数、越界路径、URL 和未收录 ID 不进入文档读取', async () => {
    const { tools, execute, getDocFileInfo, categories } = setup()
    expect(tools.definitions.map(item => item.name)).toEqual(['get_document', 'get_toc', 'get_knowledge_network', 'get_related_documents', 'search_documents'])
    for (const [name, args] of [
      ['read_file', { path: '/etc/passwd' }],
      ['get_document', { docId: '../secret' }],
      ['get_document', { docId: '..-secret' }],
      ['get_document', { docId: '%2e%2e-secret' }],
      ['get_document', { docId: 'https://evil.example' }],
      ['get_document', { docId: 'test-doc', url: 'https://evil.example' }],
      ['get_document', { docId: 'test-doc', maxChars: 1000000 }],
      ['get_toc', { docId: 'test-doc', offset: 0.5 }],
      ['get_toc', { docId: 'test-doc', limit: null }],
      ['get_knowledge_network', { docId: 'test-doc', direction: 'all' }],
      ['get_toc', []],
      ['get_toc', {}],
    ] as [string, unknown][]) await expect(execute(name, args)).rejects.toThrow()
    expect(categories.getFlatCategoryList).not.toHaveBeenCalled()
    await expect(execute('get_document', { docId: 'unknown' })).rejects.toThrow('目录')
    expect(getDocFileInfo).not.toHaveBeenCalled()
  })

  it('正文保留代码缩进，TOC 锚点与正文一致，分页及跨工具来源 ID 稳定', async () => {
    const { execute, context } = setup('# 重复\n正文\n\n```python\nif True:\n    print("hello")\n```\n\n# 重复\n下一节')
    const real = await context.load('test-doc')
    const toc = await execute('get_toc', { docId: 'test-doc', limit: 1 })
    const data = toc.data as any
    expect(data.headings[0]).toMatchObject({ section: 0, headingId: real.headings[0].id, title: '重复' })
    expect(data.nextOffset).toBe(1)
    const first = await execute('get_document', { docId: 'test-doc' })
    expect((first.data as any).text).toContain('if True:\n    print("hello")')
    expect(first.sources![0].sourceId).toBe(toc.sources![0].sourceId)
    expect(first.sources![0].url).toBe('/test/doc.html?headingId=' + encodeURIComponent(real.headings[0].id))
    const second = await execute('get_document', { docId: 'test-doc', section: 1 })
    const other = await execute('get_document', { docId: 'related' })
    expect(new Set([first, second, other].map(result => result.sources![0].sourceId)).size).toBe(3)
    expect((await execute('get_document', { docId: 'test-doc' })).sources).toEqual(first.sources)
    expect((first.data as any).nextSection).toBe(1)
    expect((second.data as any).nextSection).toBeNull()
    await expect(execute('get_document', { docId: 'test-doc', section: 100 })).rejects.toThrow('章节不存在')
  })

  it('长文本分页保留全部字符且不会拆开 emoji，返回 UTF-8 JSON 小于协议预算', async () => {
    const { execute, context } = setup('# 很长\n' + '中文😀\\"'.repeat(1800))
    const expected = (await context.load('test-doc')).sources[0].text
    let combined = ''
    let offset: number | null = 0
    do {
      const response = await execute('get_document', { docId: 'test-doc', offset, maxChars: 8000 })
      const data = response.data as any
      expect(new TextEncoder().encode(JSON.stringify(response)).length).toBeLessThan(AI_TOOL_RESULT_BYTES)
      expect(data.text.isWellFormed()).toBe(true)
      combined += data.text
      offset = data.nextOffset
    } while (offset !== null)
    expect(combined).toBe(expected)
    const emojiOffset = expected.indexOf('😀') + 1
    await expect(execute('get_document', { docId: 'test-doc', offset: emojiOffset })).rejects.toThrow('offset')
  })

  it('知识网络只返回目录内的相邻子图，明确方向和截断，关联文档去重排除站外', async () => {
    const { execute } = setup()
    const incoming = await execute('get_knowledge_network', { docId: 'test-doc', direction: 'incoming' })
    expect((incoming.data as any).edges).toEqual([{ from: 'other', to: 'test-doc', title: '被引用' }])
    const limited = await execute('get_knowledge_network', { docId: 'test-doc', limit: 1 })
    expect((limited.data as any).edges).toHaveLength(1)
    expect((limited.data as any).truncated).toBe(true)
    expect((limited.data as any).nodes.map((node: any) => node.docId)).toEqual(['test-doc', 'related'])
    const related = await execute('get_related_documents', { docId: 'test-doc' })
    expect((related.data as any).documents.map((doc: any) => doc.docId)).toEqual(['related'])
    expect(related.sources![0].url).toBe('/related.html')
  })

  it('搜索限定目录标题与路径，支持分页，无需正文或网络搜索服务', async () => {
    const { execute, getDocFileInfo, knowledge } = setup()
    const first = await execute('search_documents', { query: '文档', limit: 1 })
    expect((first.data as any).total).toBe(3)
    expect((first.data as any).nextOffset).toBe(1)
    const second = await execute('search_documents', { query: '文档', offset: 1, limit: 1 })
    expect(second.sources![0].sourceId).not.toBe(first.sources![0].sourceId)
    expect((await execute('search_documents', { query: '测试 test' })).data).toMatchObject({ total: 1, scope: 'catalog_titles_and_paths' })
    await expect(execute('search_documents', { query: '  ' })).rejects.toThrow('不得为空')
    expect(getDocFileInfo).not.toHaveBeenCalled()
    expect(knowledge.getKnowledgeNetwork).not.toHaveBeenCalled()
  })

  it('使用真实缓存装饰器时，后续工具调用仍接受目录与图谱的同步缓存命中值', async () => {
    const { context, docs } = setup()
    class CachedReaders {
      readonly cache = new CacheService()
      name() { return 'ai-tools-cached-readers-test' }
      @Cache()
      async getFlatCategoryList(): Promise<Category[]> { return [{ name: '测试文档', link: './doc/test/doc.md' }] as Category[] }
      @Cache()
      async getKnowledgeNetwork() { return [{ id: 'test-doc', links: [] }] }
    }
    const readers = new CachedReaders()
    const tools = new AiDocumentTools(context, docs, readers, readers)
    const signal = new AbortController().signal
    await tools.execute('get_toc', { docId: 'test-doc' }, signal)
    expect(readers.getFlatCategoryList()).not.toBeInstanceOf(Promise)
    const document = await tools.execute('get_document', { docId: 'test-doc' }, signal)
    expect((document.data as any).text).toContain('正文')
    await tools.execute('get_knowledge_network', { docId: 'test-doc' }, signal)
    expect(readers.getKnowledgeNetwork()).not.toBeInstanceOf(Promise)
    await expect(tools.execute('get_knowledge_network', { docId: 'test-doc' }, signal)).resolves.toMatchObject({ data: { docId: 'test-doc' } })
  })

  it('已取消的调用不启动读取，等待中的调用在取消时立即结束且不回传迟到结果', async () => {
    const { execute, controller, categories, getDocFileInfo } = setup()
    controller.abort()
    await expect(execute('get_document', { docId: 'test-doc' })).rejects.toMatchObject({ name: 'AbortError' })
    expect(categories.getFlatCategoryList).not.toHaveBeenCalled()
    const active = new AbortController()
    let resolve!: (value: Category[]) => void
    categories.getFlatCategoryList.mockReturnValueOnce(new Promise(done => { resolve = done }))
    const pending = execute('get_document', { docId: 'test-doc' }, active.signal)
    active.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    resolve([{ name: '正文', link: './doc/test/doc.md' }] as Category[])
    await Promise.resolve()
    expect(getDocFileInfo).not.toHaveBeenCalled()
  })

  it('大量多语言目录结果按实际字节收缩并给出可继续的 offset', async () => {
    const { execute, categories } = setup()
    categories.getFlatCategoryList.mockResolvedValueOnce(Array.from({ length: 30 }, (_, i) => ({ name: '文'.repeat(200), link: `./doc/${'文'.repeat(160)}${i}.md` })) as Category[])
    const result = await execute('search_documents', { query: '文', limit: 30 })
    expect(new TextEncoder().encode(JSON.stringify(result)).length).toBeLessThanOrEqual(AI_TOOL_RESULT_BYTES)
    expect((result.data as any).documents.length).toBeGreaterThan(0)
    expect((result.data as any).documents.length).toBeLessThan(30)
    expect((result.data as any).nextOffset).toBe((result.data as any).documents.length)
  })
})

import { describe, expect, it } from 'vitest'
import { AiContextService, aiCitationLinks } from '@/core/service/AiContextService'
import DocFileInfo from '@/core/domain/DocFileInfo'
import DocRender from '@/core/render/DocRender'
import { markedMarkdown } from '@/adapters/libs/MarkedMarkdownAdapter'
import { browserDomParser } from '@/adapters/browser/BrowserDomParser'

function setup(content: string) {
  const render = new DocRender(markedMarkdown, browserDomParser)
  const file = Object.assign(new DocFileInfo(), { id: 'test-doc', name: '测试', content,
    relatedLinks: [{ href: '/related.html', path: '/related.md', desc: '说明' }] })
  const service = new AiContextService({
    getDocFileInfo: async id => ({ ...file, id }),
    renderMd: doc => render.render(doc.content, doc.id, [], []),
  }, browserDomParser)
  return { service, file, render }
}

describe('AiContextService', () => {
  it('来源复用真实锚点，保留代码缩进、表格边界和元数据', async () => {
    const { service, file, render } = setup('# 重复\n文本\n\n```python\nif True:\n    print("yes")\n```\n\n# 重复\n\n| A | B |\n|---|---|\n| one | two |')
    const context = await service.build([{ docId: file.id }])
    const doc = context.documents[0]
    const headings = Array.from(browserDomParser.parse(render.render(file.content, file.id, [], [])).querySelectorAll('h2')).map(node => node.id)
    expect(doc.sources.map(source => source.headingId)).toEqual(headings)
    expect(headings[0]).not.toBe(headings[1])
    expect(doc.sources[0].text).toContain('if True:\n    print("yes")')
    expect(doc.sources[1].text).toContain('one\ttwo')
    expect(doc.metadata).toEqual(file.formattedMetadata)
    expect(doc.relatedLinks).toEqual([{ url: '/related.html', title: '/related.md' }])
    expect(doc.sources[0].text).not.toContain('复制')
  })

  it('按显式章节选择，仅携带调用方选中的文档，来源 ID 不冲突', async () => {
    const { service } = setup('# 第一节\n秘密一\n# 第二节\n目标二')
    const loaded = await service.load('current')
    const context = await service.build([{ docId: 'current', headingIds: [loaded.headings[1].id] }, { docId: 'chosen' }])
    expect(context.documents.map(doc => doc.docId)).toEqual(['current', 'chosen'])
    expect(context.documents[0].sources[0].text).not.toContain('秘密一')
    expect(context.documents[0].sources[0].text).toContain('目标二')
    const ids = context.documents.flatMap(doc => doc.sources.map(source => source.sourceId))
    expect(new Set(ids).size).toBe(ids.length)
    await expect(service.build(['a', 'b', 'c', 'd'].map(docId => ({ docId })))).rejects.toThrow('最多 2')
  })

  it('按实际 JSON 字符预算截断，正文和元数据都不能绕过上限', async () => {
    const { service, file } = setup('# 长内容\n\n```txt\n' + '\\" '.repeat(16000) + '\n```')
    file.formattedMetadata = { ...file.formattedMetadata, alias: ['x'.repeat(5000)] }
    const context = await service.build([{ docId: 'a' }, { docId: 'b' }, { docId: 'c' }], 12000)
    expect(JSON.stringify(context).length).toBeLessThanOrEqual(12000)
    expect(context.documents.every(doc => doc.truncated && doc.sources.length)).toBe(true)
    expect(context.documents[0].sources[0].text).toContain('[本节已截断]')
    expect(context.documents[0].metadata).toEqual(expect.objectContaining({ omitted: expect.any(String) }))
  })

  it('只解析存在的来源 ID，不接受模型伪造的 URL', async () => {
    const { service } = setup('# 章节\n正文')
    const context = await service.build([{ docId: 'test-doc' }])
    const links = aiCitationLinks('[D1S1] [D1S1] [D9S9] [恶意](javascript:alert(1))', context)
    expect(links).toHaveLength(1)
    expect(links[0].url).toBe('/test/doc.html?headingId=' + encodeURIComponent(context.documents[0].sources[0].headingId))
  })

  it('不存在的章节或空正文必须明确失败，不向桥接发送空来源文档', async () => {
    const { service } = setup('# 存在\n正文')
    await expect(service.build([{ docId: 'a' }, { docId: 'b', headingIds: ['missing'] }])).rejects.toThrow('所选范围没有正文')
    await expect(setup('').service.build([{ docId: 'empty' }])).rejects.toThrow('所选范围没有正文')
  })

  it('大量短章节仍遵守桌面协议每篇至多 256 个来源的限制', async () => {
    const { service } = setup(Array.from({ length: 300 }, () => '# a\nb').join('\n'))
    const context = await service.build([{ docId: 'many' }], 90000)
    expect(context.documents[0].sources).toHaveLength(256)
    expect(context.documents[0].truncated).toBe(true)
  })

  it('标题及两阶段预算截断都不会产生孤立 emoji 代理项', async () => {
    const { service } = setup('# ' + 'a'.repeat(199) + '😀\n' + '😀\\'.repeat(2000))
    for (const budget of [2000, 2001, 2002, 2003, 2004]) {
      const context = await service.build([{ docId: 'emoji' }], budget)
      expect(JSON.stringify(context).length).toBeLessThanOrEqual(budget)
      const document = context.documents[0]
      expect(document.headings[0].title).toBe('a'.repeat(199))
      expect(document.truncated).toBe(true)
      expect(document.sources.every(source => source.text.isWellFormed())).toBe(true)
      expect(JSON.stringify(context)).not.toMatch(/\\u[dD][89aAbB][0-9a-fA-F]{2}/)
    }
  })
})

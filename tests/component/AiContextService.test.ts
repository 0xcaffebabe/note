import { describe, expect, it } from 'vitest'
import { AiContextService } from '@/core/service/AiContextService'
import DocFileInfo from '@/core/domain/DocFileInfo'
import DocRender from '@/core/render/DocRender'
import { markedMarkdown } from '@/adapters/libs/MarkedMarkdownAdapter'
import { browserDomParser } from '@/adapters/browser/BrowserDomParser'

function setup(content: string) {
  const render = new DocRender(markedMarkdown, browserDomParser)
  const file = Object.assign(new DocFileInfo(), { id: 'test-doc', name: '测试', content })
  const service = new AiContextService({ getDocFileInfo: async id => ({ ...file, id }),
    renderMd: doc => render.render(doc.content, doc.id, [], []),
  }, browserDomParser)
  return { service, file, render }
}

describe('site document section extraction', () => {
  it('reuses real anchors and preserves code indentation and table cell boundaries', async () => {
    const { service, file, render } = setup('# 重复\n文本\n\n```python\nif True:\n    print("yes")\n```\n\n# 重复\n\n| A | B |\n|---|---|\n| one | two |')
    const doc = await service.load(file.id)
    const headings = Array.from(browserDomParser.parse(render.render(file.content, file.id, [], [])).querySelectorAll('h2')).map(node => node.id)
    expect(doc.sources.map(source => source.headingId)).toEqual(headings)
    expect(headings[0]).not.toBe(headings[1])
    expect(doc.sources[0].text).toContain('if True:\n    print("yes")')
    expect(doc.sources[1].text).toContain('one\ttwo')
    expect(doc.sources[0].text).not.toContain('复制')
  })

  it('keeps the introduction as a section and leaves context selection to the bridge', async () => {
    const doc = await setup('文档简介\n\n# 第一节\n正文一\n\n# 第二节\n正文二').service.load('test-doc')
    expect(doc.sources).toHaveLength(3)
    expect(doc.sources[0].headingId).toBe('')
    expect(doc.sources[0].text).toContain('文档简介')
    expect(doc.sources[1].text).toContain('正文一')
    expect(doc.sources[2].text).toContain('正文二')
    expect(doc.headings.map(heading => heading.id)).toEqual(doc.sources.slice(1).map(source => source.headingId))
    expect(doc.url).toBe('/test/doc.html')
  })

  it('publishes complete long documents and all sections without an agent context budget', async () => {
    const text = '正文🙂'.repeat(100000)
    const doc = await setup('# 大文档\n' + text).service.load('large')
    expect(doc.sources[0].text).toContain(text)
    const many = await setup(Array.from({ length: 300 }, () => '# a\nb').join('\n')).service.load('many')
    expect(many.sources).toHaveLength(300)
    expect(many.headings).toHaveLength(300)
  })

  it('omits executable markup, toolbar text and empty sources while retaining image descriptions', async () => {
    const doc = await setup('# 章节\n\n<script>secret()</script>\n\n<style>.hidden {}</style>\n\n![图片描述](./image.png)').service.load('example')
    expect(doc.sources).toHaveLength(1)
    expect(doc.sources[0].text).toContain('图片描述')
    expect(doc.sources[0].text).not.toContain('secret')
    expect(doc.sources[0].text).not.toContain('hidden')
    expect((await setup('').service.load('empty')).sources).toEqual([])
  })
})

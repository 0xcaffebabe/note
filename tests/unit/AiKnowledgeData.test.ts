import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildKnowledgeData } from '@/platform/node/build/AiKnowledgeData'
import { DocContentService } from '@/core/service/DocContentService'
import DocRender from '@/core/render/DocRender'
import { nodeMarkdown } from '@/adapters/node/NodeMarkdownAdapter'
import { nodeDomParser } from '@/adapters/node/NodeDomParser'
import type Category from '@/core/domain/Category'
import type ClusterNode from '@/core/domain/ClusterNode'
import { KnowledgeClient } from '../../note-bridge/agent/src/knowledge'

const content = new DocContentService(nodeMarkdown, nodeDomParser)
const a = '目录-正文'
const b = '目录-关联'
const markdown = '# 相同标题\n\n正文🙂\n\n# 相同标题\n\n```ts\n  const a = 1\n```\n\n## 关联内容（自动生成）\n\n- [关联](./目录/关联.md)\n'
const input = (body = markdown) => ({
  categories: [{
    name: '目录',
    link: '',
    chidren: [
      { name: '正文', link: './目录/正文.md', chidren: [] },
      { name: '关联', link: './目录/关联.md', chidren: [] },
    ],
  }] as Category[],
  files: [
    content.buildFileInfo('doc/目录/正文.md', body, []),
    content.buildFileInfo('doc/目录/关联.md', '# 关联\n\n另一个正文', []),
  ],
  graph: [{
    id: a,
    links: [
      { id: b, name: '关联' },
      { id: 'absent', name: 'not published' },
    ],
  }],
  clusters: [{
    name: '',
    children: [
      { name: 'doc/目录/正文.md', children: [] },
      { name: 'doc/目录/关联.md', children: [] },
    ],
  }] as ClusterNode[],
})

describe('site-owned versioned AI data', () => {
  it('publishes deterministic hashes, original heading anchors and render-compatible sections', async () => {
    const first = await buildKnowledgeData(input())
    const second = await buildKnowledgeData(input())
    expect(first.manifest).toEqual(second.manifest)
    expect([...first.assets]).toEqual([...second.assets])
    expect([...first.assets.keys()].at(-1)).toBe('/ai/manifest.json')
    for (const [path, body] of first.assets) {
      if (path === '/ai/manifest.json') {
        continue
      }
      expect(path).toBe(`/ai/objects/${createHash('sha256').update(body).digest('hex')}.json`)
    }
    const catalog = JSON.parse(first.assets.get(first.manifest.resources.catalog.path)!)
    const doc = JSON.parse(first.assets.get(catalog.documents[0].resource.path)!)
    const rendered = nodeDomParser.parse(new DocRender(nodeMarkdown, nodeDomParser).render(markdown, a, [], []))
    const expected = [...rendered.querySelectorAll('h1,h2,h3,h4,h5,h6')].slice(0, 2).map(heading => heading.id)
    expect(doc.headings.map((heading: { id: string }) => heading.id)).toEqual(expected)
    expect(new Set(expected).size).toBe(2)
    expect(doc.sections[1].text).toContain('  const a = 1')
    expect(doc.sections.map((section: { text: string }) => section.text).join('')).not.toContain('自动生成')
    expect(catalog.documents[0].url).toBe('/%E7%9B%AE%E5%BD%95/%E6%AD%A3%E6%96%87.html')
  })

  it('changes revision and only affected document resources when content changes', async () => {
    const before = await buildKnowledgeData(input())
    const after = await buildKnowledgeData(input(markdown.replace('正文🙂', '正文🙂 新增内容')))
    expect(after.manifest.revision).not.toBe(before.manifest.revision)
    expect(after.manifest.resources.catalog.sha256).not.toBe(before.manifest.resources.catalog.sha256)
    expect(after.manifest.resources.graph).toEqual(before.manifest.resources.graph)
    const oldCatalog = JSON.parse(before.assets.get(before.manifest.resources.catalog.path)!)
    const newCatalog = JSON.parse(after.assets.get(after.manifest.resources.catalog.path)!)
    expect(newCatalog.documents[1].resource).toEqual(oldCatalog.documents[1].resource)
  })

  it('is consumable by the independently released bridge without downloading all document bodies', async () => {
    const publication = await buildKnowledgeData(input())
    const requested: string[] = []
    const fetcher: typeof fetch = async target => {
      const path = new URL(String(target)).pathname
      requested.push(path)
      return new Response(publication.assets.get(path) || '', {
        status: publication.assets.has(path) ? 200 : 404,
      })
    }
    const snapshot = await new KnowledgeClient('https://example.test', { fetch: fetcher }).pin()
    expect(requested).toEqual(['/ai/manifest.json', publication.manifest.resources.catalog.path])
    const toc = await snapshot.execute('get_toc', { docId: a })
    expect(toc.sources?.[0].revision).toBe(publication.manifest.revision)
    const text = await snapshot.execute('get_document', { docId: a, section: 1 })
    expect(text.data.text).toContain('  const a = 1')
    expect(text.sources?.[0].sourceId).toBe(toc.sources?.[1].sourceId)
    const network = await snapshot.execute('get_knowledge_network', {})
    expect(network.data.edges).toEqual([{ from: a, to: b, title: '关联' }])
    const related = await snapshot.execute('get_related_documents', { docId: a })
    expect((related.data.documents as { docId: string }[]).map(doc => doc.docId)).toEqual([b])
  })
})

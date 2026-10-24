import { createHash } from 'node:crypto'
import type Category from '../../../core/domain/Category'
import type ClusterNode from '../../../core/domain/ClusterNode'
import type DocFileInfo from '../../../core/domain/DocFileInfo'
import type { KnowledgeNode } from '../../../core/domain/KnowledgeNode'
import { AiContextService } from '../../../core/service/AiContextService'
import { extractRelatedContent } from '../../../core/service/doc/DocRenderService'
import DocRender from '../../../core/render/DocRender'
import DocUtils from '../../../core/util/DocUtils'
import { safeTextPrefix } from '../../../core/util/StringUtils'
import { nodeMarkdown } from '../../../adapters/node/NodeMarkdownAdapter'
import { nodeDomParser } from '../../../adapters/node/NodeDomParser'

export interface KnowledgeResource { path: string; sha256: string; bytes: number }
export interface PublishedSearch {
  type: 'algolia'; applicationId: string; indexName: string; searchOnlyApiKey: string; revisionConsistency: 'live'
}
export interface KnowledgeManifest {
  schemaVersion: 1
  knowledgeBaseId: string
  revision: string
  capabilities: string[]
  resources: { catalog: KnowledgeResource; graph: KnowledgeResource; clusters: KnowledgeResource }
  search?: PublishedSearch
}
export interface KnowledgeBuildInput {
  categories: Category[]
  files: DocFileInfo[]
  graph: KnowledgeNode[]
  clusters: ClusterNode[]
  knowledgeBaseId?: string
  search?: PublishedSearch
}

const sha256 = (bytes: string) => createHash('sha256').update(bytes).digest('hex')

/** Builds only site assets. Bridge consumes the published schema without importing site code. */
export async function buildKnowledgeData(input: KnowledgeBuildInput): Promise<{ manifest: KnowledgeManifest; assets: Map<string, string> }> {
  const assets = new Map<string, string>()
  const put = (value: unknown): KnowledgeResource => {
    const body = JSON.stringify(value)
    const hash = sha256(body)
    if (Buffer.byteLength(body) > 16 * 1024 * 1024) throw new Error('AI knowledge resource exceeds 16 MiB')
    const resource = { path: `/ai/objects/${hash}.json`, sha256: hash, bytes: Buffer.byteLength(body) }
    assets.set(resource.path, body)
    return resource
  }
  const files = new Map(input.files.map(file => [file.id, file]))
  const entries = new Map<string, { docId: string; title: string; url: string; category: string }>()
  const visit = (categories: Category[]) => {
    for (const category of categories) {
      if (category.link && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(category.link)) {
        const id = DocUtils.docUrl2Id(category.link)
        if (files.has(id)) {
          const parts = DocUtils.docId2Segments(id)
          entries.set(id, { docId: id, title: safeTextPrefix(category.name || parts.at(-1) || id, 200),
            url: DocUtils.docId2HtmlPath(id).split('/').map(encodeURIComponent).join('/'),
            category: parts.length > 1 ? parts[0] : '(root)' })
        }
      }
      visit(category.chidren || [])
    }
  }
  visit(input.categories)
  const renderer = new DocRender(nodeMarkdown, nodeDomParser)
  const context = new AiContextService({
    async getDocFileInfo(id) {
      const file = { ...files.get(id)!, relatedLinks: undefined }
      extractRelatedContent(file)
      return file
    },
    renderMd: file => renderer.render(file.content, file.id, [], []),
  }, nodeDomParser)
  const documents = []
  // Sequential rendering avoids retaining hundreds of live DOMs at once.
  for (const entry of entries.values()) {
    const document = await context.load(entry.docId)
    const resource = put({ schemaVersion: 1, docId: entry.docId, title: entry.title, url: entry.url,
      headings: document.headings, sections: document.sources.map(({ headingId, title, text }) => ({ headingId, title, text })) })
    documents.push({ ...entry, contentHash: `sha256:${resource.sha256}`, resource })
  }
  const catalog = put({ schemaVersion: 1, documents })
  const edges: { from: string; to: string; title: string }[] = []
  const seen = new Set<string>()
  for (const node of input.graph) for (const link of node.links || []) {
    const key = JSON.stringify([node.id, link.id])
    if (!entries.has(node.id) || !entries.has(link.id) || seen.has(key)) continue
    seen.add(key)
    edges.push({ from: node.id, to: link.id, title: safeTextPrefix(link.name, 160) })
  }
  const graph = put({ schemaVersion: 1, edges })
  const related = new Map<string, Set<string>>()
  const walk = (node: ClusterNode, ancestors: ClusterNode[]) => {
    const id = DocUtils.docUrl2Id(node.name)
    if (entries.has(id)) {
      const root = ancestors[Math.max(0, ancestors.length - 3)]
      const values = new Set<string>()
      const collect = (entry: ClusterNode) => {
        const other = DocUtils.docUrl2Id(entry.name)
        if (entries.has(other) && other !== id) values.add(other)
        for (const child of entry.children || []) collect(child)
      }
      if (root) collect(root)
      related.set(id, values)
    }
    for (const child of node.children || []) walk(child, [...ancestors, node])
  }
  for (const root of input.clusters) walk(root, [])
  const clusters = put({ schemaVersion: 1, related: Array.from(related, ([docId, docIds]) => ({ docId, docIds: [...docIds] })) })
  const content = { schemaVersion: 1 as const, knowledgeBaseId: input.knowledgeBaseId || 'note',
    capabilities: ['catalog', 'document', 'toc', 'graph', 'related', ...(input.search ? ['search'] : [])],
    resources: { catalog, graph, clusters }, ...(input.search ? { search: input.search } : {}) }
  const manifest: KnowledgeManifest = { ...content, revision: sha256(JSON.stringify(content)) }
  assets.set('/ai/manifest.json', JSON.stringify(manifest))
  return { manifest, assets }
}

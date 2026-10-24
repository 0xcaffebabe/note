import type {
  KnowledgeManifest,
  KnowledgePublication,
} from '../../../core/domain/knowledge/KnowledgePublication'
import { AiContextService } from '../../../core/service/AiContextService'
import { KnowledgeDocumentReader } from '../../../adapters/node/KnowledgeDocumentReader'
import { nodeDomParser } from '../../../adapters/node/NodeDomParser'
import type { KnowledgeBuildInput } from './knowledge/KnowledgeBuildInput'
import { ContentAddressedAssets, knowledgeDigest } from './knowledge/ContentAddressedAssets'
import { collectCatalogEntries, publishCatalogDocuments } from './knowledge/KnowledgeCatalog'
import { collectKnowledgeEdges, collectRelatedDocuments } from './knowledge/KnowledgeRelations'

export type {
  KnowledgeManifest,
  KnowledgeResource,
  PublishedSearch,
} from '../../../core/domain/knowledge/KnowledgePublication'
export type { KnowledgeBuildInput } from './knowledge/KnowledgeBuildInput'

/**
 * 组装一次站点知识快照：正文、目录、知识链接和聚类各自投影后统一内容寻址。
 * 本函数只生成发布资产，不写文件。Bridge 依赖发布后的版本化 JSON 契约独立运行。
 */
export async function buildKnowledgeData(input: KnowledgeBuildInput): Promise<KnowledgePublication> {
  const resources = new ContentAddressedAssets()
  const files = new Map(input.files.map(file => [file.id, file]))
  const entries = collectCatalogEntries(input.categories, files)
  const context = new AiContextService(new KnowledgeDocumentReader(files), nodeDomParser)

  const documents = await publishCatalogDocuments(entries, context, resources)
  const catalog = resources.put({ schemaVersion: 1, documents })
  const publishedIds = new Set(entries.keys())
  const edges = collectKnowledgeEdges(input.graph, publishedIds)
  const graph = resources.put({ schemaVersion: 1, edges })
  const related = collectRelatedDocuments(input.clusters, publishedIds)
  const clusters = resources.put({ schemaVersion: 1, related })

  const content = {
    schemaVersion: 1 as const,
    knowledgeBaseId: input.knowledgeBaseId || 'note',
    capabilities: ['catalog', 'document', 'toc', 'graph', 'related', ...(input.search ? ['search'] : [])],
    resources: { catalog, graph, clusters },
    ...(input.search ? { search: input.search } : {}),
  }
  const manifest: KnowledgeManifest = {
    ...content,
    revision: knowledgeDigest(JSON.stringify(content)),
  }

  // Map 保留插入顺序，发布器会先写入不可变资源，再切换 manifest。
  resources.assets.set('/ai/manifest.json', JSON.stringify(manifest))
  return { manifest, assets: resources.assets }
}

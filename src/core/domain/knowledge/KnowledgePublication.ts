/** 不可变 JSON 资源的内容地址、摘要和 UTF-8 字节数。 */
export interface KnowledgeResource {
  path: string
  sha256: string
  bytes: number
}

/** 站点公开的只读搜索配置；索引实时更新，不保证与静态快照同步。 */
export interface PublishedSearch {
  type: 'algolia'
  applicationId: string
  indexName: string
  searchOnlyApiKey: string
  revisionConsistency: 'live'
}

/**
 * 站点发布的知识快照入口。schemaVersion 表示协议，revision 表示内容版本。
 * Bridge 通过此 JSON 契约消费数据，不依赖站点代码或同步发布。
 */
export interface KnowledgeManifest {
  schemaVersion: 1
  knowledgeBaseId: string
  revision: string
  capabilities: string[]
  resources: {
    catalog: KnowledgeResource
    graph: KnowledgeResource
    clusters: KnowledgeResource
  }
  search?: PublishedSearch
}

/** 分类目录中可以发布、且有对应 Markdown 文件的文档条目。 */
export interface KnowledgeCatalogEntry {
  docId: string
  title: string
  url: string
  category: string
}

/** 目录条目及其内容资源；资源摘要变化时目录自身的摘要也随之变化。 */
export interface PublishedCatalogDocument extends KnowledgeCatalogEntry {
  contentHash: string
  resource: KnowledgeResource
}

/** 已发布文档之间的有向知识链接。 */
export interface PublishedKnowledgeEdge {
  from: string
  to: string
  title: string
}

/** 根据站点聚类结果提取的文档邻居，顺序沿用聚类遍历顺序。 */
export interface PublishedRelatedDocuments {
  docId: string
  docIds: string[]
}

/** 一次完整构建的产物；assets 最后一项是切换快照的 manifest。 */
export interface KnowledgePublication {
  manifest: KnowledgeManifest
  assets: Map<string, string>
}

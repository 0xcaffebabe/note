import type Category from '../../../../core/domain/Category'
import type ClusterNode from '../../../../core/domain/ClusterNode'
import type DocFileInfo from '../../../../core/domain/DocFileInfo'
import type { KnowledgeNode } from '../../../../core/domain/KnowledgeNode'
import type { PublishedSearch } from '../../../../core/domain/knowledge/KnowledgePublication'

/** 站点构建阶段提供的静态数据；来源加载与资源序列化分别负责，不引入 Bridge 状态。 */
export interface KnowledgeBuildInput {
  categories: Category[]
  files: DocFileInfo[]
  graph: KnowledgeNode[]
  clusters: ClusterNode[]
  knowledgeBaseId?: string
  search?: PublishedSearch
}

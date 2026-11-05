import type ClusterNode from '../../../../core/domain/ClusterNode'
import type { KnowledgeNode } from '../../../../core/domain/KnowledgeNode'
import type {
  PublishedKnowledgeEdge,
  PublishedRelatedDocuments,
} from '../../../../core/domain/knowledge/KnowledgePublication'
import DocUtils from '../../../../core/util/DocUtils'
import { safeTextPrefix } from '../../../../core/util/StringUtils'

/** 仅发布目录内文档之间的有向边，按来源顺序去重并限制链接标题长度。 */
export function collectKnowledgeEdges(
  graph: KnowledgeNode[],
  publishedIds: ReadonlySet<string>,
): PublishedKnowledgeEdge[] {
  const edges: PublishedKnowledgeEdge[] = []
  const seen = new Set<string>()

  for (const node of graph) {
    for (const link of node.links || []) {
      const key = JSON.stringify([node.id, link.id])
      if (!publishedIds.has(node.id) || !publishedIds.has(link.id) || seen.has(key)) {
        continue
      }
      seen.add(key)
      edges.push({
        from: node.id,
        to: link.id,
        title: safeTextPrefix(link.name, 160),
      })
    }
  }
  return edges
}

/**
 * 将站点聚类树投影为文档邻居列表，沿用最近三层祖先子树的选取规则。
 * 邻居只包含已经发布的其他文档，遍历顺序和重复节点覆盖语义保持与站点数据一致。
 */
export function collectRelatedDocuments(
  clusters: ClusterNode[],
  publishedIds: ReadonlySet<string>,
): PublishedRelatedDocuments[] {
  const related = new Map<string, Set<string>>()

  function collectNeighbors(root: ClusterNode, docId: string, neighbors: Set<string>): void {
    const other = DocUtils.docUrl2Id(root.name)
    if (publishedIds.has(other) && other !== docId) {
      neighbors.add(other)
    }
    for (const child of root.children || []) {
      collectNeighbors(child, docId, neighbors)
    }
  }

  function visit(node: ClusterNode, ancestors: ClusterNode[]): void {
    const id = DocUtils.docUrl2Id(node.name)
    if (publishedIds.has(id)) {
      const root = ancestors[Math.max(0, ancestors.length - 3)]
      const neighbors = new Set<string>()
      if (root) {
        collectNeighbors(root, id, neighbors)
      }
      related.set(id, neighbors)
    }

    for (const child of node.children || []) {
      visit(child, [...ancestors, node])
    }
  }

  for (const root of clusters) {
    visit(root, [])
  }
  return Array.from(related, ([docId, docIds]) => ({
    docId,
    docIds: [...docIds],
  }))
}


export interface KnowledgeLinkNode {
  id: string
  headingId?: string
}

/**
 * 知识图谱节点
 *
 * @export
 * @interface KnowledgeNode
 */
export interface KnowledgeNode {
  id: string
  links?: KnowledgeLinkNode[]
}
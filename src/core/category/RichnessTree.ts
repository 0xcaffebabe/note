import Category from '../domain/Category'
import KnowledgeRichnessNode from '../domain/KnowledgeRichnessNode'

// 由目录树(Category)搭建"知识丰富度"骨架(平台无关, 纯函数, 不碰 fs)。
// 提取自 build/DocService.generateKnwoledgeRichness: 结构搭建与"待读路径"枚举是纯逻辑,
// 真正读文件按 link 取正文长度填 size 留给驱动层(经 FileSystem 端口)。

/** 一个待回填 size 的请求: 给定 node 与它对应的正文文件路径。 */
export interface RichnessSizeRequest {
  node: KnowledgeRichnessNode
  /** 正文文件路径 './doc/' + decodeURI(link.substring(2)) */
  path: string
}

/**
 * 把目录树映射为 KnowledgeRichnessNode 树(只搭结构、不填 size), 同时枚举需要读正文回填 size 的节点。
 *
 * ⚠️ 关键控制流(逐字保持原行为, 影响 knowledgeRichness.json 字节):
 *  - `if (value.chidren)` 守卫整体(原 Category.chidren 恒为已初始化数组, 守卫恒真, 仍保留);
 *  - "无 link 早返回"必须位于"子节点递归之后、size 请求之前"——即 link 为空的节点
 *    子树照常递归, 但跳过自身 size 读取(size 保持 0), 决不能把早返回提到子循环之前;
 *  - 仅对 link 非空的节点产出 size 请求, 路径 = './doc/' + decodeURI(link.substring(2))。
 */
export function buildRichnessTree(categories: Category[]): {
  roots: KnowledgeRichnessNode[]
  reads: RichnessSizeRequest[]
} {
  const reads: RichnessSizeRequest[] = []
  function toNode(value: Category): KnowledgeRichnessNode {
    const node = new KnowledgeRichnessNode()
    node.link = value.link
    node.name = value.name
    if (value.chidren) {
      for (const i of value.chidren) {
        node.chidren.push(toNode(i))
      }
      if (!node.link) {
        return node
      }
      reads.push({ node, path: './doc/' + decodeURI(node.link.substring(2)) })
    }
    return node
  }
  const roots = categories.map(toNode)
  return { roots, reads }
}

import { KnowledgeNode, KnowledgeLinkNode } from '../domain/KnowledgeNode'

/**
 * 知识网络图论算法(纯逻辑, 零框架/服务依赖)。
 * 从 KnowledgeNetworkDataProcessor 抽出, 供运行期处理器委托, 可独立单测。
 */

/**
 * 统计每个文档的内/外链度数。提取自 build/DocService.generateDocQualityData。
 * ⚠️ 已知 BUG(逐字保留, 不在本次修): inLinks 与 outLinks 实际都等于 node.links.length——
 *    outLinks 在 `for child of node.links` 里对 node.id 自增(应是对 child.id 累加真入度),
 *    导致真入度从未被统计。修复属行为变更(改 docQuality.json), 须独立 PR。
 */
export function countLinkDegrees(nodes: KnowledgeNode[]): {
  inLinks: Map<string, number>
  outLinks: Map<string, number>
} {
  const outLinks = new Map<string, number>()
  const inLinks = new Map<string, number>()
  for (let node of nodes) {
    if (!inLinks.has(node.id)) {
      inLinks.set(node.id, node.links?.length || 0)
    }
    for (let child of node.links || []) {
      outLinks.set(node.id, 1 + (outLinks.get(node.id) || 0))
    }
  }
  return { inLinks, outLinks }
}

/**
 * 把一批知识节点的所有链接按 name 建索引(后写覆盖先写, 保持迭代顺序)。
 * 提取自 build/DocService.generatePotentialKnowledgeNetwork 的 kwNodeMap 构建。
 */
export function buildLinkNameMap(nodes: KnowledgeNode[]): Map<string, KnowledgeLinkNode> {
  const linkList = nodes.map(v => v.links).flatMap(v => v)
  const map = new Map<string, KnowledgeLinkNode>()
  for (let i of linkList) {
    map.set(i?.name!, i!)
  }
  return map
}

/**
 * 按"度数"(到当前文档的 BFS 跳数)过滤知识网络, 保留连通性。
 * degree<0 返回空。无向图: 建邻接表时双向加边。
 */
export function filterByDegree(knowledgeNetwork: KnowledgeNode[], docId: string, degree: number): KnowledgeNode[] {
  if (degree < 0) return []

  const adjacencyMap = new Map<string, Set<string>>()
  const nodeMap = new Map<string, KnowledgeNode>()

  knowledgeNetwork.forEach(node => {
    nodeMap.set(node.id, node)
    if (!adjacencyMap.has(node.id)) {
      adjacencyMap.set(node.id, new Set<string>())
    }
    if (node.links) {
      node.links.forEach(link => {
        adjacencyMap.get(node.id)!.add(link.id)
        if (!adjacencyMap.has(link.id)) {
          adjacencyMap.set(link.id, new Set<string>())
        }
        adjacencyMap.get(link.id)!.add(node.id)
      })
    }
  })

  const visited = new Set<string>()
  const queue: { nodeId: string, currentDegree: number }[] = [{ nodeId: docId, currentDegree: 0 }]
  visited.add(docId)

  const resultNodes = new Set<string>()
  resultNodes.add(docId)

  while (queue.length > 0) {
    const { nodeId, currentDegree } = queue.shift()!
    if (currentDegree === degree) {
      resultNodes.add(nodeId)
      continue
    }
    if (currentDegree > degree) {
      continue
    }
    const neighbors = adjacencyMap.get(nodeId) || new Set<string>()
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId)
        queue.push({ nodeId: neighborId, currentDegree: currentDegree + 1 })
        if (currentDegree < degree) {
          resultNodes.add(neighborId)
        }
      }
    }
  }

  const result: KnowledgeNode[] = []
  for (const id of resultNodes) {
    const originalNode = nodeMap.get(id)
    if (originalNode) {
      const filteredLinks = originalNode.links?.filter(link => resultNodes.has(link.id)) || []
      result.push({ ...originalNode, links: filteredLinks })
    }
  }
  return result
}

/** 由知识网络生成无向去重的边数组(echarts graph 用)。 */
export function createLinks(knowledgeNetwork: KnowledgeNode[]): any[] {
  const links: any[] = []
  const addedEdges = new Set<string>()
  for (const node of knowledgeNetwork) {
    if (node.links) {
      for (const link of node.links) {
        const edgeKey = [node.id, link.id].sort().join('-')
        if (!addedEdges.has(edgeKey)) {
          links.push({
            target: node.id,
            source: link.id,
            value: decodeURI(link.headingId ? '#' + link.headingId : '-'),
          })
          addedEdges.add(edgeKey)
        }
      }
    }
  }
  return links
}

/** 节点名 → 索引 的映射。 */
export function buildNodeMap(nodes: any[]): Map<string, number> {
  return new Map(nodes.map((node, index) => [node.name, index]))
}

/** 只保留与当前文档直接相连的隐式网络(注意: 会就地修改入参节点的 links, 与原实现一致)。 */
export function filterByCurrentDoc(knowledgeNetwork: KnowledgeNode[], docId: string): KnowledgeNode[] {
  return knowledgeNetwork
    .filter(node => node.id === docId || node.links?.find(link => link.id === docId))
    .map(node => {
      if (node.id !== docId) {
        node.links = node.links?.filter(link => link.id === docId)
      }
      return node
    })
}

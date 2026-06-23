import ClusterNode from '../domain/ClusterNode'

// 凝聚式层次聚类(平台无关): 每轮取队首簇, 与其平均相似度最高的簇合并, 直到只剩一棵树。
// 相似度由调用方注入(similar(file1, file2)), 本模块只管合并逻辑——任何运行时只要能给出
// 文档两两相似度即可复用。驱动层(build/generateDocCluster)负责向量化并提供 similar。
//
// 注: 直接在传入的 nodes 数组上原地合并(shift/push/splice), 返回同一数组(最终长度为 1),
// 与原内联实现逐操作一致, 保证 docCluster.json 字节不变。
export function agglomerativeCluster(
  cluster: ClusterNode[],
  similar: (file1: string, file2: string) => number,
): ClusterNode[] {
  const similarCache = new Map<string, number>()
  // 凝聚式层次聚类: 每轮取队首簇, 与其平均相似度最高的簇合并
  while (cluster.length > 1) {

      const cluster1 = cluster.shift()
      if (!cluster1) {
        continue
      }

      // 选出与 cluster1 平均相似度最大的簇; 用 -Infinity 起始确保即便最高相似度为 0
      // 也能选中一个伙伴合并, 从而 cluster1 永不被静默丢弃(修复丢节点 Bug)
      let maxSim = -Infinity
      let simIndex = -1
      for(let j = 0; j < cluster.length;j++) {
        const cluster2 = cluster[j]
        let totalSim = 0
        let cnt = 0
        for(const file1 of cluster1.all()) {
          for(const file2 of cluster2.all()) {
            const key = file1 + "-" + file2
            const key1 = file2 + "-" + file1
            if (similarCache.has(key) || similarCache.has(key1)) {
              totalSim += similarCache.get(key)! || similarCache.get(key1)!
            }else {
              const value = similar(file1, file2)
              similarCache.set(key, value)
              similarCache.set(key1, value)
              totalSim += value
            }
            cnt++
          }
        }
        if (cnt != 0) {
          const sim = totalSim / cnt
          if (sim > maxSim) {
            maxSim = sim
            simIndex = j
          }
        }
      }

      if (simIndex != -1) {
        const newCluster = new ClusterNode()
        newCluster.children = [cluster1,cluster[simIndex]]
        cluster.push(newCluster)
        cluster.splice(simIndex, 1)
      } else {
        // 兜底(理论不可达, 因为 cluster.length>=1 时必有候选): 强制与首簇合并,
        // 保证循环收敛且不丢节点
        const merged = new ClusterNode()
        merged.children = [cluster1, cluster[0]]
        cluster.push(merged)
        cluster.splice(0, 1)
      }
    }
  return cluster
}

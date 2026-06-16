// 散点聚类图的单个文档点
export interface ClusterScatterPoint {
  id: string          // docUrl2Id 后的文档 id, 供跳转
  name: string        // 原始文件路径(前端 displayName 截取文件名)
  x: number           // 2D MDS 投影坐标
  y: number
  x3: number          // 3D MDS 投影坐标
  y3: number
  z3: number
  cluster: number     // K-means 簇标签
  tags: string[]      // frontmatter tags, 供 tooltip
  size: number        // 点径编码(正文长度归一)
}

// 簇元信息, 供图例
export interface ClusterMeta {
  id: number
  label: string       // 簇主 tag(自动命名), 无则 "簇 N"
  size: number        // 成员数
}

export interface ClusterScatter {
  points: ClusterScatterPoint[]
  clusters: ClusterMeta[]
}

export default ClusterScatter

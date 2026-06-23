import { l2normalize, dot } from './clusterMath'
import { mdsND, scaleCoords, scaleRadiusND } from './MDS'
import DocUtils from '../util/DocUtils'
import { ClusterScatterPoint, ClusterMeta } from '../domain/ClusterScatterPoint'

// 散点聚类图的"簇感知两级布局"(平台无关, 纯线性代数)。与已下沉的 WordCloudLayout /
// KnowledgeGraphLayout 同档: 给定已 L2 归一化的文档向量 X、K-means 簇标签 labels、簇数 K,
// 产出每个文档点的低维坐标——上游负责向量化/聚类(jieba/IDF/kmeans 等带 IO 或随机种子的部分),
// 本模块只做确定性的几何布局与点塑形, 零端口、零库。
//
// 为什么两级: 全局 MDS 易把高维文本压成一团(维度灾难), 故先对"簇心"做 MDS 定锚点(簇间相似 ->
// 锚点相近), 再在簇内做 MDS 定局部偏移。labels 必须由上游传入——本模块绝不重算 kmeans(否则会
// 二次引入随机种子, 破坏构建可复现)。

/**
 * 簇感知两级布局: 对每个请求维度 dims, 返回 [n][dims] 坐标。
 * 簇心/簇间&簇内距离矩阵只计算一次, 在所有维度间共享(与原始 driver 计算顺序一致, 字节等价)。
 *
 * @param X        已 L2 归一化的文档向量 [n][dim]
 * @param labels   每个文档的 K-means 簇标签(长度 n)
 * @param K        簇数
 * @param dimsList 需要的输出维度列表(如 [2, 3])
 * @returns        与 dimsList 平行的坐标数组, 第 t 项为 [n][dimsList[t]]
 */
export function layoutClusters(X: number[][], labels: number[], K: number, dimsList: number[]): number[][][] {
  const n = X.length
  if (n === 0) {
    return dimsList.map(() => [])
  }
  const dim = X[0].length

  // 簇成员索引
  const members: number[][] = Array.from({ length: K }, () => [])
  for (let i = 0; i < n; i++) members[labels[i]].push(i)

  // 簇心(归一化)
  const centroids: number[][] = Array.from({ length: K }, () => new Array(dim).fill(0))
  for (let i = 0; i < n; i++) {
    const cc = centroids[labels[i]]
    const xi = X[i]
    for (let d = 0; d < dim; d++) cc[d] += xi[d]
  }
  for (let c = 0; c < K; c++) {
    if (members[c].length === 0) continue
    const cc = centroids[c]
    for (let d = 0; d < dim; d++) cc[d] /= members[c].length
  }
  const Cn = centroids.map(l2normalize)

  // 簇心距离矩阵(锚点布局共用)
  const Dc: number[][] = Array.from({ length: K }, () => new Array(K).fill(0))
  for (let a = 0; a < K; a++) {
    for (let b = a + 1; b < K; b++) {
      const v = Math.max(0, 2 * (1 - dot(Cn[a], Cn[b])))
      Dc[a][b] = v
      Dc[b][a] = v
    }
  }

  // 簇内距离矩阵缓存(各维布局共用, 只算一次)
  const clusterDist = members.map((idxs) => {
    const m = idxs.length
    const Dm: number[][] = Array.from({ length: m }, () => new Array(m).fill(0))
    for (let a = 0; a < m; a++) {
      for (let b = a + 1; b < m; b++) {
        const v = Math.max(0, 2 * (1 - dot(X[idxs[a]], X[idxs[b]])))
        Dm[a][b] = v
        Dm[b][a] = v
      }
    }
    return Dm
  })

  // 单维布局(dims 维): 锚点(簇心 MDS) + 局部偏移(簇内 MDS), 返回 [n][dims]
  const layout = (dims: number): number[][] => {
    const anchor = mdsND(Dc, K, dims).map(scaleCoords) // [dims][K]
    const out: number[][] = Array.from({ length: n }, () => new Array(dims).fill(0))
    for (let c = 0; c < K; c++) {
      const idxs = members[c]
      const m = idxs.length
      if (m === 0) continue
      if (m === 1) {
        for (let d = 0; d < dims; d++) out[idxs[0]][d] = anchor[d][c]
        continue
      }
      const lm = mdsND(clusterDist[c], m, dims) // [dims][m]
      // 簇径随成员数增长, 但远小于锚点间距以保持簇间分离
      const R = 8 + 1.5 * Math.sqrt(m)
      const local = scaleRadiusND(lm, R)
      for (let a = 0; a < m; a++) {
        for (let d = 0; d < dims; d++) out[idxs[a]][d] = anchor[d][c] + local[d][a]
      }
    }
    return out
  }

  return dimsList.map(layout)
}

/**
 * 由布局坐标 + 点元数据组装散点(纯塑形)。size 由正文长度在全体 [minL, maxL] 上归一编码。
 * fs 读取、frontmatter tags 抽取、cleanText 长度计算等带 IO/库的部分由 driver 备好后喂入。
 *
 * @param files   文件路径(原始, 前端按 name 截文件名显示)
 * @param coords2 2D 坐标 [n][2]
 * @param coords3 3D 坐标 [n][3]
 * @param labels  K-means 簇标签
 * @param tags    每个文档的 frontmatter tags
 * @param lens    每个文档的正文长度(cleanText 后)
 */
export function assembleScatterPoints(
  files: string[],
  coords2: number[][],
  coords3: number[][],
  labels: number[],
  tags: string[][],
  lens: number[],
): ClusterScatterPoint[] {
  const n = files.length
  let minL = Infinity
  let maxL = -Infinity
  for (const len of lens) {
    if (len < minL) minL = len
    if (len > maxL) maxL = len
  }
  const rangeL = maxL - minL || 1

  const r2 = (v: number) => Math.round(v * 100) / 100
  const points: ClusterScatterPoint[] = []
  for (let i = 0; i < n; i++) {
    points.push({
      id: DocUtils.docUrl2Id(files[i]),
      name: files[i],
      x: r2(coords2[i][0]),
      y: r2(coords2[i][1]),
      x3: r2(coords3[i][0]),
      y3: r2(coords3[i][1]),
      z3: r2(coords3[i][2]),
      cluster: labels[i],
      tags: tags[i],
      size: Math.round((8 + ((lens[i] - minL) / rangeL) * 16) * 10) / 10,
    })
  }
  return points
}

/**
 * 用簇内高频 tag 给每个簇自动命名。提取自 generateClusterScatter(纯数据塑形)。
 * ⚠️ 逐字保持: `cnt > best` 严格大于(平手保留先见者) / `let best=0` 起点 /
 * 默认名 `簇 ${c+1}`(含全角空格) / 空簇走默认名且 size=0。
 */
export function buildClusterMeta(points: ClusterScatterPoint[], K: number): ClusterMeta[] {
  const clusters: ClusterMeta[] = []
  for (let c = 0; c < K; c++) {
    const members = points.filter(p => p.cluster === c)
    const tagCount = new Map<string, number>()
    for (const m of members) {
      for (const t of m.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1)
    }
    let label = `簇 ${c + 1}`
    let best = 0
    for (const [t, cnt] of tagCount.entries()) {
      if (cnt > best) { best = cnt; label = t }
    }
    clusters.push({ id: c, label, size: members.length })
  }
  return clusters
}

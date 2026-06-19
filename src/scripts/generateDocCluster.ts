import BaseService from '../build/BaseService'
import DocService from '../build/DocService'
import fs from 'fs'
import util from 'util'
import yaml from 'js-yaml'
import { cleanText } from '../util/StringUtils';
import ClusterNode from '../dto/ClusterNode';
import DocUtils from '../util/DocUtils'
import ClusterScatter, { ClusterScatterPoint, ClusterMeta } from '../dto/ClusterScatterPoint'
import jieba from 'nodejieba'
import {cloneDeep} from '../util/DataUtils'
import { sim, l2normalize, dot, kmeans, isStopWord as isStopWordPure } from './clusterMath'

const reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");

// 调参常量
const DF_MIN = 2            // 仅出现在 <DF_MIN 篇文档的词视为噪声(无法贡献文档间相似度)
const DF_MAX_RATIO = 0.5    // 出现在 >50% 文档的词视为近似停用词
const TAG_WEIGHT = 3        // 人工标注 tag 词在向量中的额外权重(强语义信号)
const CLUSTER_K = 12        // 散点图 K-means 簇数(着色用)
const KMEANS_SEED = 42      // K-means 种子, 保证构建可复现
const COORD_RANGE = 100     // MDS 坐标缩放到 [-COORD_RANGE, COORD_RANGE]

// 内置兜底停用词(在 cppjieba 停用词表加载失败时使用), 含分词残词
const builtinStopWords = ['的', '是', '在', '一个', '和',
                 '与', '批注', '可以', '使用', '通过', 'md', '据库', '这个', '截图', '没有',
                 '进行', '如果', '需要', '务器', '屏幕', '不会', '就是', '或者', '并且',
                 '其他', '之后', '那么', '什么', '可能', '为了', '第一', '不是', '大小'
                 ]

// 完整停用词集合: cppjieba 自带表(~1500 词) + 内置兜底
const stopWordSet: Set<string> = (() => {
  const set = new Set<string>(builtinStopWords)
  try {
    const p = 'node_modules/nodejieba/submodules/cppjieba/dict/stop_words.utf8'
    const txt = fs.readFileSync(p).toString()
    for (const line of txt.split('\n')) {
      const w = line.trim()
      if (w) set.add(w)
    }
  } catch (e) {
    console.warn('停用词表加载失败, 使用内置列表:', (e as Error).message)
  }
  return set
})()

// 存储 [词, IDF值] 的列表
let wordIdfList: [string, number][] = []
// 每个文件的 tag 分词集合缓存
const tagTokenCache = new Map<string, Set<string>>()

function similar(c1: string, c2: string) {
  const v1 = getDocVec(c1)
  const v2 = getDocVec(c2)
  return sim(v1,v2)
}

const stopFiles = [
  'SUMMARY.md',
  'README.md',
  '书单.md',
  '参考文献.md',
  '技术栈参考.md',
  'leetcode.md',
  '学习计划.md',
  '基于位置的网络社交平台分析与设计.md',
  '全文检索引擎在信息检索中的应用.md',
  'MyBook.md',
  // 根级 AI/工具说明文件: 非知识文档, 否则各成一个孤立分类(overview/AGENTS/CLAUDE)
  'AGENTS.md',
  'CLAUDE.md',
  'overview.md',
]

function stopFileCheck(filename: string) {
  for(const name of stopFiles) {
    if (filename.indexOf(name) != -1) {
      return false
    }
  }
  return true
}

async function main(ret = false): Promise<ClusterNode[]> {
  await getAllWords()
  const files = BaseService.listFilesBySuffix("md", "doc").filter(stopFileCheck)
  const similarCache = new Map<string,number>()
  // 聚类列表
  const cluster: ClusterNode[] = []
  for(const file of files) {
    const node: ClusterNode = new ClusterNode()
    node.name = file
    cluster.push(node)
  }
  // 凝聚式层次聚类: 每轮取队首簇, 与其平均相似度最高的簇合并
  while(cluster.length > 1) {

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
    if (ret) {
      return cluster
    } else {
      fs.writeFileSync("./docCluster.json", JSON.stringify(cluster))
      return []
    }

}

async function generateDocTagPrediction() {
  await getAllWords()
  const tagMapping = await DocService.buildTagMapping()
  const files = BaseService.listFilesBySuffix("md", "doc").filter(stopFileCheck)
  const mapping = new Map<string, [string, number][]>()
  for(const file of files) {
    const vec1 = getDocVec(file)
    mapping.set(file, [])
    for(const tag of tagMapping) {
      let sumDis = 0
      for(const tagFile of tag[1]) {
        sumDis += sim(vec1, getDocVec(tagFile))
      }
      const avgDis = sumDis / tag[1].length
      mapping.get(file)!.push([tag[0], avgDis])
    }
    mapping.get(file)!.sort((b,a) => a[1] - b[1])
    mapping.set(file, mapping.get(file)!.splice(0,10))
  }
  const res = new Map<string, string[]>()
  for(const file of files) {
    res.set(file, mapping.get(file)?.map(v => v[0]) || [])
  }
  return Array.from(res)
}


function isStopWord(word: string): boolean{
  return isStopWordPure(word, stopWordSet)
}

/**
 * 解析某文件 frontmatter 中的 tags, 拆成词集合(整标签 + 标签内分词)
 * tag 是人工标注的强语义信号, 用于在向量中加权
 */
function getTagTokens(file: string, content?: string): Set<string> {
  if (tagTokenCache.has(file)) {
    return tagTokenCache.get(file)!
  }
  const set = new Set<string>()
  try {
    const c = content ?? fs.readFileSync(file).toString()
    const meta = yaml.load(DocService.resolveMetadata(c)) as { tags?: string[] } | undefined
    for (const tag of meta?.tags || []) {
      const t = (tag ?? '').toString().trim()
      if (!t) {
        continue
      }
      // 整个标签作为一个特征词
      if (t.length > 1) {
        set.add(t)
      }
      // 再对标签分词, 兼容多词/短语标签
      for (const w of jieba.cut(t)) {
        if (!isStopWord(w)) {
          set.add(w)
        }
      }
    }
  } catch (e) {
    // 元数据缺失或非法, 忽略
  }
  tagTokenCache.set(file, set)
  return set
}

async function getAllWords() {
  const fileList = BaseService.listAllMdFile()
  const fileCount = fileList.length; // 总文档数
  if (fileCount === 0) {
    console.warn("No files found, IDF will be undefined.");
    wordIdfList = [];
    return;
  }

  const buffers = await Promise.all(fileList.map(f => fs.promises.readFile(f)))

  // 统计包含每个词的文档数(df), 同时收集所有 tag 词强制保留为特征
  const wordDocCount = new Map<string, number>();
  const tagVocab = new Set<string>();

  for (let i = 0; i < buffers.length; i++) {
    const content = buffers[i].toString();
    // 与 getDocVec 同口径: 先 cleanText 再分词
    const words = jieba.cut(cleanText(content));
    const uniqueWordsInDoc = new Set<string>();
    for (const word of words) {
      if (!isStopWord(word)) {
        uniqueWordsInDoc.add(word);
      }
    }
    for (const word of uniqueWordsInDoc) {
      wordDocCount.set(word, (wordDocCount.get(word) || 0) + 1);
    }
    for (const t of getTagTokens(fileList[i], content)) {
      tagVocab.add(t);
    }
  }

  // 词表剪枝 + 平滑 IDF: 去掉只出现一次(噪声)和近乎全局出现(近似停用词)的词,
  // 但 tag 词无条件保留
  const dfMax = Math.max(DF_MIN, Math.floor(fileCount * DF_MAX_RATIO));
  const wordIdfMap = new Map<string, number>();
  for (const [word, df] of wordDocCount.entries()) {
    const isTag = tagVocab.has(word);
    if (!isTag && (df < DF_MIN || df > dfMax)) {
      continue;
    }
    // 平滑 IDF, 避免 df 接近 N 时 IDF 趋零或为负
    wordIdfMap.set(word, Math.log(1 + fileCount / df));
  }
  // tag 词若正文从未出现, 给一个高(但有限)的 IDF, 保证其作为特征生效
  for (const t of tagVocab) {
    if (!wordIdfMap.has(t)) {
      const df = wordDocCount.get(t) || 1;
      wordIdfMap.set(t, Math.log(1 + fileCount / df));
    }
  }

  // 按 IDF 降序排列, 各文档向量共用此顺序对齐
  wordIdfList = Array.from(wordIdfMap.entries())
                    .sort((a, b) => b[1] - a[1]);
}
const vecCache = new Map<string, number[]>()
function getDocVec(file: string): number[] {
  if (vecCache.has(file)) {
    return vecCache.get(file)!
  }
  const content = fs.readFileSync(file).toString()

  // 与 IDF 同口径: 先 cleanText 再分词(修复 TF/IDF 预处理不一致)
  const words = jieba.cut(cleanText(content)).filter(v => !isStopWord(v));

  // 计算文档中每个词的词频 (TF)
  const wordTfMap = new Map<string, number>();
  for (const word of words) {
    wordTfMap.set(word, (wordTfMap.get(word) || 0) + 1);
  }

  const tagTokens = getTagTokens(file, content);

  // 根据 wordIdfList 构建 TF-IDF 向量(次线性 TF + tag 加权)
  const vec: number[] = [];
  for (const [word, idf] of wordIdfList) {
    const tf = wordTfMap.get(word) || 0;
    const isTag = tagTokens.has(word);
    if (tf === 0 && !isTag) {
      vec.push(0);
      continue;
    }
    // 次线性 TF: 1 + log(tf); tag 词即便正文未出现也按 1 次计入
    const tfw = 1 + Math.log(tf > 0 ? tf : 1);
    let v = tfw * idf;
    if (isTag) {
      v *= TAG_WEIGHT;
    }
    vec.push(v);
  }

  vecCache.set(file, vec)
  return vec
}
// 余弦相似度 / L2 归一化 / 点积 / 平方距离 / 确定性 PRNG / K-means 均移至
// ./clusterMath (纯函数, 见顶部 import), 此处不再重复定义。

// ======================= 散点聚类图 =======================
// 位置: 自写经典 MDS(无依赖); 颜色: 自写 K-means; 全程确定性可复现

function matVec(M: number[][], v: number[], n: number): number[] {
  const r = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = 0
    const Mi = M[i]
    for (let j = 0; j < n; j++) s += Mi[j] * v[j]
    r[i] = s
  }
  return r
}

// 幂迭代求对称矩阵最大特征值/特征向量
function powerIteration(B: number[][], n: number): { value: number; vector: number[] } {
  // 确定性初始向量(不用 Math.random, 保证构建可复现)
  let v = l2normalize(Array.from({ length: n }, (_, i) => Math.sin(i + 1)))
  let value = 0
  for (let it = 0; it < 300; it++) {
    const w = matVec(B, v, n)
    let norm = 0
    for (const x of w) norm += x * x
    norm = Math.sqrt(norm)
    if (norm < 1e-12) break
    const nv = w.map(x => x / norm)
    value = dot(nv, matVec(B, nv, n)) // Rayleigh 商
    let diff = 0
    for (let i = 0; i < n; i++) diff += Math.abs(nv[i] - v[i])
    v = nv
    if (diff < 1e-9) break
  }
  return { value, vector: v }
}

// 经典 MDS: 距离平方矩阵 -> k 维坐标(返回 [k][n], 每维一个坐标数组)
function mdsND(D2: number[][], n: number, k: number): number[][] {
  if (n === 0) return Array.from({ length: k }, () => [])
  if (n === 1) return Array.from({ length: k }, () => [0])
  // 双中心化 B = -1/2 J D2 J
  const rowMean = new Array(n).fill(0)
  let grand = 0
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let j = 0; j < n; j++) s += D2[i][j]
    rowMean[i] = s / n
    grand += s
  }
  grand /= n * n
  const B: number[][] = []
  for (let i = 0; i < n; i++) {
    B[i] = new Array(n)
    for (let j = 0; j < n; j++) {
      B[i][j] = -0.5 * (D2[i][j] - rowMean[i] - rowMean[j] + grand)
    }
  }
  // 依次取前 k 大特征向量(幂迭代 + 紧缩); 秩不足时多出的维坐标自然趋零
  const coords: number[][] = []
  for (let d = 0; d < k; d++) {
    const e = powerIteration(B, n)
    const s = Math.sqrt(Math.max(e.value, 0))
    coords.push(e.vector.map(v => v * s))
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) B[i][j] -= e.value * e.vector[i] * e.vector[j]
    }
  }
  return coords
}

// 把坐标线性缩放到 [-COORD_RANGE, COORD_RANGE]
function scaleCoords(a: number[]): number[] {
  let mn = Infinity
  let mx = -Infinity
  for (const v of a) {
    if (v < mn) mn = v
    if (v > mx) mx = v
  }
  const range = mx - mn || 1
  return a.map(v => ((v - mn) / range) * 2 * COORD_RANGE - COORD_RANGE)
}

// 把一组 k 维坐标([k][m])居中并缩放到最大半径 R(用于簇内局部散布)
function scaleRadiusND(coords: number[][], R: number): number[][] {
  const dims = coords.length
  const m = coords[0]?.length || 0
  if (m === 0) return coords
  const center = coords.map(arr => arr.reduce((s, v) => s + v, 0) / m)
  let maxr = 0
  for (let i = 0; i < m; i++) {
    let r = 0
    for (let d = 0; d < dims; d++) {
      const dv = coords[d][i] - center[d]
      r += dv * dv
    }
    r = Math.sqrt(r)
    if (r > maxr) maxr = r
  }
  const s = maxr > 0 ? R / maxr : 0
  return coords.map((arr, d) => arr.map(v => (v - center[d]) * s))
}

// K-means(球面/余弦)已移至 ./clusterMath (纯函数, 见顶部 import)。

// 读取 frontmatter 原始 tags(供 tooltip / 簇命名)
function rawTagsOf(file: string, content?: string): string[] {
  try {
    const c = content ?? fs.readFileSync(file).toString()
    const meta = yaml.load(DocService.resolveMetadata(c)) as { tags?: string[] } | undefined
    return (meta?.tags || []).map(t => (t ?? '').toString().trim()).filter(Boolean)
  } catch (e) {
    return []
  }
}

async function generateClusterScatter(): Promise<ClusterScatter> {
  await getAllWords()
  const files = BaseService.listFilesBySuffix('md', 'doc').filter(stopFileCheck)
  const n = files.length
  if (n === 0) {
    return { points: [], clusters: [] }
  }

  // L2 归一化向量(MDS 与 K-means 共用)
  const X = files.map(f => l2normalize(getDocVec(f)))
  const dim = X[0].length

  // 颜色: K-means(布局依赖簇, 先算)
  const K = Math.min(CLUSTER_K, n)
  const labels = kmeans(X, K, KMEANS_SEED)

  // 簇成员索引
  const members: number[][] = Array.from({ length: K }, () => [])
  for (let i = 0; i < n; i++) members[labels[i]].push(i)

  // --- 簇感知两级布局: 全局 MDS 易把高维文本压成一团(维度灾难), 故
  // 1) 对"簇心"做 MDS 定锚点(簇间相似 -> 锚点相近) 2) 簇内 MDS 定局部偏移 ---
  // 1. 簇心(归一化)
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
  // 簇内距离矩阵缓存(2D/3D 布局共用, 只算一次)
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

  // 簇感知两级布局(dims 维): 锚点(簇心 MDS) + 局部偏移(簇内 MDS), 返回 [n][dims]
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

  const c2 = layout(2)
  const c3 = layout(3)

  // 点元数据(tags + 正文长度用于点径)
  const infos = files.map(f => {
    const content = fs.readFileSync(f).toString()
    return { tags: rawTagsOf(f, content), len: cleanText(content).length }
  })
  let minL = Infinity
  let maxL = -Infinity
  for (const info of infos) {
    if (info.len < minL) minL = info.len
    if (info.len > maxL) maxL = info.len
  }
  const rangeL = maxL - minL || 1

  const r2 = (v: number) => Math.round(v * 100) / 100
  const points: ClusterScatterPoint[] = []
  for (let i = 0; i < n; i++) {
    points.push({
      id: DocUtils.docUrl2Id(files[i]),
      name: files[i],
      x: r2(c2[i][0]),
      y: r2(c2[i][1]),
      x3: r2(c3[i][0]),
      y3: r2(c3[i][1]),
      z3: r2(c3[i][2]),
      cluster: labels[i],
      tags: infos[i].tags,
      size: Math.round((8 + ((infos[i].len - minL) / rangeL) * 16) * 10) / 10,
    })
  }

  // 簇元信息: 用簇内高频 tag 自动命名
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

  return { points, clusters }
}

export default {main, generateDocTagPrediction, generateClusterScatter}

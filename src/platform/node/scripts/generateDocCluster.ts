import BaseService from '../build/BaseService'
import DocService from '../build/DocService'
import fs from 'fs'
import util from 'util'
import { jsYaml } from '../../../adapters/libs/JsYamlAdapter'
import { cleanText } from '../../../core/util/StringUtils';
import ClusterNode from '../../../core/domain/ClusterNode';
import ClusterScatter from '../../../core/domain/ClusterScatterPoint'
import jieba from 'nodejieba'
import {cloneDeep} from '../../../core/util/DataUtils'
import { l2normalize, kmeans, isStopWord as isStopWordPure } from '../../../core/algorithm/clusterMath'
import { builtinJiebaFallbackStopWords } from '../../../core/text/stopWords'
import { layoutClusters, assembleScatterPoints, buildClusterMeta } from '../../../core/algorithm/ClusterScatterLayout'
import { predictTagsByVector } from '../../../core/algorithm/TagPrediction'
import { agglomerativeCluster } from '../../../core/algorithm/HierarchicalCluster'
import {
  buildWordIdfList,
  buildDocVector,
  countTermFrequencies,
  similarity,
  type WordIdfList,
} from '../../../core/algorithm/DocumentVectorizer'

const reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");

// 调参常量(DF_MIN / DF_MAX_RATIO / TAG_WEIGHT 已随 IDF/向量化逻辑移至
// core/algorithm/DocumentVectorizer, 此处不再重复定义)
const CLUSTER_K = 12        // 散点图 K-means 簇数(着色用)
const KMEANS_SEED = 42      // K-means 种子, 保证构建可复现
// COORD_RANGE / 经典 MDS 已随 scaleCoords 下沉 core/algorithm/MDS

// 完整停用词集合: cppjieba 自带表(~1500 词) + 内置兜底(33 词, 已下沉 core/text/stopWords)
const stopWordSet: Set<string> = (() => {
  const set = new Set<string>(builtinJiebaFallbackStopWords)
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

// 存储 [词, IDF值] 的列表(类型与构建均来自 core/DocumentVectorizer)
let wordIdfList: WordIdfList = []
// 每个文件的 tag 分词集合缓存
const tagTokenCache = new Map<string, Set<string>>()

function similar(c1: string, c2: string) {
  const v1 = getDocVec(c1)
  const v2 = getDocVec(c2)
  return similarity(v1, v2)
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
  // 聚类列表
  const cluster: ClusterNode[] = []
  for(const file of files) {
    const node: ClusterNode = new ClusterNode()
    node.name = file
    cluster.push(node)
  }
  // 凝聚式层次聚类下沉至 core/algorithm/HierarchicalCluster; 此处仅注入 similar(向量化相似度)
  agglomerativeCluster(cluster, similar)
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
  // tag -> 成员文档向量(保 tagMapping 迭代序与各 tag 内文件序; getDocVec 已 memoize)
  // 打分聚合(平均余弦相似度 + 排序截断)已下沉 core/algorithm/TagPrediction
  const tagToVecs = new Map<string, number[][]>()
  for (const [tag, tagFiles] of tagMapping) {
    tagToVecs.set(tag, tagFiles.map(getDocVec))
  }
  const res = new Map<string, string[]>()
  for (const file of files) {
    res.set(file, predictTagsByVector(getDocVec(file), tagToVecs))
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
    const meta = jsYaml.load(DocService.resolveMetadata(c)) as { tags?: string[] } | undefined
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

  // 词表剪枝 + 平滑 IDF + 按 IDF 降序排列(纯数学已移至 core/DocumentVectorizer)。
  // wordDocCount / tagVocab 的迭代顺序即上方插入顺序, 函数原样保留, 故输出次序不变。
  wordIdfList = buildWordIdfList(wordDocCount, tagVocab, fileCount);
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
  const wordTfMap = countTermFrequencies(words);

  const tagTokens = getTagTokens(file, content);

  // 根据 wordIdfList 构建 TF-IDF 向量(次线性 TF + tag 加权), 纯数学在 core 完成
  const vec = buildDocVector(wordTfMap, tagTokens, wordIdfList);

  vecCache.set(file, vec)
  return vec
}
// 余弦相似度 / L2 归一化 / 点积 / 平方距离 / 确定性 PRNG / K-means 均移至
// ./clusterMath (纯函数, 见顶部 import), 此处不再重复定义。

// ======================= 散点聚类图 =======================
// 位置: 自写经典 MDS(无依赖); 颜色: 自写 K-means; 全程确定性可复现

// matVec / powerIteration / mdsND / scaleCoords / scaleRadiusND(经典 MDS 线性代数)
// 已下沉 core/algorithm/MDS(平台无关, 见顶部 import); 此处仅在 generateClusterScatter 调用。

// K-means(球面/余弦)已移至 ./clusterMath (纯函数, 见顶部 import)。

// 读取 frontmatter 原始 tags(供 tooltip / 簇命名)
function rawTagsOf(file: string, content?: string): string[] {
  try {
    const c = content ?? fs.readFileSync(file).toString()
    const meta = jsYaml.load(DocService.resolveMetadata(c)) as { tags?: string[] } | undefined
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

  // 颜色: K-means(布局依赖簇, 先算)
  const K = Math.min(CLUSTER_K, n)
  const labels = kmeans(X, K, KMEANS_SEED)

  // 簇感知两级布局(纯几何: 簇心 MDS 定锚点 + 簇内 MDS 定局部偏移)已下沉
  // core/algorithm/ClusterScatterLayout; 此处仅传入向量/簇标签, 2D 先于 3D。
  const [c2, c3] = layoutClusters(X, labels, K, [2, 3])

  // 点元数据(tags + 正文长度用于点径; fs 读取与 frontmatter 解析留 driver)
  const infos = files.map(f => {
    const content = fs.readFileSync(f).toString()
    return { tags: rawTagsOf(f, content), len: cleanText(content).length }
  })
  const points = assembleScatterPoints(files, c2, c3, labels, infos.map(i => i.tags), infos.map(i => i.len))

  // 簇命名(簇内高频 tag)已下沉 core/algorithm/ClusterScatterLayout
  const clusters = buildClusterMeta(points, K)

  return { points, clusters }
}

export default {main, generateDocTagPrediction, generateClusterScatter}

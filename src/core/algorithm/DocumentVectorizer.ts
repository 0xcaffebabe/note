// 文档向量化 / IDF 构建 / 相似度 —— 从 platform/node/scripts/generateDocCluster.ts 抽出的
// "已分词之后" 的确定性纯数学。
//
// 设计约束(与 core 边界一致, 见 tests/unit/CoreBoundary.test.ts):
//   - 本模块不 import 任何 npm 库 / Node 内置 / outer 别名, 不读文件, 不分词。
//   - 分词(nodejieba)与 fs 读取留在驱动层(generateDocCluster.ts); 这里只接收
//     "词 -> 计数" 的映射 / "词 -> IDF" 的列表, 输出 IDF 表 / 向量 / 相似度。
//   - 无模块级可变全局: 原 generateDocCluster 的 wordIdfList 等可变量改为函数返回值,
//     调用方自行持有(缓存仍由驱动层负责)。
//
// 行为字节级保持: 运算顺序 / Map 迭代顺序(插入序) / 排序比较器 / 浮点表达式
// 与原内联实现逐字一致, 以保证 docCluster.json / docClusterScatter.json 不变。

import { sim } from './clusterMath'

// 调参常量(与原 generateDocCluster.ts 一致, 仅迁移, 不改值)
export const DF_MIN = 2 // 仅出现在 <DF_MIN 篇文档的词视为噪声(无法贡献文档间相似度)
export const DF_MAX_RATIO = 0.5 // 出现在 >50% 文档的词视为近似停用词
export const TAG_WEIGHT = 3 // 人工标注 tag 词在向量中的额外权重(强语义信号)

// [词, IDF值] 的列表, 各文档向量共用此顺序对齐
export type WordIdfList = [string, number][]

/**
 * 由 "包含每个词的文档数(df)" + "tag 词表" 构建 IDF 列表。
 *
 * 这是原 getAllWords() 中分词/读文件之后的纯数学部分: 调用方先分词统计出
 * wordDocCount(每词的文档频次) 与 tagVocab(所有 tag 词), 再调本函数。
 *
 * 与原实现逐字一致:
 *   - 词表剪枝: 非 tag 词若 df<DF_MIN 或 df>dfMax 则丢弃;
 *   - 平滑 IDF: log(1 + fileCount/df);
 *   - tag 词无条件保留, 正文未出现时按 df=wordDocCount.get(t)||1 计;
 *   - 最终 Array.from(map.entries()).sort((a,b)=>b[1]-a[1])(IDF 降序)。
 *
 * 关键: wordDocCount / tagVocab 的迭代顺序 = 调用方插入顺序, 函数原样保留,
 * 因此输出 wordIdfList 的相对次序(影响向量分量顺序)与原实现完全相同。
 *
 * @param wordDocCount 词 -> 文档频次(df)。迭代顺序须与原 getAllWords 中的插入顺序一致。
 * @param tagVocab     所有 tag 词集合。迭代顺序须与原实现一致。
 * @param fileCount    总文档数(N)。
 */
export function buildWordIdfList(
  wordDocCount: Map<string, number>,
  tagVocab: Set<string>,
  fileCount: number,
): WordIdfList {
  if (fileCount === 0) {
    return []
  }

  // 词表剪枝 + 平滑 IDF: 去掉只出现一次(噪声)和近乎全局出现(近似停用词)的词,
  // 但 tag 词无条件保留
  const dfMax = Math.max(DF_MIN, Math.floor(fileCount * DF_MAX_RATIO))
  const wordIdfMap = new Map<string, number>()
  for (const [word, df] of wordDocCount.entries()) {
    const isTag = tagVocab.has(word)
    if (!isTag && (df < DF_MIN || df > dfMax)) {
      continue
    }
    // 平滑 IDF, 避免 df 接近 N 时 IDF 趋零或为负
    wordIdfMap.set(word, Math.log(1 + fileCount / df))
  }
  // tag 词若正文从未出现, 给一个高(但有限)的 IDF, 保证其作为特征生效
  for (const t of tagVocab) {
    if (!wordIdfMap.has(t)) {
      const df = wordDocCount.get(t) || 1
      wordIdfMap.set(t, Math.log(1 + fileCount / df))
    }
  }

  // 按 IDF 降序排列, 各文档向量共用此顺序对齐
  return Array.from(wordIdfMap.entries()).sort((a, b) => b[1] - a[1])
}

/**
 * 由文档的 "词频映射(TF)" + "tag 词集合" + 共享 IDF 列表 构建 TF-IDF 向量。
 *
 * 这是原 getDocVec() 中分词/读文件之后的纯数学部分: 调用方先 cleanText+分词+去停用词
 * 得到词列表, 统计成 wordTfMap, 并取出该文档的 tagTokens, 再调本函数。
 *
 * 与原实现逐字一致:
 *   - 沿 wordIdfList 顺序逐词输出分量;
 *   - tf===0 且非 tag 词时分量为 0;
 *   - 次线性 TF: tfw = 1 + log(tf>0 ? tf : 1)(tag 词即便正文未出现也按 1 次计入);
 *   - v = tfw * idf; 若是 tag 词再 *= TAG_WEIGHT。
 *
 * @param wordTfMap   词 -> 词频(TF)。
 * @param tagTokens   该文档的 tag 词集合。
 * @param wordIdfList buildWordIdfList 的输出(全局共享, 决定向量维度与分量顺序)。
 */
export function buildDocVector(
  wordTfMap: Map<string, number>,
  tagTokens: Set<string>,
  wordIdfList: WordIdfList,
): number[] {
  // 根据 wordIdfList 构建 TF-IDF 向量(次线性 TF + tag 加权)
  const vec: number[] = []
  for (const [word, idf] of wordIdfList) {
    const tf = wordTfMap.get(word) || 0
    const isTag = tagTokens.has(word)
    if (tf === 0 && !isTag) {
      vec.push(0)
      continue
    }
    // 次线性 TF: 1 + log(tf); tag 词即便正文未出现也按 1 次计入
    const tfw = 1 + Math.log(tf > 0 ? tf : 1)
    let v = tfw * idf
    if (isTag) {
      v *= TAG_WEIGHT
    }
    vec.push(v)
  }
  return vec
}

/**
 * 把已分词去停用词的词列表统计为 词频映射(TF)。
 *
 * 对应原 getDocVec 内联的 TF 统计(Map 累加, 首次出现按插入序)。抽成独立函数
 * 便于复用与测试; 行为与原内联循环一致。
 */
export function countTermFrequencies(words: string[]): Map<string, number> {
  const wordTfMap = new Map<string, number>()
  for (const word of words) {
    wordTfMap.set(word, (wordTfMap.get(word) || 0) + 1)
  }
  return wordTfMap
}

/**
 * 两文档 TF-IDF 向量的余弦相似度。等价于原 similar() 中的 sim(getDocVec, getDocVec),
 * 此处仅做数值转发, 取词/取向量由驱动层完成。
 */
export function similarity(vec1: number[], vec2: number[]): number {
  return sim(vec1, vec2)
}

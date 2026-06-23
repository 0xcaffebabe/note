/**
 * DocumentVectorizer 单元测试
 *
 * 覆盖从 src/platform/node/scripts/generateDocCluster.ts 抽出的 "已分词之后" 的纯数学:
 * IDF 列表构建 buildWordIdfList、文档向量化 buildDocVector、词频统计
 * countTermFrequencies、相似度转发 similarity, 以及常量 DF_MIN/DF_MAX_RATIO/TAG_WEIGHT。
 *
 * 关键点:
 * - DocumentVectorizer 仅依赖 ./clusterMath(同为纯), 不 import nodejieba / fs / BaseService,
 *   引入它不会触发文档生成主流程。
 * - 期望数值均用 node 实跑探针确认(见任务说明), 复刻原 getAllWords/getDocVec 的运算顺序,
 *   以保证抽取后 docCluster.json / docClusterScatter.json 逐字节不变。
 */
import { describe, it, expect } from 'vitest'
import {
  buildWordIdfList,
  buildDocVector,
  countTermFrequencies,
  similarity,
  DF_MIN,
  DF_MAX_RATIO,
  TAG_WEIGHT,
} from '@/core/algorithm/DocumentVectorizer'

describe('常量与原 generateDocCluster 一致', () => {
  it('DF_MIN=2 / DF_MAX_RATIO=0.5 / TAG_WEIGHT=3', () => {
    expect(DF_MIN).toBe(2)
    expect(DF_MAX_RATIO).toBe(0.5)
    expect(TAG_WEIGHT).toBe(3)
  })
})

describe('buildWordIdfList IDF 列表构建', () => {
  it('fileCount=0 返回空列表', () => {
    expect(buildWordIdfList(new Map(), new Set(), 0)).toEqual([])
  })

  it('词表剪枝 + 平滑 IDF + 按 IDF 降序对齐(与原实现逐字一致)', () => {
    // 6 文档: dfMax = max(2, floor(6*0.5)) = 3
    //   a:df1 噪声丢弃; b:df2 保留(且为 tag); c:df3 保留; d:df4 >dfMax 丢弃; e:df6 丢弃
    //   tg: 正文从未出现(不在 wordDocCount), 但在 tagVocab -> 强制保留, df 默认 1
    const wordDocCount = new Map<string, number>([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 6],
    ])
    const tagVocab = new Set<string>(['b', 'tg'])
    const list = buildWordIdfList(wordDocCount, tagVocab, 6)
    // log(1+6/1)=1.9459..  log(1+6/2)=1.3862..  log(1+6/3)=1.0986..
    expect(list).toEqual([
      ['tg', 1.9459101490553132],
      ['b', 1.3862943611198906],
      ['c', 1.0986122886681096],
    ])
  })

  it('tag 词无条件保留即便其 df 触发剪枝(df=1 或 df 过大)', () => {
    // hot 的 df=5 > dfMax(3), 普通词会被剪掉, 但它是 tag -> 保留
    const wordDocCount = new Map<string, number>([['hot', 5]])
    const tagVocab = new Set<string>(['hot'])
    const list = buildWordIdfList(wordDocCount, tagVocab, 6)
    expect(list).toEqual([['hot', Math.log(1 + 6 / 5)]])
  })

  it('IDF 平滑公式为 log(1 + N/df)', () => {
    const wordDocCount = new Map<string, number>([['w', 2]])
    const list = buildWordIdfList(wordDocCount, new Set(), 6)
    expect(list[0][1]).toBeCloseTo(Math.log(1 + 6 / 2), 15)
  })
})

describe('countTermFrequencies 词频统计', () => {
  it('统计词频, 首次出现按插入序(影响 Map 迭代顺序)', () => {
    const tf = countTermFrequencies(['并发', '锁', '并发', '并发', '锁'])
    expect(Array.from(tf.entries())).toEqual([
      ['并发', 3],
      ['锁', 2],
    ])
  })

  it('空词列表返回空 Map', () => {
    expect(countTermFrequencies([]).size).toBe(0)
  })
})

describe('buildDocVector 文档向量化(TF-IDF + 次线性 TF + tag 加权)', () => {
  const idfList: [string, number][] = [
    ['tg', 1.9459101490553132],
    ['b', 1.3862943611198906],
    ['c', 1.0986122886681096],
  ]

  it('与原 getDocVec 逐字一致(次线性 TF, tag 加权, tag 词正文未出现按 1 次计)', () => {
    const tf = new Map<string, number>([
      ['b', 3],
      ['c', 1],
    ])
    const tagTokens = new Set<string>(['b', 'tg'])
    const vec = buildDocVector(tf, tagTokens, idfList)
    // tg: tf=0 但是 tag -> (1+log1)*1.9459*3 = 5.8377..
    // b : tf=3 且是 tag -> (1+log3)*1.3863*3 = 8.7279..
    // c : tf=1 非 tag    -> (1+log1)*1.0986     = 1.0986..
    expect(vec).toEqual([5.8377304471659395, 8.727883145872525, 1.0986122886681096])
  })

  it('非 tag 词 tf=0 时分量为 0(并保持向量维度=IDF 列表长度)', () => {
    const vec = buildDocVector(new Map(), new Set(), idfList)
    expect(vec).toEqual([0, 0, 0])
  })

  it('次线性 TF 为 1+log(tf), 非 tag 词不加权', () => {
    const tf = new Map<string, number>([['c', 4]])
    const vec = buildDocVector(tf, new Set(), idfList)
    expect(vec[0]).toBe(0)
    expect(vec[1]).toBe(0)
    expect(vec[2]).toBeCloseTo((1 + Math.log(4)) * 1.0986122886681096, 15)
  })

  it('tag 加权恰好乘以 TAG_WEIGHT(=3)', () => {
    const tf = new Map<string, number>([['b', 2]])
    const asTag = buildDocVector(tf, new Set(['b']), idfList)
    const asPlain = buildDocVector(tf, new Set(), idfList)
    // 同一词 b, 唯一差别是 tag 加权
    expect(asTag[1]).toBeCloseTo(asPlain[1] * TAG_WEIGHT, 12)
  })

  it('空 IDF 列表 -> 空向量', () => {
    expect(buildDocVector(new Map([['x', 1]]), new Set(), [])).toEqual([])
  })
})

describe('similarity 相似度转发(等价于原 similar 的 sim 调用)', () => {
  it('相同向量相似度为 1', () => {
    expect(similarity([1, 2, 3], [1, 2, 3])).toBe(1)
  })

  it('零向量除零保护返回 0(不为 NaN)', () => {
    const r = similarity([0, 0, 0], [1, 2, 3])
    expect(r).toBe(0)
    expect(Number.isNaN(r)).toBe(false)
  })

  it('端到端: 两文档经 buildDocVector 后的余弦相似度可计算且确定', () => {
    const idfList: [string, number][] = [
      ['x', 2],
      ['y', 1],
    ]
    const v1 = buildDocVector(new Map([['x', 2]]), new Set(), idfList)
    const v2 = buildDocVector(new Map([['x', 2]]), new Set(), idfList)
    expect(similarity(v1, v2)).toBe(1)
  })
})

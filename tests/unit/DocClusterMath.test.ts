/**
 * DocClusterMath 单元测试
 *
 * 覆盖从 src/scripts/generateDocCluster.ts 抽出的纯数学/确定性工具
 * (src/scripts/clusterMath.ts): 余弦相似度 sim、L2 归一化 l2normalize、
 * 点积 dot、平方距离 sqDist、确定性 PRNG lcg、确定性 K-means kmeans、
 * 停用词判定 isStopWord。
 *
 * 关键点:
 * - clusterMath.ts 刻意不 import nodejieba / BaseService / fs, 引入它不会触发
 *   generateDocCluster.ts 顶层读取停用词表的 IIFE, 也不会跑文档生成主流程。
 * - 所有期望值均先用 node 实跑探针确认 (见任务说明), 而非凭直觉。
 * - MDS 距离恢复不在本测范围。
 */
import { describe, it, expect } from 'vitest'
import { sim, l2normalize, dot, sqDist, lcg, kmeans, isStopWord } from '@/core/algorithm/clusterMath'

describe('sim 余弦相似度', () => {
  it('相同向量相似度为 1', () => {
    expect(sim([1, 2, 3], [1, 2, 3])).toBe(1)
  })

  it('正交向量相似度为 0', () => {
    expect(sim([1, 0], [0, 1])).toBe(0)
  })

  it('方向相反的向量相似度为 -1', () => {
    expect(sim([1, 1], [-1, -1])).toBeCloseTo(-1, 12)
  })

  it('成比例的同向向量相似度为 1', () => {
    expect(sim([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 12)
  })

  it('零向量与非零向量: 除零保护, 返回 0 而非 NaN', () => {
    const r = sim([0, 0, 0], [1, 2, 3])
    expect(r).toBe(0)
    expect(Number.isNaN(r)).toBe(false)
  })

  it('两个零向量: 除零保护, 返回 0 而非 NaN', () => {
    const r = sim([0, 0], [0, 0])
    expect(r).toBe(0)
    expect(Number.isNaN(r)).toBe(false)
  })

  it('一般情形与手算一致', () => {
    // dot=11, |a|=sqrt5, |b|=sqrt5 -> 11/5
    expect(sim([1, 2], [3, 4])).toBeCloseTo(11 / Math.sqrt(5 * 25), 12)
  })

  it('长度不同时抛出错误', () => {
    expect(() => sim([1, 2], [1, 2, 3])).toThrow('长度不同')
  })

  it('空向量视为零向量, 返回 0', () => {
    expect(sim([], [])).toBe(0)
  })
})

describe('l2normalize L2 归一化', () => {
  it('[3,4] 归一化为 [0.6,0.8]', () => {
    expect(l2normalize([3, 4])).toEqual([0.6, 0.8])
  })

  it('归一化后模长为 1', () => {
    const v = l2normalize([5, 12])
    const norm = Math.sqrt(v[0] * v[0] + v[1] * v[1])
    expect(norm).toBeCloseTo(1, 12)
  })

  it('零向量除零保护: norm 退化为 1, 结果仍为零向量(不产生 NaN)', () => {
    expect(l2normalize([0, 0])).toEqual([0, 0])
  })

  it('空向量返回空数组', () => {
    expect(l2normalize([])).toEqual([])
  })

  it('单元素向量归一化为 1(保留符号)', () => {
    expect(l2normalize([7])).toEqual([1])
    expect(l2normalize([-7])).toEqual([-1])
  })
})

describe('dot 点积', () => {
  it('[1,2,3]·[4,5,6] = 32', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32)
  })

  it('正交向量点积为 0', () => {
    expect(dot([1, 0], [0, 1])).toBe(0)
  })

  it('空向量点积为 0', () => {
    expect(dot([], [])).toBe(0)
  })

  it('只迭代到 a 的长度(b 更长时多余分量被忽略)', () => {
    expect(dot([1, 1], [2, 3, 100])).toBe(5)
  })
})

describe('sqDist 平方欧氏距离', () => {
  it('[1,2] 到 [4,6] 的平方距离为 25', () => {
    expect(sqDist([1, 2], [4, 6])).toBe(25)
  })

  it('相同点距离为 0', () => {
    expect(sqDist([3, 3, 3], [3, 3, 3])).toBe(0)
  })

  it('空向量距离为 0', () => {
    expect(sqDist([], [])).toBe(0)
  })
})

describe('lcg 确定性 PRNG(线性同余)', () => {
  it('固定种子 42 产生固定序列', () => {
    const r = lcg(42)
    const seq = [r(), r(), r(), r(), r()]
    expect(seq).toEqual([
      0.2523451747838408,
      0.08812504541128874,
      0.5772811982315034,
      0.22255426598712802,
      0.37566019711084664,
    ])
  })

  it('同种子两次实例化产生完全相同的序列(可复现)', () => {
    const a = lcg(42)
    const b = lcg(42)
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b())
    }
  })

  it('不同种子产生不同序列', () => {
    expect(lcg(42)()).not.toBe(lcg(7)())
  })

  it('种子 0 也能产生确定序列(非全 0)', () => {
    const r = lcg(0)
    expect([r(), r(), r()]).toEqual([
      0.23606797284446657,
      0.278566908556968,
      0.8195337599609047,
    ])
  })

  it('输出始终落在 [0,1) 区间', () => {
    const r = lcg(12345)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('kmeans 确定性 K-means', () => {
  // 两个分得很开的簇: 前 3 个点聚在原点附近, 后 3 个点聚在 (10,10) 附近
  const twoClusters = [
    [0, 0],
    [0.1, 0],
    [0, 0.1],
    [10, 10],
    [10.1, 10],
    [10, 10.1],
  ]

  it('对简单的两簇数据正确分组(前 3 / 后 3 各成一簇)', () => {
    const labels = kmeans(twoClusters, 2, 42)
    expect(labels).toEqual([0, 0, 0, 1, 1, 1])
  })

  it('同种子结果完全一致(确定性)', () => {
    const a = kmeans(twoClusters, 2, 42)
    const b = kmeans(twoClusters, 2, 42)
    expect(a).toEqual(b)
  })

  it('返回的标签数等于样本数, 且取值在 [0,K)', () => {
    const labels = kmeans(twoClusters, 2, 42)
    expect(labels.length).toBe(twoClusters.length)
    for (const l of labels) {
      expect(l).toBeGreaterThanOrEqual(0)
      expect(l).toBeLessThan(2)
    }
  })

  it('空输入返回空数组', () => {
    expect(kmeans([], 3, 42)).toEqual([])
  })

  it('K=1 时所有点归入同一簇', () => {
    const labels = kmeans(twoClusters, 1, 42)
    expect(labels).toEqual([0, 0, 0, 0, 0, 0])
  })

  it('单样本返回单一标签 0', () => {
    expect(kmeans([[1, 2, 3]], 2, 42)).toEqual([0])
  })
})

describe('isStopWord 停用词判定', () => {
  const set = new Set<string>(['的', '停用词', 'and'])

  it('长度 <=1 的词一律视为停用词(与集合无关)', () => {
    expect(isStopWord('', set)).toBe(true)
    expect(isStopWord('a', set)).toBe(true)
    expect(isStopWord('中', set)).toBe(true)
  })

  it('集合中的多字词被判为停用词', () => {
    expect(isStopWord('停用词', set)).toBe(true)
    expect(isStopWord('and', set)).toBe(true)
  })

  it('不在集合中的多字词不是停用词', () => {
    expect(isStopWord('并发', set)).toBe(false)
    expect(isStopWord('hello', set)).toBe(false)
  })

  it('空集合时, 仅靠长度 <=1 规则判定', () => {
    const empty = new Set<string>()
    expect(isStopWord('x', empty)).toBe(true)
    expect(isStopWord('xx', empty)).toBe(false)
  })
})

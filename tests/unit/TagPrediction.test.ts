import { describe, it, expect } from 'vitest'
import { predictTagsByVector } from '@/core/algorithm/TagPrediction'

// 守护从 generateDocCluster.generateDocTagPrediction 下沉的标签打分聚合。
// sim 是余弦相似度(高=近); 排序 (b,a)=>a[1]-b[1] 降序, 取分高的前 topN。

describe('predictTagsByVector 平均余弦相似度打分 + 降序截断', () => {
  it('相似度高的 tag 排前', () => {
    const docVec = [1, 0]
    const tagToVecs = new Map<string, number[][]>([
      ['near', [[1, 0]]],   // 余弦 1
      ['far', [[0, 1]]],    // 余弦 0
    ])
    expect(predictTagsByVector(docVec, tagToVecs)).toEqual(['near', 'far'])
  })

  it('取每个 tag 下成员向量的平均相似度', () => {
    const docVec = [1, 0]
    const tagToVecs = new Map<string, number[][]>([
      ['mix', [[1, 0], [0, 1]]], // 平均 (1+0)/2 = 0.5
      ['hi', [[1, 0], [1, 0]]],  // 平均 1
      ['lo', [[0, 1], [0, 1]]],  // 平均 0
    ])
    expect(predictTagsByVector(docVec, tagToVecs)).toEqual(['hi', 'mix', 'lo'])
  })

  it('topN 截断', () => {
    const docVec = [1, 0]
    const tagToVecs = new Map<string, number[][]>([
      ['a', [[1, 0]]], ['b', [[0.9, 0.1]]], ['c', [[0, 1]]],
    ])
    expect(predictTagsByVector(docVec, tagToVecs, 2)).toHaveLength(2)
  })

  it('空 tag 表 -> 空数组', () => {
    expect(predictTagsByVector([1, 0], new Map())).toEqual([])
  })
})

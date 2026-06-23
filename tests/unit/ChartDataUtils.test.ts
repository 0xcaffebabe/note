import { describe, it, expect } from 'vitest'
import { toRelativeTrend, topNAndRest, fillHourBuckets } from '@/core/util/DataUtils'
import HeatMapUtils from '@/core/util/HeatMapUtils'

describe('toRelativeTrend', () => {
  it('逐项与前项求差(首行不变), 就地修改', () => {
    const rows: [string, number, number, number][] = [
      ['d1', 10, 100, 1],
      ['d2', 30, 250, 4],
      ['d3', 60, 400, 9],
    ]
    toRelativeTrend(rows)
    expect(rows[0]).toEqual(['d1', 10, 100, 1])
    expect(rows[1]).toEqual(['d2', 20, 150, 3])
    expect(rows[2]).toEqual(['d3', 30, 150, 5])
  })
})

describe('topNAndRest', () => {
  it('降序取前 N, 其余 value 求和', () => {
    const items = [{ v: 5 }, { v: 1 }, { v: 9 }, { v: 3 }, { v: 2 }]
    const { top, restTotal } = topNAndRest(items, 2, i => i.v)
    expect(top.map(i => i.v)).toEqual([9, 5])
    expect(restTotal).toBe(1 + 3 + 2)
  })
})

describe('fillHourBuckets', () => {
  it('补全 0..23, 缺失补 0', () => {
    const data = fillHourBuckets([['0', 5], ['12', 8]])
    expect(data).toHaveLength(24)
    expect(data[0]).toEqual([0, 5])
    expect(data[1]).toEqual([1, 0])
    expect(data[12]).toEqual([12, 8])
    expect(data[23]).toEqual([23, 0])
  })
})

describe('HeatMapUtils.maxValue', () => {
  it('取数值最大(非字符串排序)', () => {
    expect(HeatMapUtils.maxValue([['a', 3], ['b', 20], ['c', 9]])).toBe(20)
  })
})

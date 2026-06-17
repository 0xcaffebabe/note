import { describe, it, expect } from 'vitest'
import ArrayUtils from '@/util/ArrayUtils'

describe('ArrayUtils.topN 取前 N 个', () => {
  it('截取前 N 个', () => {
    expect(ArrayUtils.topN([1, 2, 3, 4, 5], 2)).toEqual([1, 2])
  })
  it('N 不小于长度时返回全部元素(内容相等)', () => {
    expect(ArrayUtils.topN([1, 2], 5)).toEqual([1, 2])
    expect(ArrayUtils.topN([1, 2], 2)).toEqual([1, 2])
  })
  it('空数组返回空数组', () => {
    expect(ArrayUtils.topN([], 3)).toEqual([])
  })
  it('N 为 0 返回空数组', () => {
    expect(ArrayUtils.topN([1, 2, 3], 0)).toEqual([])
  })
  it('入参为 null/undefined 时原样返回(不抛错)', () => {
    expect(ArrayUtils.topN(null as any, 3)).toBeNull()
    expect(ArrayUtils.topN(undefined as any, 3)).toBeUndefined()
  })
  it('N 为负数得空数组(length<=n 不成立, 循环不执行)', () => {
    expect(ArrayUtils.topN([1, 2, 3], -1)).toEqual([])
  })
  // 源码已修复别名不一致: 现在无论 N 大小都返回新数组(slice), 不再回吐原引用
  it('始终返回新数组(N>=length 与 N<length 都不与入参同引用)', () => {
    const a = [1, 2, 3]
    expect(ArrayUtils.topN(a, 5)).not.toBe(a) // 修复前曾回吐原引用
    expect(ArrayUtils.topN(a, 5)).toEqual([1, 2, 3])
    expect(ArrayUtils.topN(a, 2)).not.toBe(a)
  })
})

describe('ArrayUtils.last 取末元素', () => {
  it('返回最后一个元素', () => {
    expect(ArrayUtils.last([1, 2, 3])).toBe(3)
  })
  // 源码已统一口径: null 入参与空数组都返回 undefined(原 null 入参返回 null 的不一致已修复)
  it('null 入参返回 undefined', () => {
    expect(ArrayUtils.last(null as any)).toBeUndefined()
  })
  it('空数组返回 undefined(与 null 入参口径一致)', () => {
    expect(ArrayUtils.last([])).toBeUndefined()
  })
  it('单元素数组返回该元素(无 off-by-one)', () => {
    expect(ArrayUtils.last([7])).toBe(7)
  })
  it('末元素本身为 undefined 时也返回 undefined(与空数组不可区分)', () => {
    expect(ArrayUtils.last([1, undefined])).toBeUndefined()
  })
})

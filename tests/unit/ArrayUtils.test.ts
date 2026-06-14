import { describe, it, expect } from 'vitest'
import ArrayUtils from '@/util/ArrayUtils'

describe('ArrayUtils.topN 取前 N 个', () => {
  it('截取前 N 个', () => {
    expect(ArrayUtils.topN([1, 2, 3, 4, 5], 2)).toEqual([1, 2])
  })
  it('N 不小于长度时原样返回', () => {
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
  // [隐患] N>=length 走早返回直接吐回"原数组引用", 而 N<length 返回新数组 —— 别名行为不一致
  it('[隐患] N>=length 返回原数组引用(可被调用方就地改动), N<length 返回新数组', () => {
    const a = [1, 2, 3]
    expect(ArrayUtils.topN(a, 5)).toBe(a) // 同一引用
    expect(ArrayUtils.topN(a, 2)).not.toBe(a) // 新数组
  })
})

describe('ArrayUtils.last 取末元素', () => {
  it('返回最后一个元素', () => {
    expect(ArrayUtils.last([1, 2, 3])).toBe(3)
  })
  it('null 入参返回 null', () => {
    expect(ArrayUtils.last(null as any)).toBeNull()
  })
  it('空数组返回 undefined(非 null —— 与 null 入参口径不同, 调用方需注意)', () => {
    expect(ArrayUtils.last([])).toBeUndefined()
  })
  it('单元素数组返回该元素(无 off-by-one)', () => {
    expect(ArrayUtils.last([7])).toBe(7)
  })
  it('末元素本身为 undefined 时也返回 undefined(与空数组不可区分)', () => {
    expect(ArrayUtils.last([1, undefined])).toBeUndefined()
  })
})

import { describe, it, expect } from 'vitest'
import { cloneDeep } from '@/util/DataUtils'

// cloneDeep 用于隔离 echarts 等会就地修改入参的数据(见 CommitTotalTrend)
// 它是 JSON 序列化实现, 这里既验证深拷贝隔离, 也锁定其已知限制以免误用
describe('cloneDeep 深拷贝', () => {
  it('嵌套对象与数组完全隔离, 改副本不影响原值', () => {
    const orig = { a: 1, nested: { b: 2 }, arr: [1, 2, 3] }
    const copy = cloneDeep(orig)
    copy.nested.b = 99
    copy.arr.push(4)
    expect(orig.nested.b).toBe(2)
    expect(orig.arr).toEqual([1, 2, 3])
    expect(copy).toEqual({ a: 1, nested: { b: 99 }, arr: [1, 2, 3, 4] })
  })
  it('值相等但引用不同', () => {
    const orig = { x: { y: 1 } }
    const copy = cloneDeep(orig)
    expect(copy).toEqual(orig)
    expect(copy).not.toBe(orig)
    expect(copy.x).not.toBe(orig.x)
  })

  // 已知限制: 基于 JSON 序列化, 不适合带 Date/函数/undefined 的对象
  it('已知限制: Date 退化为字符串', () => {
    const copy = cloneDeep({ d: new Date(0) })
    expect(typeof copy.d).toBe('string')
  })
  it('已知限制: undefined 属性与函数被丢弃', () => {
    const copy = cloneDeep({ u: undefined, fn: () => 1, keep: 1 })
    expect('u' in copy).toBe(false)
    expect('fn' in copy).toBe(false)
    expect(copy.keep).toBe(1)
  })
  it('已知限制: 循环引用直接抛错(JSON.stringify 无法序列化, 调用方需自行规避)', () => {
    const o: any = { a: 1 }
    o.self = o
    expect(() => cloneDeep(o)).toThrow()
  })
  it('已知限制: NaN / Infinity / -Infinity 退化为 null', () => {
    const copy = cloneDeep({ n: NaN, p: Infinity, m: -Infinity })
    expect(copy.n).toBeNull()
    expect(copy.p).toBeNull()
    expect(copy.m).toBeNull()
  })
  it('null 属性被保留(与 undefined 被丢弃形成对比)', () => {
    const copy = cloneDeep({ a: null, b: undefined })
    expect(copy.a).toBeNull()
    expect('b' in copy).toBe(false)
  })
})

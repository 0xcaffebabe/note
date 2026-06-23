import { describe, it, expect, beforeEach } from 'vitest'
import CacheService from '@/core/cache/CacheService'

// 进程内分 scope 的 LRU 缓存(每 scope 上限 200, 超出淘汰最旧)。
// 是 @Cache 装饰器/目录与文档加载的缓存底座; 淘汰序与刷新逻辑出错会静默命中失效或内存膨胀。
const MAX = 200 // 与源 MAX_ENTRIES_PER_SCOPE 同步; 改源需同步此值

describe('CacheService 基本读写', () => {
  const cache = new CacheService()
  beforeEach(() => cache.clear()) // 单例共享状态, 每例清空

  it('同 scope 内写后可读回', () => {
    cache.set('docs', 'k', 123)
    expect(cache.get('docs', 'k')).toBe(123)
    expect(cache.has('docs', 'k')).toBe(true)
  })
  it('未命中(缺 key / 缺 scope)返回 undefined', () => {
    expect(cache.get('docs', 'missing')).toBeUndefined()
    expect(cache.get('noScope', 'k')).toBeUndefined()
  })
  it('has 不会顺带创建 scope, 也不刷新顺序', () => {
    expect(cache.has('noScope', 'k')).toBe(false)
  })
  it('重复 set 同 key 覆盖值', () => {
    cache.set('docs', 'k', 'a')
    cache.set('docs', 'k', 'b')
    expect(cache.get('docs', 'k')).toBe('b')
  })
  it('scope 之间相互隔离', () => {
    cache.set('A', 'k', 1)
    cache.set('B', 'k', 2)
    expect(cache.get('A', 'k')).toBe(1)
    expect(cache.get('B', 'k')).toBe(2)
  })
  it('clear 清空所有 scope', () => {
    cache.set('A', 'k', 1)
    cache.clear()
    expect(cache.has('A', 'k')).toBe(false)
  })
})

describe('CacheService LRU 淘汰', () => {
  const cache = new CacheService()
  beforeEach(() => cache.clear())

  it('超过上限淘汰最旧条目', () => {
    for (let i = 0; i <= MAX; i++) cache.set('s', 'k' + i, i) // 写入 MAX+1 个
    expect(cache.has('s', 'k0')).toBe(false) // 最旧被淘汰
    expect(cache.has('s', 'k' + MAX)).toBe(true) // 最新仍在
  })

  it('get 访问刷新 LRU, 使其免于下一次淘汰', () => {
    for (let i = 0; i < MAX; i++) cache.set('s', 'k' + i, i) // 恰好填满(MAX 个)
    cache.get('s', 'k0') // 刷新 k0 为最新
    cache.set('s', 'kNew', -1) // 触发淘汰
    expect(cache.has('s', 'k0')).toBe(true) // k0 因刷新得以保留
    expect(cache.has('s', 'k1')).toBe(false) // 改由次旧 k1 被淘汰
  })

  it('重复 set 同 key 同样刷新 LRU 顺序', () => {
    for (let i = 0; i < MAX; i++) cache.set('s', 'k' + i, i)
    cache.set('s', 'k0', 999) // 覆盖并刷新 k0
    cache.set('s', 'kNew', -1) // 触发淘汰
    expect(cache.has('s', 'k0')).toBe(true)
    expect(cache.get('s', 'k0')).toBe(999)
    expect(cache.has('s', 'k1')).toBe(false)
  })

  it('has() 不刷新 LRU: 仅被 has 过的最旧条目照常被淘汰(与 get 的刷新行为相对)', () => {
    for (let i = 0; i < MAX; i++) cache.set('s', 'k' + i, i) // 填满
    cache.has('s', 'k0') // has 只读存在性 不应把 k0 提到最新
    cache.set('s', 'kNew', -1) // 触发淘汰
    expect(cache.has('s', 'k0')).toBe(false) // 未被刷新 仍作为最旧被淘汰(若 has 误刷新这里会是 true)
    expect(cache.has('s', 'k1')).toBe(true) // 次旧仍在
  })
})

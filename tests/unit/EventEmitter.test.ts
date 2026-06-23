import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from '@/core/util/EventEmitter'

describe('EventEmitter', () => {
  it('on/emit: 订阅者收到数据', () => {
    const bus = new EventEmitter<'a' | 'b'>()
    const fn = vi.fn()
    bus.on('a', fn)
    bus.emit('a', 42)
    expect(fn).toHaveBeenCalledWith(42)
  })
  it('emit 未订阅事件: 安全无操作', () => {
    const bus = new EventEmitter()
    expect(() => bus.emit('x', 1)).not.toThrow()
  })
  it('多订阅者按序触发', () => {
    const bus = new EventEmitter<'e'>()
    const calls: number[] = []
    bus.on('e', () => calls.push(1))
    bus.on('e', () => calls.push(2))
    bus.emit('e')
    expect(calls).toEqual([1, 2])
  })
  it('off: 取消后不再触发(只移除匹配的那个)', () => {
    const bus = new EventEmitter<'e'>()
    const a = vi.fn(); const b = vi.fn()
    bus.on('e', a); bus.on('e', b)
    bus.off('e', a)
    bus.emit('e')
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalled()
  })
})

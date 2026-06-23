import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// runInIdleBatches 把一个列表的处理切成多片塞进浏览器空闲时间, 避免一次长任务卡主线程。
// 这里守护它的四条核心契约: 1) 完整跑完时每项恰好被处理一次且保持原顺序;
// 2) 空列表既不调 handler 也不触发调度(零开销);
// 3) 取消后剩余项不再处理(已处理数 < 总数), 即便调度回调已排进队列也要静默;
// 4) 当 deadline.timeRemaining() <= 0(本片没空闲时间了)时, 处理完当前项即让步并重新排下一片。
//
// 关键约束: 源码在「模块加载时」就把 requestIdle 绑定锁死(取 window.requestIdleCallback 或 setTimeout 兜底),
// 所以必须在 import 之前用 vi.stubGlobal 造好带可控 requestIdleCallback 的 window, 再配合 vi.resetModules + 动态 import,
// 让每个用例都拿到一份「重新绑定到本用例桩」的模块。node 环境本身没有 window, 这一步同时也补齐了 window。

type IdleDeadlineLike = { timeRemaining(): number; didTimeout: boolean }
type IdleCb = (deadline: IdleDeadlineLike) => void

// 把 requestIdleCallback 变成一个可手动驱动的队列: 调用只入队, 测试自己决定何时、以何种 deadline 触发。
function setupQueue() {
  const queue: IdleCb[] = []
  const requestIdleCallback = vi.fn((cb: IdleCb) => {
    queue.push(cb)
  })
  // 必须在动态 import 源码「之前」装好 window, 因为绑定是模块加载期捕获的。
  vi.stubGlobal('window', { requestIdleCallback })
  return {
    queue,
    requestIdleCallback,
    // 弹出一片并以指定 deadline 执行; 默认 deadline 充裕(8ms) 不触发让步。
    flushOne(timeRemaining = 8) {
      const cb = queue.shift()
      if (!cb) throw new Error('队列为空, 没有可执行的分片')
      cb({ timeRemaining: () => timeRemaining, didTimeout: false })
    },
    // 反复弹出直到队列清空(deadline 充裕 → 通常一片处理完所有项)。
    drainAll(timeRemaining = 8) {
      while (queue.length) {
        const cb = queue.shift()!
        cb({ timeRemaining: () => timeRemaining, didTimeout: false })
      }
    },
  }
}

// 每个用例都重置模块图, 这样下一次动态 import 会重新执行源码顶层、重新捕获本用例刚装好的 window 桩。
beforeEach(() => {
  vi.resetModules()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('runInIdleBatches 完整跑完', () => {
  it('deadline 充裕时一片内按原顺序处理每一项恰好一次', async () => {
    const q = setupQueue()
    const { runInIdleBatches } = await import('@/platform/web/util/IdleTaskUtils')

    const processed: number[] = []
    runInIdleBatches([1, 2, 3, 4, 5], (x) => processed.push(x))

    // 启动只排了一片, handler 尚未被调用(空闲回调还没触发)。
    expect(q.requestIdleCallback).toHaveBeenCalledTimes(1)
    expect(processed).toEqual([])

    q.drainAll() // deadline 充裕 → 一片跑完全部
    expect(processed).toEqual([1, 2, 3, 4, 5]) // 每项一次且保序
    expect(q.queue.length).toBe(0) // 全部处理完后不再重排
  })

  it('每一项只被处理一次(handler 调用次数 == 列表长度)', async () => {
    const q = setupQueue()
    const { runInIdleBatches } = await import('@/platform/web/util/IdleTaskUtils')

    const handler = vi.fn()
    const items = ['a', 'b', 'c']
    runInIdleBatches(items, handler)
    q.drainAll()

    expect(handler).toHaveBeenCalledTimes(items.length)
    expect(handler.mock.calls.map((c) => c[0])).toEqual(items) // 实参即列表项, 保序
  })
})

describe('runInIdleBatches 空列表', () => {
  it('不调用 handler 也不触发任何调度', async () => {
    const q = setupQueue()
    const { runInIdleBatches } = await import('@/platform/web/util/IdleTaskUtils')

    const handler = vi.fn()
    const cancel = runInIdleBatches([], handler)

    expect(handler).not.toHaveBeenCalled()
    expect(q.requestIdleCallback).not.toHaveBeenCalled() // length === 0 直接跳过调度
    expect(q.queue.length).toBe(0)
    expect(typeof cancel).toBe('function') // 仍返回一个可调用的取消函数
    expect(() => cancel()).not.toThrow() // 取消空任务无副作用
  })
})

describe('runInIdleBatches 中途取消', () => {
  it('取消后剩余项不再处理(已处理数 < 总数)', async () => {
    const q = setupQueue()
    const { runInIdleBatches } = await import('@/platform/web/util/IdleTaskUtils')

    const processed: number[] = []
    const items = [10, 20, 30, 40, 50]
    const cancel = runInIdleBatches(items, (x) => processed.push(x))

    // 用 deadline=0 让第一片只处理一项就让步并重排下一片。
    q.flushOne(0)
    expect(processed).toEqual([10])
    expect(q.queue.length).toBe(1) // 已为剩余项重排了一片

    cancel() // 取消: 此时队列里还躺着一个待执行的 step 回调

    // 即便驱动那个已排队的回调, 取消标记也会让 while 循环一项都不处理。
    q.drainAll(0)
    expect(processed).toEqual([10]) // 维持取消瞬间的进度
    expect(processed.length).toBeLessThan(items.length) // 关键: 处理数严格小于总数
  })

  it('取消后即便回调被再次触发也不抛错、不继续推进', async () => {
    const q = setupQueue()
    const { runInIdleBatches } = await import('@/platform/web/util/IdleTaskUtils')

    const handler = vi.fn()
    const cancel = runInIdleBatches([1, 2, 3], handler)
    cancel() // 启动即取消, 但启动时已排了一片

    expect(() => q.drainAll()).not.toThrow()
    expect(handler).not.toHaveBeenCalled() // 整个列表一项都没处理
  })
})

describe('runInIdleBatches deadline 让步与重排', () => {
  it('timeRemaining() <= 0 时处理完当前项即重排下一片(每片一项)', async () => {
    const q = setupQueue()
    const { runInIdleBatches } = await import('@/platform/web/util/IdleTaskUtils')

    const processed: number[] = []
    const items = [1, 2, 3, 4]
    runInIdleBatches(items, (x) => processed.push(x))

    // 逐片以 deadline=0 触发: 每片应只处理一项, 然后重排, 直到全部处理完。
    let chunks = 0
    while (q.queue.length) {
      q.flushOne(0)
      chunks++
    }

    expect(processed).toEqual(items) // 顺序与完整性不受分片影响
    expect(chunks).toBe(items.length) // 每项各占一片 → 片数 == 项数
  })

  it('timeRemaining() 恰为 0 视为已无空闲(<=0 边界让步)', async () => {
    const q = setupQueue()
    const { runInIdleBatches } = await import('@/platform/web/util/IdleTaskUtils')

    const processed: number[] = []
    runInIdleBatches([1, 2], (x) => processed.push(x))

    q.flushOne(0) // deadline 正好 0: 处理 1 项后 break 并重排
    expect(processed).toEqual([1])
    expect(q.queue.length).toBe(1) // 因 <= 0 让步, 已重排剩余项

    q.flushOne(0)
    expect(processed).toEqual([1, 2])
    expect(q.queue.length).toBe(0) // 处理完最后一项, index 已到尾, 不再重排
  })

  it('正 deadline 不让步: 同一片内连续处理多项', async () => {
    const q = setupQueue()
    const { runInIdleBatches } = await import('@/platform/web/util/IdleTaskUtils')

    const processed: number[] = []
    runInIdleBatches([1, 2, 3], (x) => processed.push(x))

    q.flushOne(5) // timeRemaining=5 > 0, 一片吃掉全部
    expect(processed).toEqual([1, 2, 3])
    expect(q.queue.length).toBe(0) // 无需重排
  })
})

describe('runInIdleBatches 调度绑定(无 requestIdleCallback 时的 setTimeout 兜底)', () => {
  it('window 上没有 requestIdleCallback 时, 经 setTimeout 兜底仍能跑完全部', async () => {
    vi.useFakeTimers()
    try {
      // 造一个「有 window 但没有 requestIdleCallback」的环境 → 走 setTimeout 分支。
      vi.stubGlobal('window', {})
      const { runInIdleBatches } = await import('@/platform/web/util/IdleTaskUtils')

      const processed: number[] = []
      runInIdleBatches([1, 2, 3], (x) => processed.push(x))

      expect(processed).toEqual([]) // 还没到下一个 tick
      vi.runAllTimers() // 兜底用 setTimeout(0) 调度; 其 deadline 固定 timeRemaining()=8(>0) 一片跑完
      expect(processed).toEqual([1, 2, 3])
    } finally {
      vi.useRealTimers()
    }
  })
})

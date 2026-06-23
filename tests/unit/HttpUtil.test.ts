import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// http() 是全站请求的薄封装: 进入时 NProgress.start(), 退出时在 finally 里 NProgress.done()。
// 这里要锁的核心不变式是 start/done 必须成对: 无论 fetch 成功还是抛错, done 都得被调一次,
// 否则进度条 pending 计数泄漏、顶部加载条永远卡住。本套件在网络边界 mock fetch、
// 在 DOM 边界 mock NProgress(避免真碰 document), 只验证封装本身的编排与透传行为。

// 在 import 被测模块之前用 vi.hoisted + vi.mock 把 NProgress 换成可观测的 spy。
const { startSpy, doneSpy } = vi.hoisted(() => ({
  startSpy: vi.fn(),
  doneSpy: vi.fn(),
}))
vi.mock('@/adapters/browser/NProgress', () => ({
  default: { start: startSpy, done: doneSpy },
}))

import { http } from '@/adapters/browser/http'

describe('http() 请求封装的进度条编排', () => {
  beforeEach(() => {
    startSpy.mockClear()
    doneSpy.mockClear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('成功路径: 透传 fetch 的入参与返回值, 且 start/done 各调用一次', async () => {
    const resp = { ok: true, status: 200 } as unknown as Response
    const fetchMock = vi.fn().mockResolvedValue(resp)
    vi.stubGlobal('fetch', fetchMock)

    const init = { method: 'POST', body: 'x' }
    const result = await http('/api/ping', init)

    // 返回值原样透传
    expect(result).toBe(resp)
    // 入参原样透传给底层 fetch
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/ping', init)
    // 进度条成对调用
    expect(startSpy).toHaveBeenCalledTimes(1)
    expect(doneSpy).toHaveBeenCalledTimes(1)
  })

  it('成功路径: start 先于 done(进入即 start, finally 才 done)', async () => {
    const order: string[] = []
    startSpy.mockImplementation(() => order.push('start'))
    doneSpy.mockImplementation(() => order.push('done'))
    const fetchMock = vi.fn().mockImplementation(async () => {
      order.push('fetch')
      return {} as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    await http('/api/order')

    expect(order).toEqual(['start', 'fetch', 'done'])

    startSpy.mockReset()
    doneSpy.mockReset()
  })

  it('错误路径: fetch reject 时仍在 finally 调 done, 并把错误向上抛出', async () => {
    const err = new Error('network down')
    const fetchMock = vi.fn().mockRejectedValue(err)
    vi.stubGlobal('fetch', fetchMock)

    await expect(http('/api/fail')).rejects.toThrow('network down')

    // 关键不变式: 失败路径 start/done 仍各一次, done 不被吞掉
    expect(startSpy).toHaveBeenCalledTimes(1)
    expect(doneSpy).toHaveBeenCalledTimes(1)
  })

  it('无 init 参数时以 undefined 调用 fetch(可选参数透传)', async () => {
    const resp = {} as Response
    const fetchMock = vi.fn().mockResolvedValue(resp)
    vi.stubGlobal('fetch', fetchMock)

    await http('/api/no-init')

    expect(fetchMock).toHaveBeenCalledWith('/api/no-init', undefined)
    expect(startSpy).toHaveBeenCalledTimes(1)
    expect(doneSpy).toHaveBeenCalledTimes(1)
  })

  it('并发多次调用: start/done 调用次数与请求数严格匹配(无泄漏)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ id: 1 } as unknown as Response)
      .mockRejectedValueOnce(new Error('boom')) // 混入一次失败
      .mockResolvedValueOnce({ id: 3 } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const results = await Promise.allSettled([
      http('/a'),
      http('/b'),
      http('/c'),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled').length
    const rejected = results.filter((r) => r.status === 'rejected').length
    expect(fulfilled).toBe(2)
    expect(rejected).toBe(1)

    // 3 次请求(含 1 次失败) => start 3 次、done 3 次, 严格成对
    expect(startSpy).toHaveBeenCalledTimes(3)
    expect(doneSpy).toHaveBeenCalledTimes(3)
  })
})

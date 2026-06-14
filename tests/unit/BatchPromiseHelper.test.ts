import { describe, it, expect } from 'vitest'
import BatchPromiseHelper from '@/util/BatchPromiseHelper'

describe('BatchPromiseHelper 批量归并', () => {
  it('new(...) + all() 按加入顺序解析结果', async () => {
    const r = await BatchPromiseHelper.new(
      Promise.resolve('a'),
      Promise.resolve('b'),
      Promise.resolve('c'),
    ).all()
    expect(r).toEqual(['a', 'b', 'c'])
  })

  it('结果顺序与加入顺序一致, 与完成先后无关', async () => {
    const slow = new Promise<string>(res => setTimeout(() => res('slow'), 20))
    const fast = Promise.resolve('fast')
    const r = await BatchPromiseHelper.new(slow, fast).all()
    expect(r).toEqual(['slow', 'fast'])
  })

  it('join 可链式追加任务', async () => {
    const helper = BatchPromiseHelper.new(Promise.resolve(1))
      .join(Promise.resolve(2))
      .join(Promise.resolve(3), Promise.resolve(4))
    expect(await helper.all()).toEqual([1, 2, 3, 4])
  })

  it('无任务时 all() 解析为空数组', async () => {
    expect(await BatchPromiseHelper.new<number>().all()).toEqual([])
  })

  it('任一任务拒绝则 all() 整体拒绝', async () => {
    await expect(
      BatchPromiseHelper.new(Promise.resolve(1), Promise.reject(new Error('boom'))).all(),
    ).rejects.toThrow('boom')
  })
})

import { describe, expect, it, vi } from 'vitest'
import { Api } from '@/core/data/Api'
import CacheService from '@/core/cache/CacheService'

describe('Api.getDocClusterScatter', () => {
  it('HTTP 失败不解析也不缓存错误响应，重试成功后缓存聚类数据', async () => {
    const json = vi.fn().mockResolvedValue({ points: [], clusters: [] })
    const data = { points: [{ id: 'doc' }], clusters: [] }
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json })
      .mockResolvedValueOnce({ ok: true, json: async () => data })
    const api = new Api({ fetch }, new CacheService())
    await expect(api.getDocClusterScatter()).rejects.toThrow('HTTP 503')
    expect(json).not.toHaveBeenCalled()
    await expect(api.getDocClusterScatter()).resolves.toEqual(data)
    expect(await api.getDocClusterScatter()).toEqual(data)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenCalledWith('/docClusterScatter.json')
  })

  it.each([null, [], {}, { points: [] }, { points: {}, clusters: [] }])('拒绝无效结构 %j，允许重新获取', async invalid => {
    const data = { points: [], clusters: [] }
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => invalid })
      .mockResolvedValueOnce({ ok: true, json: async () => data })
    const api = new Api({ fetch }, new CacheService())
    await expect(api.getDocClusterScatter()).rejects.toThrow('聚类数据格式无效')
    await expect(api.getDocClusterScatter()).resolves.toEqual(data)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

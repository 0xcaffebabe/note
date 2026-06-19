import { describe, it, expect, vi, beforeEach } from 'vitest'

// DatasourceService 是数据源寻址的根: getCurrentDatasource() 决定全站 baseUrl(api/index.ts 用它拼所有请求 URL),
// 选错/选空会让整个文档站取数指向错误源或同源回退失败。它纯静态、无构造期自初始化, 仅在 testDelay 走 @/util/http 网络边界,
// 故只需在导入前 hoist mock 掉 http(让 PR 环境无网络也能跑), 并用 jsdom 提供的 localStorage 驱动选源分支。
//
// 重点 CHARACTERIZE 一个已知 BUG: getCurrentDatasource 用 filter() 找候选, filter 永远返回数组(即使空数组也是 truthy),
// 于是 `!candicate` 这条回退到 local 的保护永不触发 —— 一个"已存但在常量表里查不到"的陌生 id 会得到 undefined 而非 local 回退。

const { httpMock } = vi.hoisted(() => ({ httpMock: vi.fn() }))
vi.mock('@/util/http', () => ({ http: httpMock }))

import DatasourceService from '@/service/DatasourceService'

// 构造一个最小的 Response-like: testDelay 只用到 .json()
function fakeResp(json: unknown, delayMs = 0) {
  return {
    json: () =>
      delayMs > 0
        ? new Promise((resolve) => setTimeout(() => resolve(json), delayMs))
        : Promise.resolve(json),
  }
}

const KEY = 'datasource-servier::current' // 注意源码键名拼写为 servier(非 server), 与源保持一致

beforeEach(() => {
  localStorage.clear()
  httpMock.mockReset()
})

describe('DatasourceService.getCurrentDatasource 选源与回退', () => {
  it('无存储 id 时回退到 local 同源数据源', () => {
    const ds = DatasourceService.getCurrentDatasource()
    expect(ds).toEqual({ id: 'local', url: '/', desc: '与本文档同源' })
  })

  it('存储 id 命中常量表项时返回该项', () => {
    localStorage.setItem(KEY, 'local')
    const ds = DatasourceService.getCurrentDatasource()
    expect(ds.id).toBe('local')
    expect(ds.url).toBe('/')
  })

  it('已知 BUG: 存储了常量表中不存在的陌生 id 时返回 undefined(而非回退到 local)', () => {
    // filter() 命中失败返回 [], [] 是 truthy, 故 `!candicate` 回退永不触发, candicate[0] 即 undefined。
    localStorage.setItem(KEY, '不存在的源')
    const ds = DatasourceService.getCurrentDatasource()
    expect(ds).toBeUndefined()
  })

  it('空字符串 id 视为未设置, 回退到 local(走 !id 分支)', () => {
    // 空字符串 falsy, 命中 `if (!id)` 提前回退, 不进入 filter 分支
    localStorage.setItem(KEY, '')
    const ds = DatasourceService.getCurrentDatasource()
    expect(ds).toEqual({ id: 'local', url: '/', desc: '与本文档同源' })
  })
})

describe('DatasourceService.listDatasourceList / getDatasourceById / getDatasourcesByMatch', () => {
  it('listDatasourceList 返回内置数据源常量(至少含 local)', () => {
    const list = DatasourceService.listDatasourceList()
    expect(Array.isArray(list)).toBe(true)
    expect(list.some((v) => v.id === 'local')).toBe(true)
  })

  it('getDatasourceById 命中返回对应项', () => {
    const ds = DatasourceService.getDatasourceById('local')
    expect(ds.id).toBe('local')
  })

  it('已知 BUG: getDatasourceById 查不到时不抛错而返回 undefined(filter() 同样的 truthy 空数组陷阱)', () => {
    // 文档承诺"不存在则 throw", 但 filter 返回 [] 为 truthy, `!candicate` 不触发, 实际返回 candicate[0] = undefined
    expect(DatasourceService.getDatasourceById('zzz-missing')).toBeUndefined()
  })

  it('getDatasourcesByMatch 按谓词过滤', () => {
    expect(DatasourceService.getDatasourcesByMatch((v) => v.id === 'local')).toHaveLength(1)
    expect(DatasourceService.getDatasourcesByMatch(() => false)).toHaveLength(0)
  })
})

describe('DatasourceService.setCurrentDatasource', () => {
  it('写入 localStorage, 之后 getCurrentDatasource 读得回(命中项)', () => {
    DatasourceService.setCurrentDatasource({ id: 'local', url: '/', desc: '' })
    expect(localStorage.getItem(KEY)).toBe('local')
    expect(DatasourceService.getCurrentDatasource().id).toBe('local')
  })
})

describe('DatasourceService.testDelay', () => {
  it('返回 [延迟ms, generateTime] 元组结构', async () => {
    httpMock.mockResolvedValueOnce(fakeResp({ generateTime: '2026-06-19T00:00:00Z' }))
    const result = await DatasourceService.testDelay('local')

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    const [delay, generateTime] = result
    expect(typeof delay).toBe('number')
    expect(delay).toBeGreaterThanOrEqual(0) // 不断言确切毫秒, 仅断言非负
    expect(generateTime).toBe('2026-06-19T00:00:00Z') // generateTime 原样透传自 info.json
  })

  it('请求拼接的 URL = 数据源 url + info.json', async () => {
    httpMock.mockResolvedValueOnce(fakeResp({ generateTime: 'x' }))
    await DatasourceService.testDelay('local') // local 的 url 为 '/'
    expect(httpMock).toHaveBeenCalledWith('/info.json')
  })

  it('耗时随响应延迟增大: 延迟数值反映 http→json 的真实经过时间', async () => {
    // 让 .json() 异步等一会, 验证 delay 至少覆盖该等待(不写死上限, 避免 CI 抖动)
    httpMock.mockResolvedValueOnce(fakeResp({ generateTime: 'slow' }, 30))
    const [delay, generateTime] = await DatasourceService.testDelay('local')
    expect(generateTime).toBe('slow')
    expect(delay).toBeGreaterThanOrEqual(20) // 给足容差: 至少接近 30ms 的等待
  })
})

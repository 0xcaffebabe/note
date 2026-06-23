import { describe, it, expect, vi, beforeEach } from 'vitest'

/*
 * 覆盖 DocService 的「阅读历史 / 最后阅读 / 阅读进度」三类 localStorage 持久化逻辑。
 * 这些方法是纯 jsdom localStorage 读写, 不依赖异步 init, 但 import DocService 会顺带构造
 * TagService / KnowledgeNetworkService, 它们的构造函数会 fire-and-forget 调 api.getTagMapping /
 * getDocTagPrediction / getKnowledgeNetwork —— 故必须在 import 前用 vi.hoisted + vi.mock 把
 * '@/platform/web/api' 这层网络边界全部 stub 成可控空数据, 否则会真的发起 fetch 把测试拖崩。
 *
 * 重点行为(均已用一次性探针在真实代码上验证, 而非凭直觉):
 *  - 存储键彼此不同且必须精确: last-read 是单冒号 'doc-service:last-read',
 *    历史/进度是双冒号 'doc-service::read-history-list' / 'doc-service::read-record'。
 *  - setLastReadRecord: 写 last-read + 追加历史; 重复文档先删后追加(移到末尾); 超 20 条 shift 掉最旧, 上限恰为 20。
 *  - getReadHistoryList: 把存储里的列表 reverse(最新在前) 并把每项 ISO 时间转 toLocaleString。
 *    toLocaleString 受时区/locale 影响, 一律用 Date 往返 / 形状断言, 绝不硬编码本地化字符串。
 *  - setDocReadRecrod: 把 Map 序列化为 [[k,v]] 存盘, 且联动刷新 last-read。
 *  - Map 序列化往返: 写进去能读回相同进度。
 */

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    // TagService.init 依赖这两个
    getTagMapping: vi.fn().mockResolvedValue([] as [string, string[]][]),
    getDocTagPrediction: vi.fn().mockResolvedValue([] as [string, string[]][]),
    // KnowledgeNetworkService.init 依赖这个
    getKnowledgeNetwork: vi.fn().mockResolvedValue([]),
    // DocService.ensureQualityLoaded -> init 依赖这个(本组用例不触发, 兜底以防其他路径调用)
    getDocQualityData: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('@/platform/web/api', () => ({ default: apiMock }))

import docService from '@/platform/web/service/DocService'

const KEY_LAST = 'doc-service:last-read'
const KEY_HISTORY = 'doc-service::read-history-list'
const KEY_RECORD = 'doc-service::read-record'

function readHistoryRaw(): { doc: string; time: string }[] {
  return JSON.parse(localStorage.getItem(KEY_HISTORY) || '[]')
}

const flush = () => Promise.resolve()

describe('DocService 阅读历史持久化 setLastReadRecord', () => {
  beforeEach(async () => {
    // 等 import 期 fire-and-forget 的 init 微任务落定, 避免其异步写干扰; 再清空存储
    await flush()
    localStorage.clear()
  })

  it('写入 last-read 并向历史追加一条(含 ISO 时间戳)', () => {
    docService.setLastReadRecord('java/集合')

    expect(localStorage.getItem(KEY_LAST)).toBe('java/集合')
    expect(docService.getLastReadRecord()).toBe('java/集合')

    const raw = readHistoryRaw()
    expect(raw).toHaveLength(1)
    expect(raw[0].doc).toBe('java/集合')
    // time 是 ISO8601: new Date(iso).toISOString() 应与原串相等(往返不变), 不硬编码具体值
    expect(new Date(raw[0].time).toISOString()).toBe(raw[0].time)
  })

  it('追加多条不同文档按写入顺序入列', () => {
    docService.setLastReadRecord('a')
    docService.setLastReadRecord('b')
    docService.setLastReadRecord('c')

    expect(readHistoryRaw().map(v => v.doc)).toEqual(['a', 'b', 'c'])
    // last-read 跟随最后一次
    expect(localStorage.getItem(KEY_LAST)).toBe('c')
  })

  it('重复阅读同一文档时先删旧条目再追加到末尾(不产生重复)', () => {
    docService.setLastReadRecord('a')
    docService.setLastReadRecord('b')
    docService.setLastReadRecord('a') // a 应被移到末尾

    const order = readHistoryRaw().map(v => v.doc)
    expect(order).toEqual(['b', 'a'])
    // 去重: a 只出现一次
    expect(order.filter(d => d === 'a')).toHaveLength(1)
  })

  it('历史上限为 20: 超出后 shift 掉最旧条目', () => {
    for (let i = 0; i < 25; i++) {
      docService.setLastReadRecord('doc' + i)
    }
    const raw = readHistoryRaw()
    expect(raw).toHaveLength(20)
    // 写了 doc0..doc24, 最旧的 doc0..doc4 被逐条 shift, 留下 doc5..doc24
    expect(raw[0].doc).toBe('doc5')
    expect(raw[raw.length - 1].doc).toBe('doc24')
    expect(raw.some(v => v.doc === 'doc4')).toBe(false)
  })

  it('恰好 20 条不触发 shift; 第 21 条才挤掉最旧', () => {
    for (let i = 0; i < 20; i++) {
      docService.setLastReadRecord('d' + i)
    }
    expect(readHistoryRaw()).toHaveLength(20)
    expect(readHistoryRaw()[0].doc).toBe('d0')

    docService.setLastReadRecord('d20')
    const raw = readHistoryRaw()
    expect(raw).toHaveLength(20)
    expect(raw[0].doc).toBe('d1') // d0 被挤出
    expect(raw[raw.length - 1].doc).toBe('d20')
  })
})

describe('DocService 阅读历史读取 getReadHistoryList', () => {
  beforeEach(async () => {
    await flush()
    localStorage.clear()
  })

  it('无历史时返回空数组', () => {
    expect(docService.getReadHistoryList()).toEqual([])
  })

  it('返回顺序为逆序(最新在前)', () => {
    docService.setLastReadRecord('first')
    docService.setLastReadRecord('second')
    docService.setLastReadRecord('third')

    const list = docService.getReadHistoryList()
    expect(list.map(v => v.doc)).toEqual(['third', 'second', 'first'])
  })

  it('time 被转为本地化字符串: 与存储里的 ISO 串指向同一时刻(用 Date 往返断言, 不比较字面)', () => {
    docService.setLastReadRecord('doc-x')
    const isoStored = readHistoryRaw()[0].time

    const list = docService.getReadHistoryList()
    const localized = list[0].time
    // 转换后不再是原始 ISO 串(已本地化)
    expect(localized).not.toBe(isoStored)
    // 但二者解析为同一时间(允许 toLocaleString 丢秒以下精度, 这里到秒应一致; 用同一时刻往返校验)
    expect(new Date(isoStored).toLocaleString()).toBe(localized)
  })

  it('getReadHistoryList 不把 reverse / 本地化结果写回存储(只读变换)', () => {
    docService.setLastReadRecord('p')
    docService.setLastReadRecord('q')
    const before = localStorage.getItem(KEY_HISTORY)

    docService.getReadHistoryList()

    // 存储仍是原始正序 + ISO 时间, 未被读取动作污染
    const after = localStorage.getItem(KEY_HISTORY)
    expect(after).toBe(before)
    const raw = readHistoryRaw()
    expect(raw.map(v => v.doc)).toEqual(['p', 'q']) // 仍为正序
    expect(new Date(raw[0].time).toISOString()).toBe(raw[0].time) // 仍为 ISO
  })

  it('损坏(非数组合法 JSON 但缺字段)仍按形状返回 —— 空数组场景兜底', () => {
    // 直接写入空数组的合法 JSON, getReadHistoryList 应正常返回空
    localStorage.setItem(KEY_HISTORY, '[]')
    expect(docService.getReadHistoryList()).toEqual([])
  })
})

describe('DocService 阅读进度持久化 setDocReadRecrod / getDocReadRecord', () => {
  beforeEach(async () => {
    await flush()
    localStorage.clear()
  })

  it('写进度后能读回相同值(Map 序列化往返)', () => {
    docService.setDocReadRecrod('java/集合', 1280)
    expect(docService.getDocReadRecord('java/集合')).toBe(1280)
    // 落盘形式为 [[key, value]] 的 entries 数组
    expect(JSON.parse(localStorage.getItem(KEY_RECORD)!)).toEqual([['java/集合', 1280]])
  })

  it('未记录过的文档进度返回 0', () => {
    expect(docService.getDocReadRecord('从未读过')).toBe(0)
  })

  it('多文档进度各自独立保存', () => {
    docService.setDocReadRecrod('a', 10)
    docService.setDocReadRecrod('b', 20)

    expect(docService.getDocReadRecord('a')).toBe(10)
    expect(docService.getDocReadRecord('b')).toBe(20)
    expect(JSON.parse(localStorage.getItem(KEY_RECORD)!)).toEqual([['a', 10], ['b', 20]])
  })

  it('同一文档再次写入进度时覆盖旧值(不新增条目)', () => {
    docService.setDocReadRecrod('a', 10)
    docService.setDocReadRecrod('a', 99)

    expect(docService.getDocReadRecord('a')).toBe(99)
    const entries = JSON.parse(localStorage.getItem(KEY_RECORD)!)
    expect(entries).toHaveLength(1)
    expect(entries).toEqual([['a', 99]])
  })

  it('setDocReadRecrod 联动刷新 last-read 并追加到阅读历史', () => {
    docService.setDocReadRecrod('doc/with/progress', 42)

    // 进度 + last-read + 历史 三处同时落盘
    expect(localStorage.getItem(KEY_LAST)).toBe('doc/with/progress')
    expect(readHistoryRaw().map(v => v.doc)).toEqual(['doc/with/progress'])
  })

  it('进度键名为单引号路径也能往返(含中文 / 斜杠)', () => {
    docService.setDocReadRecrod('运维/Docker/安装', 333)
    expect(docService.getDocReadRecord('运维/Docker/安装')).toBe(333)
  })
})

describe('DocService getLastReadRecord 兜底', () => {
  beforeEach(async () => {
    await flush()
    localStorage.clear()
  })

  it('无 last-read 时返回空字符串', () => {
    expect(docService.getLastReadRecord()).toBe('')
  })

  it('setLastReadRecord 后能读回原值', () => {
    docService.setLastReadRecord('最后的文档')
    expect(docService.getLastReadRecord()).toBe('最后的文档')
  })
})

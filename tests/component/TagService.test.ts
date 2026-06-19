import { describe, it, expect, beforeEach, vi } from 'vitest'

// TagService 是 default-export 的单例: 构造函数在 import 时就 fire-and-forget 调用 init(),
// init() 里 await api.getTagMapping() / api.getDocTagPrediction() 填充内部数据。
// 因此必须在 import 之前用 vi.hoisted()+vi.mock('@/api') 把网络边界换成可控假数据,
// 再 await 一个微任务等 init() 落地, 否则断言会读到尚未填充的空数组。
// 本测覆盖: init 由 getTagMapping 构建 tagSumList; getTagSumList 返回深拷贝(防御性);
// getListByTag 命中/缺失; getTagList; 以及 getPredictTag 无匹配时安全返回空数组。

// ES import 会被提升到模块顶部, 在 import 那一刻单例就 new + init() 了。
// 所以假数据必须在 vi.hoisted() 里就备好(hoisted 早于 import 求值),
// 否则 init() 读到的是未配置返回值的 mock(undefined) -> tagList 为 undefined。
const { getTagMapping, getDocTagPrediction } = vi.hoisted(() => {
  // tagMapping: [tag, docId[]][] —— init 据此算 tagSumList(count = 文档数)
  const TAG_MAPPING: [string, string[]][] = [
    ['Vue', ['前端-Vue', '前端-VueRouter']],
    ['Java', ['后端-Java']],
    ['空标签', []],
  ]
  // docTagPrediction: [docUrl, tag[]][] —— getPredictTag 用 DocUtils.docUrl2Id(docUrl) 与入参比对
  // '/前端/Vue.md' 经 docUrl2Id 得到 '前端-Vue'
  const DOC_TAG_PREDICTION: [string, string[]][] = [
    ['/前端/Vue.md', ['Vue', '前端']],
    ['/后端/Java.md', ['Java']],
  ]
  return {
    getTagMapping: vi.fn().mockResolvedValue(TAG_MAPPING),
    getDocTagPrediction: vi.fn().mockResolvedValue(DOC_TAG_PREDICTION),
  }
})

vi.mock('@/api', () => ({
  default: {
    getTagMapping,
    getDocTagPrediction,
  },
}))

import tagService from '@/service/TagService'
import CacheService from '@/service/CacheService'

// init() 是异步的: 两次 await api.*(); 用足量微任务 flush 等其落地
async function flush() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
  }
}

beforeEach(() => {
  // 单例 + 共享缓存底座, 每例清空避免互相污染(@cache 仅缓存 Promise, 同步方法此处主要为防御)
  CacheService.getInstance().clear()
})

describe('TagService.init / getTagSumList', () => {
  it('init 依据 getTagMapping 构建 tagSumList(tag + 文档数 count)', async () => {
    await flush()
    const list = tagService.getTagSumList()
    expect(list).toEqual([
      { tag: 'Vue', count: 2 },
      { tag: 'Java', count: 1 },
      { tag: '空标签', count: 0 },
    ])
  })

  it('getTagSumList 返回深拷贝: 改动返回值不污染内部存储', async () => {
    await flush()
    const first = tagService.getTagSumList()
    // 破坏性修改返回的数组与其中元素
    first.push({ tag: '注入', count: 999 })
    ;(first[0] as { tag: string; count: number }).count = -1

    const second = tagService.getTagSumList()
    // 内部存储应保持原样, 不受上一次返回值被改动的影响
    expect(second).toEqual([
      { tag: 'Vue', count: 2 },
      { tag: 'Java', count: 1 },
      { tag: '空标签', count: 0 },
    ])
    expect(second).toHaveLength(3)
    expect(second).not.toBe(first)
  })
})

describe('TagService.getTagList', () => {
  it('返回全部标签名(取每项第 0 列)', async () => {
    await flush()
    expect(tagService.getTagList()).toEqual(['Vue', 'Java', '空标签'])
  })
})

describe('TagService.getListByTag', () => {
  it('命中标签: 展平返回该标签下的文档 id 列表', async () => {
    await flush()
    expect(tagService.getListByTag('Vue')).toEqual(['前端-Vue', '前端-VueRouter'])
  })

  it('命中无文档的标签: 返回空数组', async () => {
    await flush()
    expect(tagService.getListByTag('空标签')).toEqual([])
  })

  it('缺失标签: 返回空数组(filter 无匹配)', async () => {
    await flush()
    expect(tagService.getListByTag('不存在的标签')).toEqual([])
  })
})

describe('TagService.getPredictTag', () => {
  it('入参为空: 直接返回空数组(短路保护)', async () => {
    await flush()
    expect(tagService.getPredictTag('')).toEqual([])
  })

  it('命中: 返回该文档预测的标签列表(经 docUrl2Id 比对)', async () => {
    await flush()
    expect(tagService.getPredictTag('前端-Vue')).toEqual(['Vue', '前端'])
  })

  it('无匹配文档: 返回空数组(filter 无命中时安全兜底, 与 string[] 返回类型一致)', async () => {
    await flush()
    // 源码: 先 filter 收集命中, length 为 0 时返回 [], 不再对 undefined 取 [1] 抛 TypeError
    expect(tagService.getPredictTag('不存在-的文档')).toEqual([])
  })
})

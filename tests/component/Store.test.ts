import { describe, it, expect, beforeEach } from 'vitest'
import create from '@/store/index'

// store 用 localStorage 持久化最近访问的章节链接列表(key=system::currentCategoryList,
// 值为 JSON 字符串数组 string[])。本测覆盖 removeFromCategoryListExcept 的关键不变式:
// 内存态 state.currentCategoryList 与持久化的 localStorage 值必须一致, 都等于 [被保留项]。
// 历史 BUG: 实现用 cateList.splice(index,1) 的返回值([kept])赋给内存态(正确),
// 却把 splice 后被破坏的 cateList(= 除 kept 外的全部, 即反集)写进 localStorage,
// 导致刷新后 tab 变成反集。修复后此处断言两者都为 [kept]。

const KEY = 'system::currentCategoryList'

describe('store currentCategoryList 持久化', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removeFromCategoryListExcept: 内存态与持久化值都应只剩被保留项', () => {
    const store = create()
    // 直接 seed 列表(项为章节 link 字符串)
    store.commit('setCurrentCategoryList', ['/a.md', '/b.md', '/c.md', '/d.md'])

    store.commit('removeFromCategoryListExcept', '/c.md')

    // 内存态: 只保留 /c.md
    expect(store.state.currentCategoryList).toEqual(['/c.md'])
    // 持久化值: 必须与内存态一致, 而不是反集 ['/a.md','/b.md','/d.md']
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(['/c.md'])
  })

  it('removeFromCategoryListExcept: 保留项不在列表时不应误删, 内存态与持久化保持一致', () => {
    const store = create()
    store.commit('setCurrentCategoryList', ['/a.md', '/b.md'])

    store.commit('removeFromCategoryListExcept', '/notexist.md')

    // 未命中: 列表不变, 两者仍一致
    expect(store.state.currentCategoryList).toEqual(['/a.md', '/b.md'])
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(['/a.md', '/b.md'])
  })

  it('removeFromCategoryList: 仅移除指定项并持久化剩余项', () => {
    const store = create()
    store.commit('setCurrentCategoryList', ['/a.md', '/b.md', '/c.md'])

    store.commit('removeFromCategoryList', '/b.md')

    expect(store.state.currentCategoryList).toEqual(['/a.md', '/c.md'])
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(['/a.md', '/c.md'])
  })
})

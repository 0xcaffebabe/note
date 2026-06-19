import { describe, it, expect, beforeEach, vi } from 'vitest'

/*
  为什么重要:
  KnowledgeNetworkService 是知识图谱"上下文流"的来源——getDocStream 把一篇文档的上游(谁引用了它)
  与下游(它引用了谁)逐层展开成 string[][]，文档页据此渲染"知识链路"。算法用一个 travelSet 防止
  在有环图(A<->B)里死循环，并在上游/下游两趟之间清空该集合；任何回归(漏清空、push/unshift 反了、
  缺节点未提前返回)都会让链路错乱或卡死，而这类逻辑没有别的入口可测。

  测试要点:
  1) 在网络边界 mock '@/api' 的 getKnowledgeNetwork。该 singleton 在 import 时构造即 fire-and-forget
     调用 init()->fetchAllLinks()->api.getKnowledgeNetwork()，所以必须在 vi.hoisted 块内就给好默认返回值，
     否则 init() 拿到 undefined 而 getAllLinks() 永远空(见下方说明)。
  2) getDocStream 自身不带 @cache，且每次都 await api.getKnowledgeNetwork()，因此可逐例 mockResolvedValue
     重设网络结构、绕开 import 时的初始化时序。
  3) fetchAllLinks 带 @cache(无参常量键)，故 getAllLinks 用 import 时那份初始数据断言;
     每例前清空 CacheService 以免污染其它被 @cache 装饰的方法。
  断言形状/内容而非空白；层级输出均由真实运行探针确认。
*/

import CacheService from '@/service/CacheService'

// 在 hoisted 块内即给默认值: import KnowledgeNetworkService 触发的 init() 此刻就能拿到数据,
// 使 getAllLinks() 能拿到非空的初始链接快照。
const { getKnowledgeNetwork } = vi.hoisted(() => {
  const fn = vi.fn()
  fn.mockResolvedValue([
    { id: 'A', links: [{ id: 'B', name: 'b' }] },
    { id: 'B', links: [{ id: 'C', name: 'c1' }, { id: 'D', name: 'd1' }] },
  ])
  return { getKnowledgeNetwork: fn }
})
vi.mock('@/api', () => ({ default: { getKnowledgeNetwork } }))

import svc from '@/service/KnowledgeNetworkService'

// 构造网络节点的小工具: links 用 {id,name} 形态贴合 KnowledgeLinkNode
function node(id: string, ...targets: string[]) {
  return { id, links: targets.map((t) => ({ id: t, name: t })) }
}

describe('KnowledgeNetworkService.getDocStream 上下游分层', () => {
  beforeEach(() => CacheService.getInstance().clear())

  it('线性链 A->B->C, 查询中段 B: 上游一层 下游一层', async () => {
    getKnowledgeNetwork.mockResolvedValue([node('A', 'B'), node('B', 'C'), node('C')])
    const r = await svc.getDocStream('B')
    // 上游: 谁链到 B -> A; 自身 B; 下游: B 链到 C
    expect(r).toEqual([['A'], ['B'], ['C']])
  })

  it('钻石结构: A->C, B->C, C->D, C->E, 查询 C: 多入边/多出边各自成层', async () => {
    getKnowledgeNetwork.mockResolvedValue([
      node('A', 'C'),
      node('B', 'C'),
      node('C', 'D', 'E'),
      node('D'),
      node('E'),
    ])
    const r = await svc.getDocStream('C')
    expect(r).toEqual([['A', 'B'], ['C'], ['D', 'E']])
  })

  it('更深的上游链 A->B->C, X->B, C->D, 查询 C: 上游逐层向上 unshift', async () => {
    getKnowledgeNetwork.mockResolvedValue([
      node('A', 'B'),
      node('X', 'B'),
      node('B', 'C'),
      node('C', 'D'),
      node('D'),
    ])
    const r = await svc.getDocStream('C')
    // 上游两层(更上的 A,X 经 unshift 排到最前), 自身 C, 下游 D
    expect(r).toEqual([['A', 'X'], ['B'], ['C'], ['D']])
  })

  it('查询根节点 ROOT->L1, ROOT->L2: 无上游 只下游一层', async () => {
    getKnowledgeNetwork.mockResolvedValue([node('ROOT', 'L1', 'L2'), node('L1'), node('L2')])
    const r = await svc.getDocStream('ROOT')
    expect(r).toEqual([['ROOT'], ['L1', 'L2']])
  })

  it('单趟内共享 travelSet 去重: A->B, A->C, B->C 查询 A, C 只在第一层出现', async () => {
    getKnowledgeNetwork.mockResolvedValue([node('A', 'B', 'C'), node('B', 'C'), node('C')])
    const r = await svc.getDocStream('A')
    // 下游首层 [B,C]; 继续从 B 出发其出边 C 已被 travelSet 标记, 不再展开 -> 第二层只剩 C(经 B 一次)
    expect(r).toEqual([['A'], ['B', 'C'], ['C']])
  })
})

describe('KnowledgeNetworkService.getDocStream 边界与环', () => {
  beforeEach(() => CacheService.getInstance().clear())

  it('孤立节点 X(无入无出): 仅返回自身一层 [[id]]', async () => {
    getKnowledgeNetwork.mockResolvedValue([node('X')])
    const r = await svc.getDocStream('X')
    expect(r).toEqual([['X']])
  })

  it('查询完全不存在于网络的 id: 上下游皆空 仅 [[id]]', async () => {
    getKnowledgeNetwork.mockResolvedValue([node('A', 'B'), node('B')])
    const r = await svc.getDocStream('NOPE')
    expect(r).toEqual([['NOPE']])
  })

  it('下游遇到缺失节点提前返回: A->GHOST 但网络无 GHOST 节点, 查询 GHOST', async () => {
    // 上游能找到 A(它链到 GHOST); 下游 getNodeOutput 找不到 GHOST 节点 -> 提前返回, 无下游层
    getKnowledgeNetwork.mockResolvedValue([node('A', 'GHOST')])
    const r = await svc.getDocStream('GHOST')
    expect(r).toEqual([['A'], ['GHOST']])
  })

  it('环 A<->B 查询 A: 不死循环, travelSet 在上下游两趟间清空导致 A/B 重复出现', async () => {
    getKnowledgeNetwork.mockResolvedValue([node('A', 'B'), node('B', 'A')])
    const r = await svc.getDocStream('A')
    /*
      已知行为(非典型但 cycle-safe): 上游趟 travelSet={A,B} 收集到 [['A'],['B']];
      两趟之间 travelSet.clear(); 下游趟重新从 A 走 -> [['B'],['A']];
      结果 [...inputs,[A],...outputs] = [['A'],['B'],['A'],['B'],['A']]。
      关键在于"不死循环"且终止——这是本测试守护的核心不变量。
    */
    expect(r).toEqual([['A'], ['B'], ['A'], ['B'], ['A']])
    expect(r[2]).toEqual(['A']) // 中段自身仍是 A
  })

  it('环 A<->B 查询 B: 对称地不死循环并终止', async () => {
    getKnowledgeNetwork.mockResolvedValue([node('A', 'B'), node('B', 'A')])
    const r = await svc.getDocStream('B')
    expect(r).toEqual([['B'], ['A'], ['B'], ['A'], ['B']])
  })

  it('节点 links 字段缺省(undefined): 当作无出边处理 不抛错', async () => {
    // B 没有 links 字段; 查询 B 应只有上游 A 与自身
    getKnowledgeNetwork.mockResolvedValue([node('A', 'B'), { id: 'B' }])
    const r = await svc.getDocStream('B')
    expect(r).toEqual([['A'], ['B']])
  })

  it('空网络: 任意 id 都只返回自身', async () => {
    getKnowledgeNetwork.mockResolvedValue([])
    const r = await svc.getDocStream('whatever')
    expect(r).toEqual([['whatever']])
  })
})

describe('KnowledgeNetworkService.getAllLinks 深拷贝', () => {
  beforeEach(() => CacheService.getInstance().clear())

  it('返回 import 时 init 注入的扁平化链接快照', () => {
    const links = svc.getAllLinks()
    // 来自 hoisted 默认数据: A->B, B->C, B->D 的所有 link 扁平化
    expect(links).toEqual([
      { id: 'B', name: 'b' },
      { id: 'C', name: 'c1' },
      { id: 'D', name: 'd1' },
    ])
  })

  it('返回的是深拷贝: 改动返回值不会污染内部存储', () => {
    const first = svc.getAllLinks()
    expect(first.length).toBeGreaterThan(0)
    // 破坏性修改返回值
    first[0].id = 'TAMPERED'
    first.push({ id: 'INJECTED', name: 'x' })
    first.length = 0

    const second = svc.getAllLinks()
    // 第二次取应与被篡改前一致, 证明 getAllLinks 每次返回独立深拷贝
    expect(second).toEqual([
      { id: 'B', name: 'b' },
      { id: 'C', name: 'c1' },
      { id: 'D', name: 'd1' },
    ])
    expect(second[0].id).toBe('B')
  })

  it('两次调用返回不同的数组与元素引用(非共享)', () => {
    const a = svc.getAllLinks()
    const b = svc.getAllLinks()
    expect(a).not.toBe(b)
    expect(a[0]).not.toBe(b[0])
    expect(a).toEqual(b)
  })
})

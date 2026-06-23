import { describe, it, expect, vi } from 'vitest'
import type { KnowledgeNode } from '@/core/domain/KnowledgeNode'

// 为什么放在 component(jsdom)且要 mock http:
// 引入 KnowledgeNetworkDataProcessor 会沿 import 链触发 DocService → TagService/KnowledgeNetworkService
// 的“模块加载即 getInstance()”自初始化, 这些 init 会发起 http() 请求(同源根路径 '/')。
// node 环境缺 localStorage 等浏览器全局, 故用 jsdom; 同时在网络边界 mock 掉 @/adapters/browser/http,
// 避免自初始化真去 fetch 并保证确定性。
// 被测的 filterByDegree/createNodes/createLinks/getDocCategory 都是纯计算, 不碰这些服务的返回值。
const { httpMock } = vi.hoisted(() => ({ httpMock: vi.fn() }))
vi.mock('@/adapters/browser/http', () => ({
  http: (...args: any[]) => {
    httpMock(...args)
    // 返回一个最小 Response 形状: 任何 .json()/.text() 都得到空数据, 让自初始化静默完成
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve(''),
    } as any)
  },
}))

import { KnowledgeNetworkDataProcessor as P } from '@/platform/web/pages/doc/knowledge/KnowledgeNetworkDataProcessor'

// 便捷构造与断言助手
const net = (...nodes: KnowledgeNode[]): KnowledgeNode[] => nodes
const ids = (r: KnowledgeNode[]) => r.map((n) => n.id).sort()
const linksOf = (r: KnowledgeNode[], id: string) =>
  (r.find((n) => n.id === id)?.links ?? []).map((l) => l.id).sort()

// 这套守护知识图谱「按度数 BFS 裁剪 + 节点/边构造」的核心算法。
// 它决定了文档详情页“关系图谱”里能看到几跳的邻居、边是否去重、锚点是否解码,
// 算错会让图谱显示无关节点 / 漏掉反向引用 / 把原始网络数据就地改坏。

describe('filterByDegree: 度数 < 0 直接空集', () => {
  it('degree=-1 返回空数组(无意义度数短路)', () => {
    const g = net({ id: 'A', links: [{ name: 'b', id: 'B' }] }, { id: 'B' })
    expect(P.filterByDegree(g, 'A', -1)).toEqual([])
  })
})

describe('filterByDegree: degree=0 只留起点且裁掉其外向连接', () => {
  it('只返回 docId 自己, 且它指向 B 的连接被剪掉(B 不在结果中)', () => {
    const g = net({ id: 'A', links: [{ name: 'b', id: 'B' }] }, { id: 'B' })
    const r = P.filterByDegree(g, 'A', 0)
    expect(ids(r)).toEqual(['A'])
    expect(linksOf(r, 'A')).toEqual([]) // filteredLinks: B 不在 resultNodes 故被剪
  })
})

describe('filterByDegree: degree=1 取直接邻居(无向化)', () => {
  // 图: A→B(带锚点), B→C, D→A(反向指入 A)。以 A 为中心 1 跳应纳入 B 与 D。
  const g = net(
    { id: 'A', links: [{ name: 'b', id: 'B', headingId: 'sec' }] },
    { id: 'B', links: [{ name: 'c', id: 'C' }] },
    { id: 'C' },
    { id: 'D', links: [{ name: 'a', id: 'A' }] },
  )

  it('包含起点 A 及其正向邻居 B、反向邻居 D(图被当作无向处理)', () => {
    expect(ids(P.filterByDegree(g, 'A', 1))).toEqual(['A', 'B', 'D'])
  })

  it('反向引用(D→A)可达: 仅靠指入 A 的连接也能把 D 拉进 1 跳邻居', () => {
    const r = P.filterByDegree(g, 'A', 1)
    expect(r.find((n) => n.id === 'D')).toBeTruthy()
    expect(linksOf(r, 'D')).toEqual(['A']) // D 的反向连接保留(A 在结果内)
  })

  it('边界裁剪: A 仅保留指向结果内 B 的连接; B 指向结果外 C 的连接被剪', () => {
    const r = P.filterByDegree(g, 'A', 1)
    expect(linksOf(r, 'A')).toEqual(['B']) // B 在结果内 → 保留
    expect(linksOf(r, 'B')).toEqual([]) // C 不在 1 跳结果内 → 剪掉
  })
})

describe('filterByDegree: 不连通分量被排除', () => {
  it('与起点不连通的 F、G 一律不出现在结果里', () => {
    const g = net(
      { id: 'A', links: [{ name: 'b', id: 'B' }] },
      { id: 'B' },
      { id: 'F', links: [{ name: 'g', id: 'G' }] }, // 独立分量
      { id: 'G' },
    )
    const r = P.filterByDegree(g, 'A', 5) // 度数足够大也够不到不连通分量
    expect(ids(r)).toEqual(['A', 'B'])
  })
})

describe('filterByDegree: docId 不在图中', () => {
  it('起点不存在于网络 → 空数组(起点连节点映射都取不到)', () => {
    const g = net({ id: 'A', links: [{ name: 'b', id: 'B' }] }, { id: 'B' })
    expect(P.filterByDegree(g, 'ZZZ', 1)).toEqual([])
  })

  it('空网络 → 空数组', () => {
    expect(P.filterByDegree([], 'A', 1)).toEqual([])
  })
})

describe('filterByDegree: 返回克隆而非就地改写入参', () => {
  it('结果节点是浅拷贝(!== 原对象), 且原网络的 links 不被修改', () => {
    const original: KnowledgeNode[] = [
      { id: 'A', links: [{ name: 'b', id: 'B' }] }, // A 指向 B, 但 1 跳里 B 会进结果, links 不变
      { id: 'B', links: [{ name: 'c', id: 'C' }] }, // C 不在结果 → 结果里 B.links 被剪, 但原对象应不动
      { id: 'C' },
    ]
    const snapshotALinks = original[0].links!.length
    const snapshotBLinks = original[1].links!.length

    const r = P.filterByDegree(original, 'A', 1)
    // 结果对象是新建的(展开了 ...originalNode), 不应与入参同引用
    expect(r.find((n) => n.id === 'A')).not.toBe(original[0])
    expect(r.find((n) => n.id === 'B')).not.toBe(original[1])
    // 原网络不被就地改写: links 长度保持
    expect(original[0].links!.length).toBe(snapshotALinks)
    expect(original[1].links!.length).toBe(snapshotBLinks)
    expect(original[1].links!.map((l) => l.id)).toEqual(['C']) // 原 B 仍保留对 C 的连接
  })
})

describe('filterByDegree: 仅“链接目标”而无独立节点条目者不进结果列表(锁定现状)', () => {
  // 已知行为: 结果列表只收 nodeMap 里有条目的节点(即作为顶层 node.id 出现过的)。
  // C 仅作为 B 的 link 目标出现、没有自己的顶层节点条目, 故即便 BFS 把 C 标进 resultNodes,
  // 最终 nodeMap.get('C') 为 undefined 而被跳过, C 不在结果数组中;
  // 但此时 B 仍“在结果内”, 其指向 C 的连接因 resultNodes.has('C')=true 而被保留 —— 形成
  // “边指向一个并不在结果节点列表中的目标”的不对称, 这里把这一现状锁死。
  it('link-only 目标 C 不进结果列表, 但 B 仍保留指向 C 的连接', () => {
    const g = net(
      { id: 'A', links: [{ name: 'b', id: 'B' }] },
      { id: 'B', links: [{ name: 'c', id: 'C' }] }, // C 无独立顶层节点条目
    )
    const r = P.filterByDegree(g, 'A', 2)
    expect(ids(r)).toEqual(['A', 'B']) // C 被跳过, 不在结果节点中
    expect(linksOf(r, 'B')).toEqual(['C']) // 但 B→C 的连接仍保留(指向结果外节点)
  })
})

describe('createLinks: 边去重与锚点解码', () => {
  it('无向去重: A↔B 双向各声明一次只生成一条边', () => {
    const g = net(
      { id: 'A', links: [{ name: 'b', id: 'B' }] },
      { id: 'B', links: [{ name: 'a', id: 'A' }] }, // 反向, 应被 edgeKey 去重
    )
    const r = P.createLinks(g)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ target: 'A', source: 'B' })
  })

  it('同一对节点的重复声明也只保留首条边', () => {
    const g = net({ id: 'A', links: [{ name: 'b1', id: 'B' }, { name: 'b2', id: 'B' }] })
    expect(P.createLinks(g)).toHaveLength(1)
  })

  it('headingId 经 decodeURI 解码为可读锚点(#中文)', () => {
    const g = net({
      id: 'A',
      links: [{ name: 'b', id: 'B', headingId: '%E4%B8%AD%E6%96%87' }],
    })
    const r = P.createLinks(g)
    expect(r[0].value).toBe('#中文') // "#"+解码后的 headingId
  })

  it('无 headingId 时 value 退化为 "-"', () => {
    const g = net({ id: 'A', links: [{ name: 'b', id: 'B' }] })
    expect(P.createLinks(g)[0].value).toBe('-')
  })

  it('节点无 links 字段时不产生任何边', () => {
    expect(P.createLinks(net({ id: 'A' }, { id: 'B' }))).toEqual([])
  })
})

describe('createNodes: 节点集合与着色', () => {
  it('节点集合 = 所有 node.id 与所有 link 目标 id 的并集(去重)', () => {
    const g = net(
      { id: 'A', links: [{ name: 'b', id: 'B' }, { name: 'c', id: 'C' }] },
      { id: 'B' }, // 既是 link 目标又是顶层节点, 应只出现一次
    )
    const names = P.createNodes(g, 'A', []).map((n: any) => n.name).sort()
    expect(names).toEqual(['A', 'B', 'C']) // C 仅作 link 目标也被纳入, B 不重复
  })

  it('当前文档节点上色为黑色 #000000', () => {
    const g = net({ id: 'A', links: [{ name: 'b', id: 'B' }] }, { id: 'B' })
    const nodes = P.createNodes(g, 'A', [])
    const a = nodes.find((n: any) => n.name === 'A') as any
    expect(a.itemStyle.color).toBe('#000000')
  })

  it('非当前节点按分类着色(取色盘内的合法 Hex), 并带 docCategory', () => {
    const g = net({ id: 'java-collections', links: [{ name: 'x', id: 'java-stream' }] })
    const nodes = P.createNodes(g, 'java-collections', [])
    const other = nodes.find((n: any) => n.name === 'java-stream') as any
    expect(other.docCategory).toBe('java') // getDocCategory: 取 '-' 前第一段
    expect(other.itemStyle.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(other.itemStyle.color).not.toBe('#000000') // 非当前节点不是黑色
  })
})

describe('getDocCategory: 取分类前缀, 以及空串的死代码兜底(锁定现状)', () => {
  it('取 "-" 之前的第一段作为分类', () => {
    expect(P.getDocCategory('java-collections')).toBe('java')
    expect(P.getDocCategory('a-b-c')).toBe('a')
  })

  it('不含 "-" 时整串即分类', () => {
    expect(P.getDocCategory('nodash')).toBe('nodash')
  })

  // 已知 BUG: ''.split('-') === [''], parts.length 恒 >= 1, 三元里的 'other' 分支是死代码,
  // 空字符串实际返回 ''(而非看似的兜底 'other')。锁定现状, 待修复后更新断言。
  it("空字符串返回 '' 而非 'other'(死代码兜底永远走不到)", () => {
    expect(P.getDocCategory('')).toBe('')
  })
})

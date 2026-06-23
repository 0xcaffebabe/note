import { describe, it, expect } from 'vitest'
import { filterByDegree, createLinks, buildNodeMap, filterByCurrentDoc, countLinkDegrees, buildLinkNameMap } from '@/core/algorithm/KnowledgeGraph'
import { KnowledgeNode } from '@/core/domain/KnowledgeNode'

// A-B-C 链 + D 孤立
const net = (): KnowledgeNode[] => [
  { id: 'A', links: [{ name: 'b', id: 'B' }] },
  { id: 'B', links: [{ name: 'c', id: 'C' }] },
  { id: 'C' },
  { id: 'D' },
]

describe('countLinkDegrees 内/外链度数(含已知入度 bug)', () => {
  it('inLinks = 各节点 links.length(无 links 记 0)', () => {
    const { inLinks } = countLinkDegrees(net())
    expect(inLinks.get('A')).toBe(1)
    expect(inLinks.get('B')).toBe(1)
    expect(inLinks.get('C')).toBe(0)
    expect(inLinks.get('D')).toBe(0)
  })

  it('⚠️已知 BUG: outLinks 对 node.id 自增(应对 child.id 累真入度), 故 outLinks≡links.length 且真入度从未统计', () => {
    const { outLinks } = countLinkDegrees(net())
    // A 有 1 条出链 -> outLinks[A]=1(与 inLinks[A] 相等, 这正是 bug)
    expect(outLinks.get('A')).toBe(1)
    expect(outLinks.get('B')).toBe(1)
    // C 被 B 指向(真入度 1), 但 C 自身无出链, 故 outLinks 里根本没有 C —— 真入度丢失
    expect(outLinks.has('C')).toBe(false)
    expect(outLinks.has('D')).toBe(false)
  })
})

describe('buildLinkNameMap name -> 链接(后写覆盖)', () => {
  it('展平所有 links 按 name 建索引, 同名后者覆盖前者', () => {
    const nodes: KnowledgeNode[] = [
      { id: 'A', links: [{ name: 'b', id: 'B' }, { name: 'c', id: 'C' }] },
      { id: 'B', links: [{ name: 'c', id: 'C' }] },
    ]
    const map = buildLinkNameMap(nodes)
    expect([...map.keys()]).toEqual(['b', 'c'])
    expect(map.get('b')).toEqual({ name: 'b', id: 'B' })
    expect(map.get('c')).toEqual({ name: 'c', id: 'C' })
  })
})

describe('filterByDegree (BFS)', () => {
  it('degree<0 → 空', () => {
    expect(filterByDegree(net(), 'A', -1)).toEqual([])
  })
  it('degree=1 含直接邻居, 不含两跳外', () => {
    const ids = filterByDegree(net(), 'A', 1).map(n => n.id).sort()
    expect(ids).toEqual(['A', 'B'])
  })
  it('degree=2 经无向反向边可达 C', () => {
    const ids = filterByDegree(net(), 'A', 2).map(n => n.id).sort()
    expect(ids).toContain('C')
    expect(ids).not.toContain('D') // 孤立节点不可达
  })
})

describe('createLinks: 无向去重', () => {
  it('A→B 与 B→A 只产一条边', () => {
    const g: KnowledgeNode[] = [
      { id: 'A', links: [{ name: 'b', id: 'B' }] },
      { id: 'B', links: [{ name: 'a', id: 'A' }] },
    ]
    expect(createLinks(g)).toHaveLength(1)
  })
})

describe('buildNodeMap', () => {
  it('名→索引', () => {
    const m = buildNodeMap([{ name: 'x' }, { name: 'y' }])
    expect(m.get('x')).toBe(0)
    expect(m.get('y')).toBe(1)
  })
})

describe('filterByCurrentDoc', () => {
  it('只保留与当前文档相连的节点', () => {
    const ids = filterByCurrentDoc(net(), 'B').map(n => n.id).sort()
    expect(ids).toContain('A') // A→B
    expect(ids).toContain('B')
    expect(ids).not.toContain('D')
  })
})

import { describe, it, expect } from 'vitest'
import Category from '@/core/domain/Category'
import {
  parentChain, findByLink, countLeaves, firstLeafHtmlPath, adjacentByDocId, filterCategoryTree,
} from '@/core/util/CategoryUtils'

// 构造一棵小目录树: 运维 -> [Docker, K8s]; Java(叶)
function makeTree(): Category[] {
  const ops = new Category(); ops.name = '运维'; ops.link = ''
  const docker = new Category(); docker.name = 'Docker'; docker.link = '运维/Docker.md'; docker.parent = ops
  const k8s = new Category(); k8s.name = 'K8s'; k8s.link = '运维/K8s.md'; k8s.parent = ops
  ops.chidren = [docker, k8s]
  const java = new Category(); java.name = 'Java'; java.link = 'java/Java.md'
  return [ops, java]
}

describe('parentChain', () => {
  it('从叶子上溯返回 root→leaf', () => {
    const [ops] = makeTree()
    const docker = ops.chidren[0]
    expect(parentChain(docker).map(c => c.name)).toEqual(['运维', 'Docker'])
  })
})

describe('findByLink', () => {
  it('深度优先按 link 命中', () => {
    const tree = makeTree()
    expect(findByLink(tree, '运维/K8s.md')?.name).toBe('K8s')
    expect(findByLink(tree, '不存在')).toBeNull()
  })
})

describe('countLeaves', () => {
  it('统计有链接的节点(含自身)', () => {
    const [ops, java] = makeTree()
    expect(countLeaves(ops)).toBe(2) // Docker + K8s(ops 自身无 link)
    expect(countLeaves(java)).toBe(1)
  })
})

describe('firstLeafHtmlPath', () => {
  it('返回第一个有链接节点的 .html 路径', () => {
    const [ops] = makeTree()
    expect(firstLeafHtmlPath(ops)).toContain('.html')
    const empty = new Category(); empty.name = 'x'; empty.link = ''
    expect(firstLeafHtmlPath(empty)).toBe('')
  })
})

describe('adjacentByDocId', () => {
  it('取相邻上一/下一篇', () => {
    const a = new Category(); a.link = 'a/a.md'
    const b = new Category(); b.link = 'b/b.md'
    const c = new Category(); c.link = 'c/c.md'
    const list = [a, b, c]
    const { prev, next } = adjacentByDocId(list, 'b-b')
    expect(prev).toBe(a)
    expect(next).toBe(c)
    expect(adjacentByDocId(list, 'a-a').prev).toBeNull()
    expect(adjacentByDocId(list, 'c-c').next).toBeNull()
  })
})

describe('filterCategoryTree', () => {
  it('保留自身或后代命中的节点, 克隆不污染原树', () => {
    const tree = makeTree()
    const matcher = (c: Category) => c.name === 'Docker'
    const filtered = filterCategoryTree(tree, matcher)
    expect(filtered.map(c => c.name)).toEqual(['运维']) // Java 不含 Docker 被裁
    expect(filtered[0].chidren.map(c => c.name)).toEqual(['Docker'])
    // 原树未被改动
    expect(tree[0].chidren.length).toBe(2)
  })
  it('markShow=true 给克隆置 show', () => {
    const tree = makeTree()
    const filtered = filterCategoryTree(tree, () => true, true)
    expect(filtered[0].show).toBe(true)
  })
})

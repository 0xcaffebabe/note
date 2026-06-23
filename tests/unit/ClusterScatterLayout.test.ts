import { describe, it, expect } from 'vitest'
import { layoutClusters, assembleScatterPoints, buildClusterMeta } from '@/core/algorithm/ClusterScatterLayout'
import { l2normalize } from '@/core/algorithm/clusterMath'
import DocUtils from '@/core/util/DocUtils'
import type { ClusterScatterPoint } from '@/core/domain/ClusterScatterPoint'

const pt = (cluster: number, tags: string[]): ClusterScatterPoint =>
  ({ id: '', name: '', x: 0, y: 0, x3: 0, y3: 0, z3: 0, cluster, tags, size: 0 })

describe('buildClusterMeta 簇内高频 tag 自动命名', () => {
  it('取簇内最高频 tag 作 label, size=成员数', () => {
    const points = [pt(0, ['a', 'b']), pt(0, ['a']), pt(0, ['c'])]
    // a:2 b:1 c:1 -> label 'a'
    const meta = buildClusterMeta(points, 1)
    expect(meta).toEqual([{ id: 0, label: 'a', size: 3 }])
  })

  it('⚠️平手保留先见者(cnt > best 严格大于)', () => {
    // a 与 b 各 2 次; 迭代插入序 a 先于 b, 故 a 胜
    const points = [pt(0, ['a']), pt(0, ['a', 'b']), pt(0, ['b'])]
    expect(buildClusterMeta(points, 1)[0].label).toBe('a')
  })

  it('空簇走默认名且 size=0', () => {
    const meta = buildClusterMeta([pt(0, ['x'])], 2)
    expect(meta[0]).toEqual({ id: 0, label: 'x', size: 1 })
    // 簇 1 无成员 -> 默认名(含 2)+ size 0
    expect(meta[1].id).toBe(1)
    expect(meta[1].size).toBe(0)
    expect(meta[1].label).toMatch(/簇.*2/)
  })
})

// 守护从 generateClusterScatter 下沉到 core 的"簇感知两级布局 + 点塑形", 行为须与原内联一致。
// 红线: layoutClusters 绝不重算 kmeans(labels 必须入参); 确定性可复现(同输入 -> 同输出)。

describe('layoutClusters 形状与边界', () => {
  it('n=0 时按 dimsList 返回等长的空数组', () => {
    expect(layoutClusters([], [], 0, [2, 3])).toEqual([[], []])
  })

  it('每个请求维度返回 [n][dims] 坐标, 全为有限数', () => {
    const X = [[1, 0], [0.9, 0.1], [0, 1], [0.1, 0.9]].map(l2normalize)
    const labels = [0, 0, 1, 1]
    const [c2, c3] = layoutClusters(X, labels, 2, [2, 3])
    expect(c2).toHaveLength(4)
    expect(c3).toHaveLength(4)
    expect(c2.every(row => row.length === 2)).toBe(true)
    expect(c3.every(row => row.length === 3)).toBe(true)
    const finite = (m: number[][]) => m.every(row => row.every(v => Number.isFinite(v)))
    expect(finite(c2)).toBe(true)
    expect(finite(c3)).toBe(true)
  })

  it('确定性: 同一输入两次调用逐值相等(无随机, 可复现构建)', () => {
    const X = [[1, 0], [0.5, 0.5], [0, 1]].map(l2normalize)
    const labels = [0, 1, 1]
    expect(layoutClusters(X, labels, 2, [2, 3])).toEqual(layoutClusters(X, labels, 2, [2, 3]))
  })

  it('单成员簇直接落在锚点上(2D/3D 同源锚点)', () => {
    const X = [[1, 0], [0, 1]].map(l2normalize)
    const labels = [0, 1]
    const [c2] = layoutClusters(X, labels, 2, [2])
    // 两个簇各一个成员 => 各自落在自己簇锚点, 坐标有限且彼此不全等
    expect(c2[0].every(Number.isFinite) && c2[1].every(Number.isFinite)).toBe(true)
  })
})

describe('assembleScatterPoints 点塑形', () => {
  const files = ['doc/a.md', 'doc/b.md']
  const coords2 = [[1.234, 5.678], [9.999, 0.001]]
  const coords3 = [[1, 2, 3], [4, 5, 6]]
  const labels = [0, 1]
  const tags = [['x'], ['y', 'z']]
  const lens = [10, 30]

  it('id 走 docUrl2Id, name 为原始路径, cluster 取 labels, tags 透传', () => {
    const points = assembleScatterPoints(files, coords2, coords3, labels, tags, lens)
    expect(points).toHaveLength(2)
    expect(points[0].id).toBe(DocUtils.docUrl2Id('doc/a.md'))
    expect(points[0].name).toBe('doc/a.md')
    expect(points[0].cluster).toBe(0)
    expect(points[1].cluster).toBe(1)
    expect(points[0].tags).toEqual(['x'])
    expect(points[1].tags).toEqual(['y', 'z'])
  })

  it('坐标保留两位(r2 = round(v*100)/100)', () => {
    const points = assembleScatterPoints(files, coords2, coords3, labels, tags, lens)
    expect(points[0].x).toBe(1.23)
    expect(points[0].y).toBe(5.68)
    expect(points[1].x).toBe(10)   // 9.999 -> 10
    expect(points[1].y).toBe(0)    // 0.001 -> 0
    expect(points[0].x3).toBe(1)
    expect(points[0].z3).toBe(3)
  })

  it('size 由正文长度在 [minL,maxL] 归一编码: 最短=8, 最长=24', () => {
    const points = assembleScatterPoints(files, coords2, coords3, labels, tags, lens)
    expect(points[0].size).toBe(8)   // (8 + 0*16) = 8
    expect(points[1].size).toBe(24)  // (8 + 1*16) = 24
  })

  it('单文档时 rangeL 兜底为 1 不除零, size=8', () => {
    const points = assembleScatterPoints(['doc/a.md'], [[0, 0]], [[0, 0, 0]], [0], [[]], [42])
    expect(points).toHaveLength(1)
    expect(points[0].size).toBe(8)
  })
})

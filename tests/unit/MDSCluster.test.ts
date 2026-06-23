import { describe, it, expect } from 'vitest'
import { mdsND, scaleCoords, scaleRadiusND, COORD_RANGE } from '@/core/algorithm/MDS'
import { agglomerativeCluster } from '@/core/algorithm/HierarchicalCluster'
import ClusterNode from '@/core/domain/ClusterNode'

// 守护从 build 脚本下沉到 core 的纯算法(经典 MDS + 凝聚式层次聚类), 行为须与原内联一致。

describe('MDS scaleCoords 线性缩放到 [-COORD_RANGE, COORD_RANGE]', () => {
  it('min->-COORD_RANGE, max->+COORD_RANGE, 中点->0', () => {
    expect(scaleCoords([0, 50, 100])).toEqual([-COORD_RANGE, 0, COORD_RANGE])
  })
  it('全相等时 range 兜底为 1, 不除零', () => {
    // (5-5)/1*200-100 = -100, 三个都一样
    expect(scaleCoords([5, 5, 5])).toEqual([-COORD_RANGE, -COORD_RANGE, -COORD_RANGE])
  })
})

describe('mdsND 边界与形状', () => {
  it('n=0 返回 k 个空数组', () => {
    expect(mdsND([], 0, 3)).toEqual([[], [], []])
  })
  it('n=1 每维一个 0 坐标', () => {
    expect(mdsND([[0]], 1, 2)).toEqual([[0], [0]])
  })
  it('两点距离²矩阵 -> 1 维: 两坐标关于中心对称(和≈0), 间距≈距离', () => {
    // 距离 2 => D2=[[0,4],[4,0]]
    const coords = mdsND([[0, 4], [4, 0]], 2, 1)
    expect(coords.length).toBe(1)
    const [x0, x1] = coords[0]
    expect(x0 + x1).toBeCloseTo(0, 6)
    expect(Math.abs(x0 - x1)).toBeCloseTo(2, 4)
  })
})

describe('scaleRadiusND 居中并缩放到半径 R', () => {
  it('单维三点缩放后最大半径=R', () => {
    const out = scaleRadiusND([[0, 1, 2]], 10)
    // center=1, 偏移 [-1,0,1], maxr=1, s=10 => [-10,0,10]
    expect(out).toEqual([[-10, 0, 10]])
  })
})

describe('agglomerativeCluster 凝聚式层次聚类', () => {
  const node = (name: string) => { const n = new ClusterNode(); n.name = name; return n }

  it('最相似的两片先合并, 最终收敛为单棵树且不丢节点', () => {
    const nodes = [node('a'), node('b'), node('c')]
    // a-b 相似度高, 其余为 0
    const similar = (f1: string, f2: string) =>
      (f1 === 'a' && f2 === 'b') || (f1 === 'b' && f2 === 'a') ? 1 : 0
    const result = agglomerativeCluster(nodes, similar)
    expect(result.length).toBe(1)
    const root = result[0]
    // 三个叶子全部保留
    expect(root.all().sort()).toEqual(['a', 'b', 'c'])
    // a 与 b 被先配成一棵子树(根的某个孩子恰为 {a,b})
    const hasAB = root.children.some(ch => ch.all().sort().join() === 'a,b')
    expect(hasAB).toBe(true)
  })

  it('单节点直接返回自身', () => {
    const nodes = [node('only')]
    const result = agglomerativeCluster(nodes, () => 0)
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('only')
  })
})

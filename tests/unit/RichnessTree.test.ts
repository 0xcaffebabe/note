import { describe, it, expect } from 'vitest'
import { buildRichnessTree } from '@/core/category/RichnessTree'
import Category from '@/core/domain/Category'

// 守护从 build/DocService.generateKnwoledgeRichness 下沉到 core 的"丰富度树骨架 + 待读路径枚举"。
// 红线: 结构只搭不填 size(留驱动经 fs 端口回填); 无 link 节点子树照常递归但跳过自身 size 读;
// 待读路径 = './doc/' + decodeURI(link.substring(2))。

const cat = (name: string, link: string, chidren: Category[] = []): Category => {
  const c = new Category()
  c.name = name
  c.link = link
  c.chidren = chidren
  return c
}

describe('buildRichnessTree 目录树 -> 丰富度骨架', () => {
  it('roots 结构镜像目录树, 所有 size 初始为 0(不在 core 填充)', () => {
    const { roots } = buildRichnessTree([cat('Java', './java/README.md')])
    expect(roots).toHaveLength(1)
    expect(roots[0].name).toBe('Java')
    expect(roots[0].link).toBe('./java/README.md')
    expect(roots[0].size).toBe(0)
    expect(roots[0].chidren).toEqual([])
  })

  it('有 link 的节点产出待读请求, 路径 = ./doc/ + decodeURI(link.substring(2))', () => {
    const { reads } = buildRichnessTree([cat('Java', './java/README.md')])
    expect(reads).toHaveLength(1)
    expect(reads[0].path).toBe('./doc/java/README.md')
  })

  it('decodeURI: 百分号编码的中文链接被解码进路径', () => {
    // './%E8%BF%90%E7%BB%B4/README.md' -> substring(2) 去掉 './' -> decodeURI -> '运维/README.md'
    const { reads } = buildRichnessTree([cat('运维', './%E8%BF%90%E7%BB%B4/README.md')])
    expect(reads[0].path).toBe('./doc/运维/README.md')
  })

  it('⚠️无 link 的 section: 子树照常递归, 但自身不产出待读请求(size 留 0)', () => {
    const section = cat('数学', '', [cat('代数', './shuxue/daishu.md')])
    const { roots, reads } = buildRichnessTree([section])
    // 结构: section 在 roots, 其子 代数 也在
    expect(roots[0].name).toBe('数学')
    expect(roots[0].chidren[0].name).toBe('代数')
    // 待读请求只含有 link 的 代数, 不含无 link 的 section
    expect(reads).toHaveLength(1)
    expect(reads[0].node.name).toBe('代数')
    expect(reads.some(r => r.node.name === '数学')).toBe(false)
  })

  it('reads.node 指向 roots 树内同一对象(回填 size 即改树)', () => {
    const { roots, reads } = buildRichnessTree([cat('Java', './java/README.md')])
    reads[0].node.size = 123
    expect(roots[0].size).toBe(123)
  })

  it('多顶级节点按目录序; reads 按 DFS(子先于父)枚举', () => {
    const section = cat('数学', '', [cat('代数', './m/a.md')])
    const java = cat('Java', './java/README.md')
    const { reads } = buildRichnessTree([section, java])
    // section(index0) 先递归 -> 代数先入; java(index1) 后入
    expect(reads.map(r => r.node.name)).toEqual(['代数', 'Java'])
  })
})

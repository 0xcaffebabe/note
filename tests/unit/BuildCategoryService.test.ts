/**
 * 针对构建期 src/build/CategoryService.ts 中抽出的纯函数 seam:
 *   parseSummary(md)      —— SUMMARY.md 文本 → 嵌套目录树(marked 渲染 + JSDOM 解析)
 *   categoryParse(html)   —— 已渲染 HTML → 顶级 li 列表 → Category[]
 *   resolveCategory(li)   —— 单个 <li> 递归还原为 Category(供 categoryParse 调用, 此处间接验证)
 *
 * 这是构建脚本边界(node 环境, 直接 new JSDOM, 不走浏览器 DOMParser), 故放 tests/unit。
 * 与 tests/component/CategoryService.test.ts 不同: 那个测的是 src/service 版(会回填 parent 反向引用),
 * 本文件测的是 src/build 版 —— 其 resolveCategory 的 c.parent = category 一行是被注释掉的,
 * 因此构建期目录树的所有节点 parent 恒为 undefined。下方"已知行为"用例对此显式刻画。
 *
 * 真实输出已用 npx tsx 探测确认:
 *  - marked 会把中文链接百分号编码(运维 → %E8%BF%90%E7%BB%B4)
 *  - 空 / 非列表 markdown → []
 *  - 纯文本分组节点(无自身 [](link))其 link 回退为后代第一个 <a> 的 href
 */
import { describe, it, expect } from 'vitest'
import { parseSummary as parseSummaryCore, categoryParse as categoryParseCore } from '@/core/category/SummaryParse'
import { nodeMarkdown } from '@/adapters/node/NodeMarkdownAdapter'
import { nodeDomParser } from '@/adapters/node/NodeDomParser'
import { marked } from 'marked'
import Category from '@/core/domain/Category'

// 解析已下沉 core/category/SummaryParse(端口注入); 测试用 node 适配器装配, 调用点保持不变。
const parseSummary = (md: string) => parseSummaryCore(md, nodeMarkdown, nodeDomParser)
const categoryParse = (html: string) => categoryParseCore(html, nodeDomParser)

describe('parseSummary: SUMMARY.md → 嵌套目录树', () => {
  const md = `* [运维](运维/README.md)
  * [Docker](运维/Docker.md)
  * [Kubernetes](运维/Kubernetes.md)
* [Java](java/README.md)
`

  it('解析出 2 个顶级节点(不再注入"首页", 那是 getCategoryList 的职责)', () => {
    const tree = parseSummary(md)
    expect(tree).toHaveLength(2)
    expect(tree[0].name).toBe('运维')
    expect(tree[1].name).toBe('Java')
  })

  it('返回的是 Category 实例(带 chidren/show/link 字段)', () => {
    const tree = parseSummary(md)
    expect(tree[0]).toBeInstanceOf(Category)
    expect(tree[0].show).toBe(false)
    expect(Array.isArray(tree[0].chidren)).toBe(true)
  })

  it('保留兄弟节点的书写顺序', () => {
    const ordered = parseSummary(`* [一](1.md)
* [二](2.md)
* [三](3.md)
`)
    expect(ordered.map((c) => c.name)).toEqual(['一', '二', '三'])
  })

  it('递归解析子节点, 顺序保留', () => {
    const tree = parseSummary(md)
    const ops = tree[0]
    expect(ops.chidren).toHaveLength(2)
    expect(ops.chidren[0].name).toBe('Docker')
    expect(ops.chidren[1].name).toBe('Kubernetes')
  })

  it('叶子节点 chidren 为空数组', () => {
    const tree = parseSummary(md)
    expect(tree[1].chidren).toEqual([]) // Java 无子节点
    expect(tree[0].chidren[0].chidren).toEqual([]) // Docker 无子节点
  })

  it('支持三层及以上深度嵌套', () => {
    const deep = parseSummary(`* [L1](l1.md)
  * [L2](l2.md)
    * [L3](l3.md)
`)
    expect(deep[0].name).toBe('L1')
    expect(deep[0].chidren[0].name).toBe('L2')
    expect(deep[0].chidren[0].chidren[0].name).toBe('L3')
    expect(deep[0].chidren[0].chidren[0].link).toBe('l3.md')
  })
})

describe('parseSummary: 链接与标题解析', () => {
  it('从 <a href> 取 link, ASCII 链接原样保留', () => {
    const tree = parseSummary(`* [Java](java/README.md)\n`)
    expect(tree[0].link).toBe('java/README.md')
  })

  it('中文链接被 marked 百分号编码后写入 link', () => {
    const tree = parseSummary(`* [运维](运维/README.md)\n`)
    // 运维 → %E8%BF%90%E7%BB%B4
    expect(tree[0].link).toContain('%E8%BF%90%E7%BB%B4')
    expect(tree[0].link).toContain('README.md')
  })

  it('name 取自节点首个子节点的文本(<a> 的链接文字)', () => {
    const tree = parseSummary(`* [显示标题](x.md)\n`)
    expect(tree[0].name).toBe('显示标题')
  })

  it('带自身链接且含子节点: link 来自自身 <a>, 同时保留子节点', () => {
    const tree = parseSummary(`* [父带链接](p/README.md)
  * [子](p/c.md)
`)
    expect(tree[0].name).toBe('父带链接')
    expect(tree[0].link).toBe('p/README.md')
    expect(tree[0].chidren).toHaveLength(1)
    expect(tree[0].chidren[0].link).toBe('p/c.md')
  })

  it('纯文本分组节点(无自身 [](link)): name 为文本, link 回退为后代首个 <a> 的 href', () => {
    const tree = parseSummary(`* 纯文本分组
  * [子文档](g/sub.md)
`)
    expect(tree[0].name).toBe('纯文本分组')
    // resolveCategory 在有子节点时, link = :first-child[href] || :first-child a[href]
    // 此处 :first-child 是文本节点经 marked 后的结构, 实测回退为后代第一个 <a>
    expect(tree[0].link).toBe('g/sub.md')
    expect(tree[0].chidren.map((c) => c.name)).toEqual(['子文档'])
  })
})

describe('parseSummary: 空与非列表输入', () => {
  it('空字符串 → []', () => {
    expect(parseSummary('')).toEqual([])
  })

  it('纯段落文本(非列表) → []', () => {
    expect(parseSummary('just a paragraph')).toEqual([])
  })

  it('标题(非列表) → []', () => {
    expect(parseSummary('# Title')).toEqual([])
  })

  it('仅空白 → []', () => {
    expect(parseSummary('   \n   \n')).toEqual([])
  })
})

describe('parseSummary 已知行为: 构建期目录树不回填 parent', () => {
  it('已知 BUG/行为: build 版 resolveCategory 的 c.parent=category 被注释, 所有节点 parent 恒为 undefined', () => {
    const tree = parseSummary(`* [运维](ops/README.md)
  * [Docker](ops/Docker.md)
`)
    expect(tree[0].parent).toBeUndefined()
    expect(tree[0].chidren[0].parent).toBeUndefined()
  })
})

describe('categoryParse: 直接喂 marked 渲染后的 HTML 也产出同样结构', () => {
  it('parseSummary(md) 等价于 categoryParse(marked(md))', () => {
    const md = `* [运维](ops/README.md)
  * [Docker](ops/Docker.md)
* [Java](java/README.md)
`
    const viaSummary = parseSummary(md)
    const viaHtml = categoryParse(marked(md) as string)
    const shape = (t: Category[]): any[] =>
      t.map((c) => ({ name: c.name, link: c.link, chidren: shape(c.chidren) }))
    expect(shape(viaHtml)).toEqual(shape(viaSummary))
  })

  it('非 body>ul>li 的孤立 HTML → []', () => {
    expect(categoryParse('<p>hello</p>')).toEqual([])
  })
})

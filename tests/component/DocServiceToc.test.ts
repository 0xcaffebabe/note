import { describe, it, expect, beforeEach, vi } from 'vitest'

/*
 * 为什么重要：getContent(docHtml) 是文档目录(TOC)/脑图/分段渲染的根基。
 * 它把一篇已渲染的 HTML 里的 h1-h6 按层级还原成 Content 树:
 *   - 第一个出现的标题层级即“顶级层级”(topLevel)，同层级标题成为兄弟根；
 *   - 更深的标题通过一个按 level 索引的 contentMap 找“最近的更浅祖先”挂上去；
 *   - 标题名取各子节点文本拼接，但要剔除 <sup> 角标与 .heading-anchor 锚点图标；
 *   - link 取标题的 id 属性。
 * 该树一旦行为漂移，目录缩进/锚点跳转/脑图结构都会静默错乱，故在此锁定现状，
 * 并对一个已知的“跨树脏 contentMap”缺陷写特征化测试(锁定当前真实行为)。
 *
 * 测试环境说明：DocService 是模块加载即构造的单例，导入它会顺带 new 出
 * TagService / KnowledgeNetworkService，二者构造函数会 fire-and-forget 调
 * api.getTagMapping / getDocTagPrediction / getKnowledgeNetwork。故在导入前于
 * 网络边界 mock 掉 '@/api'，让 init 顺利完成。getContent 自身仅依赖 DOMParser，
 * 无网络/文件副作用，本套件因此放在 component(jsdom) 工程。
 *
 * getContent 被 @cacheByHtml 修饰(以整段 html 字符串为缓存键)。每个用例已使用
 * 不同的 html，理论上互不命中；仍在 beforeEach 清空 CacheService 以彻底隔离。
 */

const { fakeEmpty } = vi.hoisted(() => ({ fakeEmpty: () => Promise.resolve([]) }))
vi.mock('@/api', () => ({
  default: {
    getTagMapping: fakeEmpty,
    getDocTagPrediction: fakeEmpty,
    getKnowledgeNetwork: fakeEmpty,
    getDocQualityData: fakeEmpty,
  },
}))

import docService from '@/service/DocService'
import CacheService from '@/service/CacheService'
import type Content from '@/dto/Content'

const getContent = (html: string): Content[] => (docService as any).getContent(html)

beforeEach(() => CacheService.getInstance().clear())

describe('DocService.getContent 目录树构建', () => {
  it('无任何标题时返回空数组', () => {
    expect(getContent('<p>只有正文 没有标题</p>')).toEqual([])
    expect(getContent('')).toEqual([])
  })

  it('单个标题成为唯一根节点, link 取 id, level 取标签数字', () => {
    const r = getContent('<h1 id="a">A</h1><p>正文</p>')
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('A')
    expect(r[0].link).toBe('a')
    expect(r[0].level).toBe(1)
    expect(r[0].chidren).toEqual([])
  })

  it('h1>h2>h3 逐层嵌套: 每个更深标题挂到上一层标题下', () => {
    const r = getContent('<h1 id="a">A</h1><h2 id="b">B</h2><h3 id="c">C</h3>')
    expect(r).toHaveLength(1)
    expect(r[0].link).toBe('a')
    expect(r[0].chidren).toHaveLength(1)
    expect(r[0].chidren[0].link).toBe('b')
    expect(r[0].chidren[0].chidren).toHaveLength(1)
    expect(r[0].chidren[0].chidren[0].link).toBe('c')
    expect(r[0].chidren[0].chidren[0].level).toBe(3)
  })

  it('同一父级下的多个同层标题成为兄弟孩子', () => {
    const r = getContent('<h1 id="a">A</h1><h2 id="b">B</h2><h2 id="c">C</h2>')
    expect(r).toHaveLength(1)
    expect(r[0].chidren.map((c) => c.link)).toEqual(['b', 'c'])
    expect(r[0].chidren.every((c) => c.level === 2)).toBe(true)
  })

  it('多个顶级标题各自成为兄弟根节点', () => {
    const r = getContent('<h1 id="a">A</h1><h1 id="b">B</h1>')
    expect(r).toHaveLength(2)
    expect(r.map((c) => c.link)).toEqual(['a', 'b'])
    expect(r.every((c) => c.chidren.length === 0)).toBe(true)
  })

  it('h1 下先 h2>h3 再回到 h2: 第二个 h2 与第一个 h2 同级而非嵌在 h3 下', () => {
    const r = getContent('<h1 id="a">A</h1><h2 id="b">B</h2><h3 id="c">C</h3><h2 id="d">D</h2>')
    expect(r).toHaveLength(1)
    expect(r[0].chidren.map((c) => c.link)).toEqual(['b', 'd'])
    // C 仍嵌在 B 下
    expect(r[0].chidren[0].chidren.map((c) => c.link)).toEqual(['c'])
    expect(r[0].chidren[1].chidren).toEqual([])
  })
})

describe('DocService.getContent 层级跳变: 挂到最近的更浅祖先', () => {
  it('h2->h4 跳过 h3, h4 仍挂到最近的更浅祖先 h2', () => {
    const r = getContent('<h2 id="a">A</h2><h4 id="b">B</h4>')
    expect(r).toHaveLength(1)
    expect(r[0].level).toBe(2) // 第一个标题是 h2 -> topLevel=2
    expect(r[0].chidren.map((c) => c.link)).toEqual(['b'])
    expect(r[0].chidren[0].level).toBe(4)
  })

  it('h2->h3->h5 多次跳级: h5 挂到最近的更浅祖先 h3', () => {
    const r = getContent('<h2 id="a">A</h2><h3 id="b">B</h3><h5 id="c">C</h5>')
    expect(r).toHaveLength(1)
    expect(r[0].chidren[0].link).toBe('b')
    expect(r[0].chidren[0].chidren.map((c) => c.link)).toEqual(['c'])
    expect(r[0].chidren[0].chidren[0].level).toBe(5)
  })
})

describe('DocService.getContent topLevel 由第一个标题决定', () => {
  it('从 h3 起步: h3 即顶级, 后续同为 h3 的标题成为兄弟根', () => {
    const r = getContent('<h3 id="a">A</h3><h4 id="b">B</h4><h3 id="c">C</h3>')
    expect(r).toHaveLength(2) // 两个 h3 都是顶级
    expect(r.map((c) => c.link)).toEqual(['a', 'c'])
    expect(r[0].level).toBe(3)
    // h4 挂在第一个 h3 下
    expect(r[0].chidren.map((c) => c.link)).toEqual(['b'])
    expect(r[1].chidren).toEqual([])
  })

  it('首个标题更深(h1)而后续更浅同样可作兄弟根: h1 顶级 / 中间 h3 嵌入 / 末尾 h1 成兄弟根', () => {
    const r = getContent('<h1 id="a">A</h1><h3 id="b">B</h3><h1 id="c">C</h1>')
    expect(r).toHaveLength(2)
    expect(r.map((c) => c.link)).toEqual(['a', 'c'])
    expect(r[0].chidren.map((c) => c.link)).toEqual(['b']) // h3 挂在第一个 h1 下
    expect(r[1].chidren).toEqual([])
  })
})

describe('DocService.getContent 标题名: 剔除 SUP 与 .heading-anchor 后拼接文本', () => {
  it('剔除 <sup> 角标与 .heading-anchor 锚点, 保留其余文本', () => {
    const r = getContent('<h1 id="a">Title<sup>note</sup><a class="heading-anchor">#</a> end</h1>')
    expect(r[0].name).toBe('Title end')
    expect(r[0].name).not.toContain('note')
    expect(r[0].name).not.toContain('#')
  })

  it('多个 <sup> 全部剔除', () => {
    const r = getContent('<h1 id="a">T<sup>1</sup>x<sup>2</sup></h1>')
    expect(r[0].name).toBe('Tx')
  })

  it('非 sup/锚点的内联元素(code/strong)文本被保留拼接', () => {
    const r = getContent('<h1 id="a">Hello <code>x</code> <strong>y</strong></h1>')
    expect(r[0].name).toBe('Hello x y')
  })
})

describe('DocService.getContent 缺省/异常输入', () => {
  it('标题缺少 id 属性时 link 为 null(getAttribute 直接透传)', () => {
    // 源码用 head.getAttribute("id")! 非空断言, 但运行时无 id 实为 null
    const r = getContent('<h1>NoId</h1><h2 id="b">B</h2>')
    expect(r).toHaveLength(1)
    expect(r[0].link).toBeNull()
    expect(r[0].name).toBe('NoId')
    expect(r[0].chidren.map((c) => c.link)).toEqual(['b'])
  })
})

describe('DocService.getContent 已知 BUG: 新顶级标题不重置 contentMap 造成跨树误挂', () => {
  it('已知 BUG: 第二个顶级 h1 后的更深 h3 被错误挂到第一个顶级树里的陈旧 h2 下(应挂到第二个 h1)', () => {
    // 输入逻辑期望: D(h3) 出现在 C(第二个 h1) 之后, 理应是 C 的后代。
    // 但 contentMap 以 level 为下标且从不在新顶级出现时清空, contentMap[2] 仍指向
    // 第一个树里的 B(h2)。挂载循环从 level-1 向下找首个存在项, 命中陈旧的 B,
    // 于是 D 被错误地挂进 A(第一个 h1) 的子树, 而第二个根 C 反而没有孩子。
    const r = getContent('<h1 id="a">A</h1><h2 id="b">B</h2><h1 id="c">C</h1><h3 id="d">D</h3>')
    expect(r).toHaveLength(2)
    expect(r.map((c) => c.link)).toEqual(['a', 'c'])
    // 当前真实(错误)行为: D 挂在第一棵树 A>B 之下
    expect(r[0].chidren[0].link).toBe('b')
    expect(r[0].chidren[0].chidren.map((c) => c.link)).toEqual(['d'])
    // 第二个根 C 没有孩子(本应包含 D)
    expect(r[1].chidren).toEqual([])
  })
})

describe('DocService.getContent @cacheByHtml 缓存', () => {
  it('同一 html 二次调用返回同一引用(命中缓存)', () => {
    const html = '<h1 id="a">A</h1><h2 id="b">B</h2>'
    const first = getContent(html)
    const second = getContent(html)
    expect(second).toBe(first) // 缓存返回的是同一对象引用
  })

  it('清空缓存后重新构建, 结构相同但为不同引用', () => {
    const html = '<h1 id="a">A</h1>'
    const first = getContent(html)
    CacheService.getInstance().clear()
    const rebuilt = getContent(html)
    expect(rebuilt).not.toBe(first)
    expect(rebuilt.map((c) => c.link)).toEqual(first.map((c) => c.link))
  })
})

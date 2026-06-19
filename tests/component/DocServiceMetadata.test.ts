import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

/*
 * 覆盖 DocService 的"元数据 / 质量 / 摘要 / 相似文档"一族纯逻辑方法:
 *   resolveMetadata     —— 客户端解析 YAML 头并对缺省字段填默认值(EMPTY_DOC_METADATA)
 *   resolveTagList      —— 从 YAML 取 tags(无 tags 时的降级)
 *   calcQuanlityStr     —— 中位数 + 排名 + 百分比的格式化(依赖一次性懒加载的质量数据)
 *   getDocQuality       —— Map 查表(命中/未命中)
 *   getImageUrlList     —— 从 HTML 抽 .img-wrapper 内 <img> 的 src(DOMParser)
 *   resolveLinkList     —— 从 HTML 抽全部 <a> 的 href(DOMParser)
 *   buildSummaryDocInfo —— 入度/出度 + 时间/字数/质量的字符串拼接(含时区敏感片段)
 *   getSimliarDoc       —— 在聚类树上"向上爬 round 级祖先再取该祖先全部后代"的相似检索
 *
 * 为什么放在 component(jsdom): DocService 默认导出是单例, 导入即透传构造 TagService /
 * KnowledgeNetworkService, 二者构造函数会 fire-and-forget 调 api.getTagMapping /
 * getDocTagPrediction / getKnowledgeNetwork; 多个方法又用 DOMParser/localStorage。
 * 因此在导入前于网络边界 vi.mock('@/api') 提供可控假数据, 保证这些 init() 不报错。
 *
 * 质量数据(getDocQuality / calcQuanlityStr)由 ensureQualityLoaded() 懒加载, 且带
 * qualityRequested 一次性闸门: 整个进程内只会真正 init 一次。因此本文件在 beforeAll 里
 * 用固定一份质量数据触发一次加载, 之后所有质量断言都基于这同一份数据。
 *
 * 时区: buildSummaryDocInfo 用 toLocaleString() 产出本地化时间字符串, 断言只校验结构/
 * 子串/数字, 绝不硬编码地区化文本。
 */

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    // TagService / KnowledgeNetworkService 构造期会调用这些 给空数组即可让 init 成功
    getTagMapping: vi.fn().mockResolvedValue([]),
    getDocTagPrediction: vi.fn().mockResolvedValue([]),
    getKnowledgeNetwork: vi.fn().mockResolvedValue([]),
    // 质量数据 & 聚类树 按用例需要再设
    getDocQualityData: vi.fn().mockResolvedValue([]),
    getDocCluster: vi.fn().mockResolvedValue([{ name: 'root', children: [] }]),
  },
}))
vi.mock('@/api', () => ({ default: apiMock }))

import docService from '@/service/DocService'
import CacheService from '@/service/CacheService'
import DocUtils from '@/util/DocUtils'

const flush = () => new Promise((r) => setTimeout(r, 0))

// 质量数据为一次性懒加载: 全局只 init 一次, 这里在所有用例之前固定一份(中位数=2 便于得到整百分比)
const QUALITY = [
  { id: 'a', quality: 1.0 }, // 1/2 -> 50%
  { id: 'b', quality: 2.0 }, // 2/2 -> 100% (中位数本身)
  { id: 'c', quality: 3.0 }, // 3/2 -> 150%
]

beforeAll(async () => {
  apiMock.getDocQualityData.mockResolvedValue(QUALITY)
  docService.ensureQualityLoaded()
  await flush()
})

// @cache 装饰的方法以 JSON.stringify(arguments) 或自定义键记忆, 单例共享缓存 -> 每例清空
beforeEach(() => CacheService.getInstance().clear())

describe('DocService.resolveMetadata 客户端解析与默认值填充', () => {
  it('空 metadata 字符串 -> 返回完整默认值(EMPTY_DOC_METADATA 形状)', () => {
    const meta = docService.resolveMetadata({ id: 'meta-empty', metadata: '' } as any)
    expect(meta).toMatchObject({
      tags: [],
      books: [],
      name: '',
      level: 3, // 默认知识层级为 3
      links: [],
      standardName: '',
      alias: [],
    })
  })

  it('部分字段的 YAML -> 保留已给字段, 缺失字段填默认值', () => {
    const meta = docService.resolveMetadata({
      id: 'meta-partial',
      metadata: 'name: Hi\nlevel: 5',
    } as any)
    expect(meta.name).toBe('Hi')
    expect(meta.level).toBe(5)
    // 未给的字段被补默认值
    expect(meta.tags).toEqual([])
    expect(meta.books).toEqual([])
    expect(meta.links).toEqual([])
    expect(meta.standardName).toBe('')
    expect(meta.alias).toEqual([])
  })

  it('提供 tags 数组 -> 原样保留', () => {
    const meta = docService.resolveMetadata({
      id: 'meta-tags',
      metadata: 'tags:\n  - java\n  - spring',
    } as any)
    expect(meta.tags).toEqual(['java', 'spring'])
    // 其余仍补默认
    expect(meta.level).toBe(3)
  })

  it('字面量字符串 "undefined" -> 走 == "undefined" 分支返回默认值', () => {
    // yaml.load('undefined') 返回字符串 'undefined', 命中源码里的 metadata == 'undefined' 判断
    const meta = docService.resolveMetadata({ id: 'meta-undef', metadata: 'undefined' } as any)
    expect(meta).toMatchObject({ tags: [], level: 3, name: '' })
  })

  it('level: 0 这类合法 falsy 值被原样保留(不被默认值覆盖)', () => {
    // 判空用 == null(undefined/null)而非 !value, 故显式提供的 level:0 不会被当作"未设置"
    const meta = docService.resolveMetadata({ id: 'meta-zero', metadata: 'level: 0' } as any)
    expect(meta.level).toBe(0)
  })
})

describe('DocService.resolveTagList 标签解析降级', () => {
  it('含 tags -> 返回标签数组', () => {
    const tags = docService.resolveTagList({
      id: 'tl-1',
      metadata: 'tags:\n  - a\n  - b',
    } as any)
    expect(tags).toEqual(['a', 'b'])
  })

  it('无 tags 字段 -> 返回 undefined(json?.tags 为 undefined)', () => {
    const tags = docService.resolveTagList({ id: 'tl-2', metadata: 'name: X' } as any)
    expect(tags).toBeUndefined()
  })

  it('空 metadata -> 返回 undefined', () => {
    const tags = docService.resolveTagList({ id: 'tl-3', metadata: '' } as any)
    expect(tags).toBeUndefined()
  })
})

describe('DocService 质量: getDocQuality / calcQuanlityStr', () => {
  it('getDocQuality 命中 -> 返回该文档质量对象', () => {
    expect(docService.getDocQuality('a')).toMatchObject({ id: 'a', quality: 1 })
  })

  it('getDocQuality 未命中 -> 返回 null', () => {
    expect(docService.getDocQuality('not-exist')).toBeNull()
  })

  it('calcQuanlityStr: quality.toFixed(2)(排名/总数, 相对中位数百分比)', () => {
    // 数据 [1,2,3] 中位数=2, a 排第 1, 1/2*100=50%
    expect(docService.calcQuanlityStr('a')).toBe('1.00(1/3, 50%)')
  })

  it('calcQuanlityStr: 中位数文档自身为 100%', () => {
    expect(docService.calcQuanlityStr('b')).toBe('2.00(2/3, 100%)')
  })

  it('calcQuanlityStr: 高于中位数 -> 百分比 > 100', () => {
    expect(docService.calcQuanlityStr('c')).toBe('3.00(3/3, 150%)')
  })

  it('calcQuanlityStr: 无质量数据的文档 -> "未知"', () => {
    expect(docService.calcQuanlityStr('zzz')).toBe('未知')
  })
})

describe('DocService.getImageUrlList DOM 抽取图片', () => {
  it('只取 .img-wrapper 内的 <img> src, 忽略游离 <img>', () => {
    const html =
      '<div class="img-wrapper"><img src="/a.png"></div>' +
      '<img src="/loose.png">' + // 不在 .img-wrapper 内 -> 被忽略
      '<div class="img-wrapper"><img src="/b.png"></div>'
    expect(docService.getImageUrlList(html)).toEqual(['/a.png', '/b.png'])
  })

  it('img 无 src 属性 -> 该项为空字符串', () => {
    const html = '<div class="img-wrapper"><img></div>'
    expect(docService.getImageUrlList(html)).toEqual([''])
  })

  it('无图片 -> 返回空数组', () => {
    expect(docService.getImageUrlList('<p>纯文本</p>')).toEqual([])
  })
})

describe('DocService.resolveLinkList DOM 抽取链接', () => {
  it('抽取全部 <a> 的 href', () => {
    const html = '<a href="/p1.html">链接1</a><a href="https://x.com">外链</a>'
    const r = docService.resolveLinkList(html)
    expect(r.map((v) => v.link)).toEqual(['/p1.html', 'https://x.com'])
  })

  it('<a> 无 href -> link 为空字符串', () => {
    const r = docService.resolveLinkList('<a>无 href</a>')
    expect(r).toHaveLength(1)
    expect(r[0].link).toBe('')
  })

  it('无 <a> -> 返回空数组', () => {
    expect(docService.resolveLinkList('<p>无链接</p>')).toEqual([])
  })

  it('已知 BUG/环境局限: jsdom 未实现 HTMLElement.innerText, 故每项 text 为 undefined', () => {
    // 源码用 i.innerText 取链接文字; jsdom 下 innerText 恒为 undefined(浏览器中才有值)
    // 这里固化"当前(测试环境)真实行为", 提醒该字段在 jsdom 不可用
    const r = docService.resolveLinkList('<a href="/p.html">显示文字</a>')
    expect(r[0].text).toBeUndefined()
    expect(r[0].link).toBe('/p.html')
  })
})

describe('DocService.buildSummaryDocInfo 摘要拼接(时区敏感, 松断言)', () => {
  function makeFile(over: Record<string, any> = {}) {
    return {
      name: '示例文档',
      id: 'x-t',
      content: 'hello world 内容',
      metadata: 'tags:\n  - java\n  - spring',
      createTime: '2020-01-01T00:00:00.000Z',
      commitList: [{ date: '2020-06-01T00:00:00.000Z' }],
      ...over,
    } as any
  }

  it('不传知识网络: 含标题/创建时间/更新时间/字数, 不含入度出度行', () => {
    const html = docService.buildSummaryDocInfo(makeFile())
    expect(html).toContain('<p>示例文档(x-t)</p>')
    expect(html).toContain('创建时间:')
    expect(html).toContain('最后更新:')
    // cleanText('hello world 内容') 去符号/空白后为 'helloworld内容' = 12 字
    expect(html).toContain('✏️12字')
    // 标签来自 metadata
    expect(html).toContain('java')
    expect(html).toContain('spring')
    // 未传 knowledgeNetwork -> 不渲染入度/出度
    expect(html).not.toContain('入度')
  })

  it('创建/更新时间是合法本地化时间字符串(用 Date 往返校验, 不硬编码地区文本)', () => {
    const html = docService.buildSummaryDocInfo(makeFile())
    // 取"创建时间: "之后到行尾的片段, 应能被 Date 解析为 2020-01-01 那一刻
    const m = html.match(/创建时间:\s*(.+?)<\/div>/)
    expect(m).not.toBeNull()
    const parsed = new Date(m![1])
    expect(parsed.getFullYear()).toBe(2020)
    expect(parsed.getMonth()).toBe(0) // 一月
  })

  it('"N天前更新" 是基于 commitList[0].date 与当前时间的向上取整正数', () => {
    const html = docService.buildSummaryDocInfo(makeFile())
    const m = html.match(/⏰(\d+)天前更新/)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeGreaterThan(0)
  })

  it('传知识网络: 渲染入度/出度(出度=本节点 links 数, 入度=指向本节点的去重节点数)', () => {
    const net = [
      { id: 'x-t', links: [{ id: 'a' }, { id: 'b' }] }, // 出度 2
      { id: 'p', links: [{ id: 'x-t' }] }, // 指向 x-t
      { id: 'q', links: [{ id: 'x-t' }] }, // 指向 x-t
    ]
    const html = docService.buildSummaryDocInfo(makeFile(), net as any)
    expect(html).toContain('入度: 2, 出度: 2')
  })

  it('传知识网络但本节点不在图中: 入度/出度均为 0', () => {
    const html = docService.buildSummaryDocInfo(makeFile(), [] as any)
    expect(html).toContain('入度: 0, 出度: 0')
  })

  it('质量片段: 该文档不在质量表中 -> ⚽未知', () => {
    // makeFile id 为 x-t, 未在 QUALITY([a,b,c]) 中
    const html = docService.buildSummaryDocInfo(makeFile())
    expect(html).toContain('⚽未知')
  })

  it('质量片段: 文档在质量表中 -> 显示格式化质量串', () => {
    const html = docService.buildSummaryDocInfo(makeFile({ id: 'a' }))
    expect(html).toContain('⚽1.00(1/3, 50%)')
  })
})

describe('DocService.getSimliarDoc 聚类树向上爬祖先取相似文档', () => {
  it('目标位于二级(root->A->目标): node 上爬到 root, 返回 root 全部后代(剔除目标自身)', async () => {
    const tree = {
      name: 'root',
      children: [
        {
          name: '/group/A.md',
          children: [
            { name: '/x/t.md', children: [] }, // 目标 id = x-t
            { name: '/x/sib.md', children: [] },
          ],
        },
        { name: '/group/B.md', children: [{ name: '/y/b1.md', children: [] }] },
      ],
    }
    apiMock.getDocCluster.mockResolvedValueOnce([tree])
    const targetId = DocUtils.docUrl2Id('/x/t.md')
    expect(targetId).toBe('x-t')
    const r = await docService.getSimliarDoc(targetId)
    // 已探明的真实行为: round 从 3 起, 二级目标会把 node 爬到 root, all(root) 含 root 名及全部后代
    expect(r).toEqual([
      'root',
      '/group/A.md',
      '/x/sib.md',
      '/group/B.md',
      '/y/b1.md',
    ])
    // 目标自身被过滤掉
    expect(r).not.toContain('/x/t.md')
  })

  it('目标更深(>3 级): node 被 round 限制只上爬 3 级祖先', async () => {
    const tree = {
      name: 'root',
      children: [
        {
          name: 'L1',
          children: [
            {
              name: 'L2',
              children: [
                {
                  name: 'L3',
                  children: [
                    { name: '/x/deep.md', children: [] }, // 目标
                    { name: '/x/deepsib.md', children: [] },
                  ],
                },
                { name: '/x/l2sib.md', children: [] },
              ],
            },
          ],
        },
      ],
    }
    apiMock.getDocCluster.mockResolvedValueOnce([tree])
    const targetId = DocUtils.docUrl2Id('/x/deep.md')
    const r = await docService.getSimliarDoc(targetId)
    // node 爬到 L1(三级祖先), all(L1) 含 L1/L2/L3 及其后代, 剔除目标自身
    expect(r).toEqual(['L1', 'L2', 'L3', '/x/deepsib.md', '/x/l2sib.md'])
    expect(r).not.toContain('/x/deep.md')
  })

  it('目标不在聚类树中 -> node 仍为 null, 返回空数组', async () => {
    apiMock.getDocCluster.mockResolvedValueOnce([
      { name: 'root', children: [{ name: '/a/b.md', children: [] }] },
    ])
    const r = await docService.getSimliarDoc('does-not-exist')
    expect(r).toEqual([])
  })

  it('已知行为: 目标恰为根的直接子节点(一级)时 node 落在 root, 返回其余兄弟', async () => {
    const tree = {
      name: 'root',
      children: [
        { name: '/x/t.md', children: [] }, // 目标直接挂在 root 下
        { name: '/x/other.md', children: [] },
      ],
    }
    apiMock.getDocCluster.mockResolvedValueOnce([tree])
    const r = await docService.getSimliarDoc(DocUtils.docUrl2Id('/x/t.md'))
    // root 自身命中后, root 的父级不存在, node 在 root 这层被赋值; 返回 root 全部后代去掉目标
    expect(r).toContain('/x/other.md')
    expect(r).not.toContain('/x/t.md')
  })
})

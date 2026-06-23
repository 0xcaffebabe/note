import { describe, it, expect, beforeEach, vi } from 'vitest'
import Category from '@/core/domain/Category'
import { sharedCache } from '@/platform/web/app/sharedCache'

/**
 * CategoryService 是侧边栏目录树 / 全站搜索匹配 / 上一篇下一篇线性导航的数据底座。
 *
 * 它依赖 api.getCategory()(返回 markdown 文本, 经 marked + DOMParser 解析成树) 与
 * api.getCompiledCategory()(返回已编译的 Category[] 树)。这里在网络边界 mock 掉 '@/platform/web/api',
 * 让被测的解析 / 遍历 / 拼音匹配真实执行, 而不触发任何真实 fetch / localStorage 数据源。
 *
 * 关键测试约束(若忽略会跨用例串味):
 *  1) getCategoryList / getCompiledCategoryList / getFlatCategoryList / getOrderedDocList 都是
 *     无参的 @cache 方法, 缓存键恒为 JSON.stringify(arguments)='{}'。CacheService 是单例,
 *     不在 beforeEach 里 clear 会让上一个用例的结果永久命中。
 *  2) getMatchIndex 把结果写进 service 私有的 matchIndexCache(Map, key=name+'\n'+link),
 *     这块 CacheService.clear() 清不掉。因此匹配类用例必须用各自不同的 name/link 以绕开该缓存。
 *
 * 同时回归一处已修缺陷: categoryNameIsMatch 原写 index.nameLower?.indexOf(q) != -1,
 * 当 name 为 undefined 时 nameLower 为 undefined, 'undefined != -1' 恒真 -> 任意查询误命中。
 * 修复后用 (index.nameLower?.indexOf(q) ?? -1) != -1 守卫: name 缺失不再贡献匹配。
 */

// 网络边界 mock: init() 并不在构造时触发(构造函数为空), 但被测方法直接调这两个 api, 必须可控。
const { getCategory, getCompiledCategory } = vi.hoisted(() => ({
  getCategory: vi.fn(),
  getCompiledCategory: vi.fn(),
}))
vi.mock('@/platform/web/api', () => ({
  default: { getCategory, getCompiledCategory },
}))

import categoryService from '@/platform/web/service/CategoryService'

// 构造一棵 Category 树(深拷贝友好: 每次调用返回全新对象, 避免被 setParent 污染串味)
function cat(name: string, link: string, children: Category[] = []): Category {
  const c = new Category()
  c.name = name
  c.link = link
  c.chidren = children
  return c
}

// getCategory 返回 { content: markdown } 形态(DocFileInfo), 服务取 .content 喂给 marked
function summary(md: string) {
  return { content: md } as any
}

const cache = sharedCache

beforeEach(() => {
  cache.clear()
  getCategory.mockReset()
  getCompiledCategory.mockReset()
  localStorage.clear()
})

// ---------------------------------------------------------------------------
describe('getCategoryList: markdown 解析为目录树', () => {
  const md = `* [运维](运维/README.md)
  * [Docker](运维/Docker.md)
  * [Kubernetes](运维/Kubernetes.md)
* [Java](java/README.md)
`

  it('在最前面注入"首页"节点(./README.md)', async () => {
    getCategory.mockResolvedValue(summary(md))
    const list = await categoryService.getCategoryList()
    expect(list[0].name).toBe('首页')
    expect(list[0].link).toBe('./README.md')
  })

  it('解析 body>ul>li 顶级节点(首页 + 2 个顶级)', async () => {
    getCategory.mockResolvedValue(summary(md))
    const list = await categoryService.getCategoryList()
    // home + 运维 + Java
    expect(list).toHaveLength(3)
    expect(list[1].name).toBe('运维')
    expect(list[2].name).toBe('Java')
  })

  it('href 取自 <a>, 中文链接被 marked 百分号编码', async () => {
    getCategory.mockResolvedValue(summary(md))
    const list = await categoryService.getCategoryList()
    // marked 会把"运维"编码为 %E8%BF%90%E7%BB%B4
    expect(list[1].link).toContain('%E8%BF%90%E7%BB%B4')
    expect(list[1].link).toContain('README.md')
    expect(list[2].link).toBe('java/README.md')
  })

  it('递归解析子节点并回填 parent 反向引用', async () => {
    getCategory.mockResolvedValue(summary(md))
    const list = await categoryService.getCategoryList()
    const ops = list[1]
    expect(ops.chidren).toHaveLength(2)
    expect(ops.chidren[0].name).toBe('Docker')
    expect(ops.chidren[1].name).toBe('Kubernetes')
    // 子节点 parent 指回父节点
    expect(ops.chidren[0].parent).toBe(ops)
    // 顶级节点没有 parent(categoryParse 不为顶级设置 parent)
    expect(ops.parent).toBeUndefined()
  })

  it('空目录(无 li)只返回首页节点', async () => {
    getCategory.mockResolvedValue(summary(''))
    const list = await categoryService.getCategoryList()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('首页')
  })
})

// ---------------------------------------------------------------------------
describe('getCompiledCategoryList: 设置 parent + 预热匹配索引', () => {
  it('遍历整棵树为每个子节点回填 parent', async () => {
    getCompiledCategory.mockResolvedValue([
      cat('运维', '运维/README.md', [
        cat('Docker', '运维/Docker.md'),
        cat('容器', '运维/容器/README.md', [cat('Pod', '运维/容器/Pod.md')]),
      ]),
    ])
    const list = await categoryService.getCompiledCategoryList()
    const ops = list[0]
    expect(ops.chidren[0].parent).toBe(ops)
    expect(ops.chidren[1].parent).toBe(ops)
    // 三层: 孙节点 parent 指向二层
    expect(ops.chidren[1].chidren[0].parent).toBe(ops.chidren[1])
  })

  it('decodeURI 失败的节点不阻断目录加载(console.warn 而非抛出)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    getCompiledCategory.mockResolvedValue([
      // '%E0%A4%A' 是非法百分号转义, decodeURI 会抛 URIError, 预热时被 catch
      cat('坏链接节点', '%E0%A4%A'),
      cat('正常节点', 'ok/README.md'),
    ])
    const list = await categoryService.getCompiledCategoryList()
    // 整棵树仍返回, 没有因坏节点中断
    expect(list).toHaveLength(2)
    expect(list[1].name).toBe('正常节点')
    expect(warn).toHaveBeenCalled()
    expect(warn.mock.calls[0]).toContain('坏链接节点')
    warn.mockRestore()
  })

  it('空树返回空数组', async () => {
    getCompiledCategory.mockResolvedValue([])
    const list = await categoryService.getCompiledCategoryList()
    expect(list).toEqual([])
  })
})

// ---------------------------------------------------------------------------
describe('三种遍历: getFlatCategoryList / getOrderedDocList / getCategory', () => {
  // 注意每个用例自带 mock 数据 + beforeEach 清缓存, 否则无参 @cache 会串味
  function tree() {
    return [
      cat('运维', '运维/README.md', [
        cat('Docker', '运维/Docker.md'),
        cat('Kubernetes', '运维/Kubernetes.md'),
      ]),
      cat('Java', 'java/README.md', [cat('JVM', 'java/JVM.md')]),
    ]
  }

  it('getFlatCategoryList: 平铺所有带 link 的节点', async () => {
    getCompiledCategory.mockResolvedValue(tree())
    const flat = await categoryService.getFlatCategoryList()
    const names = flat.map((c) => c.name).sort()
    expect(names).toEqual(['Docker', 'JVM', 'Java', 'Kubernetes', '运维'])
  })

  it('getFlatCategoryList: 过滤掉无 link 的纯分组节点', async () => {
    const grp = cat('分组', '', [cat('子', 'g/子.md')]) // link 为空串 -> 被过滤
    getCompiledCategory.mockResolvedValue([grp])
    const flat = await categoryService.getFlatCategoryList()
    expect(flat.map((c) => c.name)).toEqual(['子'])
  })

  it('getOrderedDocList: 按自然阅读顺序(前序 DFS)展开', async () => {
    getCompiledCategory.mockResolvedValue(tree())
    const ordered = await categoryService.getOrderedDocList()
    // 前序: 运维 -> Docker -> Kubernetes -> Java -> JVM
    expect(ordered.map((c) => c.name)).toEqual([
      '运维',
      'Docker',
      'Kubernetes',
      'Java',
      'JVM',
    ])
  })

  it('getOrderedDocList 与 getFlatCategoryList 顺序不同(前序 vs 栈逆序), 但集合一致', async () => {
    getCompiledCategory.mockResolvedValue(tree())
    const ordered = await categoryService.getOrderedDocList()
    cache.clear() // 两个无参 @cache 互不影响(scope 不同), 但保险起见清一次
    getCompiledCategory.mockResolvedValue(tree())
    const flat = await categoryService.getFlatCategoryList()
    expect([...ordered].map((c) => c.name).sort()).toEqual(
      [...flat].map((c) => c.name).sort(),
    )
  })

  it('getCategory: 在已编译缓存树上按谓词查找', async () => {
    getCompiledCategory.mockResolvedValue(tree())
    // 先编译, getCategory 读 cahedCategoryList
    await categoryService.getCompiledCategoryList()
    const found = categoryService.getCategory((c) => c.name === 'Docker')
    expect(found).toHaveLength(1)
    expect(found[0].link).toBe('运维/Docker.md')
  })

  it('getCategory: 谓词匹配多个节点全部返回', async () => {
    getCompiledCategory.mockResolvedValue(tree())
    await categoryService.getCompiledCategoryList()
    // 匹配所有 README
    const readmes = categoryService.getCategory((c) => c.link.endsWith('README.md'))
    expect(readmes.map((c) => c.name).sort()).toEqual(['Java', '运维'])
  })

  it('getCategory: 无匹配返回空数组', async () => {
    getCompiledCategory.mockResolvedValue(tree())
    await categoryService.getCompiledCategoryList()
    const none = categoryService.getCategory((c) => c.name === '不存在的')
    expect(none).toEqual([])
  })
})

// ---------------------------------------------------------------------------
describe('categoryIsMatch: 匹配索引(字面/全拼/首字母)', () => {
  // 关键: 每个用例用各自独立的 name/link, 绕开 service 私有 matchIndexCache(CacheService.clear 清不掉)

  it('多词查询: 每个词都需命中 name 或 link 才算整体命中(AND 语义)', () => {
    const c = cat('运维部署', '运维/Docker.md')
    // 两个词都能在 name(运维部署) / link(运维Docker.md) 找到
    expect(categoryService.categoryIsMatch(c, '运维 Docker')).toBe(true)
  })

  it('多词查询: 任一词都不命中则整体不命中', () => {
    const c = cat('容器编排', '容器/Pod.md')
    expect(categoryService.categoryIsMatch(c, '容器 完全不存在的词xyz')).toBe(false)
  })

  it('name 子串字面匹配(大小写无关)', () => {
    const c = cat('GraphQL 入门', 'api/graphql.md')
    expect(categoryService.categoryIsMatch(c, 'graphql')).toBe(true)
  })

  it('link 子串字面匹配(去掉路径分隔符后比较)', () => {
    const c = cat('网关', 'gateway/setup.md')
    // link 去 / 后为 gatewaysetup.md, 含 'setup'
    expect(categoryService.categoryIsMatch(c, 'setup')).toBe(true)
  })

  it('name 全拼匹配(中文转拼音)', () => {
    const c = cat('数据库', 'db/index.md')
    // 数据库 -> SHUJUKU
    expect(categoryService.categoryIsMatch(c, 'shuju')).toBe(true)
  })

  it('name 首字母拼音匹配', () => {
    const c = cat('消息队列', 'mq/index.md')
    // 消息队列 -> XXDL
    expect(categoryService.categoryIsMatch(c, 'xxdl')).toBe(true)
  })

  it('完全无关查询返回 false', () => {
    const c = cat('缓存策略', 'cache/policy.md')
    expect(categoryService.categoryIsMatch(c, 'zzznotfound')).toBe(false)
  })

  it('matchIndexCache 命中: 同 name+link 第二次匹配复用索引(结果稳定)', () => {
    const c = cat('限流', 'ratelimit/index.md')
    const first = categoryService.categoryIsMatch(c, 'xianliu') // 全拼
    const second = categoryService.categoryIsMatch(c, 'xianliu')
    expect(first).toBe(true)
    expect(second).toBe(true)
  })
})

// ---------------------------------------------------------------------------
describe('categoryIsMatch: name 缺失不应误命中', () => {
  it('name 为 undefined 时 nameLower 为 undefined, 经 (?? -1) 守卫后无名节点不会误命中无关查询', () => {
    // 构造 name 为 undefined 的节点(非 new Category(), 后者 name 默认 ''):
    const broken = { name: undefined, link: 'orphan/no-name.md', chidren: [] } as unknown as Category
    // 查询一个既不在 link 也无任何拼音含义的串: name 缺失不应贡献匹配, link 也无命中 -> false
    expect(categoryService.categoryIsMatch(broken, 'totallyirrelevantxyz')).toBe(false)
  })

  it('name 为 undefined 时仍能凭 link 命中(守卫只屏蔽 name 缺失, 不影响 link 匹配路径)', () => {
    const broken = { name: undefined, link: 'orphan/no-name.md', chidren: [] } as unknown as Category
    // 'orphan' 在 link 去分隔符后的字面里, link 匹配路径不受 name 守卫影响
    expect(categoryService.categoryIsMatch(broken, 'orphan')).toBe(true)
  })

  it('对照: name 为空串("")时 nameLower 为 ""(非 undefined), 不会误命中', () => {
    // new Category() 的 name 默认即 '', 这是正常路径, 不应触发上面的误命中
    const empty = cat('', 'empty/blank.md')
    expect(categoryService.categoryIsMatch(empty, 'totallyirrelevantxyz')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
describe('搜索点击记录 MRU(addCategorySearchRecord / getCategorySearchRecords)', () => {
  it('空记录返回空数组', () => {
    expect(categoryService.getCategorySearchRecords()).toEqual([])
  })

  it('新增后读取返回该记录', () => {
    categoryService.addCategorySearchRecord(cat('A', 'a.md'))
    const recs = categoryService.getCategorySearchRecords()
    expect(recs).toHaveLength(1)
    expect(recs[0].link).toBe('a.md')
  })

  it('读取时反转: 最近点击的排在最前(MRU)', () => {
    categoryService.addCategorySearchRecord(cat('A', 'a.md'))
    categoryService.addCategorySearchRecord(cat('B', 'b.md'))
    categoryService.addCategorySearchRecord(cat('C', 'c.md'))
    const recs = categoryService.getCategorySearchRecords()
    expect(recs.map((r) => r.link)).toEqual(['c.md', 'b.md', 'a.md'])
  })

  it('重复点击同一链接: 去重并移到队尾(读取时即最前)', () => {
    categoryService.addCategorySearchRecord(cat('A', 'a.md'))
    categoryService.addCategorySearchRecord(cat('B', 'b.md'))
    categoryService.addCategorySearchRecord(cat('A', 'a.md')) // 再次点击 A
    const recs = categoryService.getCategorySearchRecords()
    // A 被移到最近, 不重复
    expect(recs.map((r) => r.link)).toEqual(['a.md', 'b.md'])
  })

  it('超过 20 条时丢弃最旧(队首)的记录', () => {
    for (let i = 0; i < 25; i++) {
      categoryService.addCategorySearchRecord(cat('N' + i, 'n' + i + '.md'))
    }
    const recs = categoryService.getCategorySearchRecords()
    expect(recs).toHaveLength(20)
    // 读取反转后最前应为最新 n24, 最后应为还存活的最旧 n5(n0..n4 被淘汰)
    expect(recs[0].link).toBe('n24.md')
    expect(recs[recs.length - 1].link).toBe('n5.md')
  })
})

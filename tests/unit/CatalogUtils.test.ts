import { describe, it, expect, vi } from 'vitest'

/**
 * 本套件守护 src/util/CatalogUtils.ts —— 总目录页与首页快捷入口共用的目录工具集。
 * 这些函数直接决定:分类图标渲染(leadingEmoji)、锚点/深链/IntersectionObserver 是否生效
 * (categorySlug)、首页与总目录页文档数是否一致(countDocs)、搜索高亮是否安全转义
 * (highlightName)以及异常链接节点是否会中断整页渲染(safeMatch)。
 *
 * 这里在导入被测模块前用 vi.hoisted()+vi.mock() 把 CategoryService(底层会拉 marked/api 等
 * 重型依赖)整体替换掉:既能在无 DOM 的 node 环境跑,又能单独触发 categoryIsMatch 抛错来验证
 * safeMatch 的 throw->false 兜底分支(这是它存在的唯一理由)。
 *
 * 部分断言锁定的是「当前真实行为」而非「理想行为」(见各处 已知 BUG 注释),修复 src 后需同步更新。
 */

// 在网络/重依赖边界 mock 掉 CategoryService 默认导出(单例实例)
const { categoryIsMatch } = vi.hoisted(() => ({ categoryIsMatch: vi.fn() }))
vi.mock('@/platform/web/service/CategoryService', () => ({
  default: { categoryIsMatch },
}))

import {
  leadingEmoji,
  stripEmoji,
  categorySlug,
  countDocs,
  safeMatch,
  highlightName,
} from '@/platform/web/util/CatalogUtils'
import Category from '@/core/domain/Category'

// 构造测试用目录节点(注意字段是项目里故意/历史拼错的 chidren)
function node(partial: Partial<Category>): Category {
  return Object.assign(new Category(), partial)
}

describe('leadingEmoji: 取名称开头连续 emoji 簇作为分类图标', () => {
  it('普通单 emoji 开头返回该 emoji', () => {
    expect(leadingEmoji('💎算法与数据结构')).toBe('💎')
  })

  it('ZWJ 连字符序列(👨‍💻)整簇返回,不被零宽连字符截断', () => {
    const r = leadingEmoji('👨‍💻编程语言')
    expect(r).toBe('👨‍💻')
    // 含 ZWJ 即长度不止一个码点,确认整簇被吃进来
    expect([...r].length).toBeGreaterThan(1)
  })

  it('连续多个 emoji 全部纳入', () => {
    expect(leadingEmoji('🚀🔥多emoji开头')).toBe('🚀🔥')
  })

  it('肤色修饰符(👍🏽)随主 emoji 一起返回', () => {
    expect(leadingEmoji('👍🏽肤色')).toBe('👍🏽')
  })

  it('纯文字开头返回空串', () => {
    expect(leadingEmoji('纯文字')).toBe('')
  })

  it('emoji 在中间(非开头)不算图标,返回空串', () => {
    expect(leadingEmoji('中间💎emoji不算')).toBe('')
  })

  it('null/undefined/空串安全:返回空串', () => {
    // @ts-expect-error 故意传 null 验证 null-safe
    expect(leadingEmoji(null)).toBe('')
    // @ts-expect-error 故意传 undefined 验证 null-safe
    expect(leadingEmoji(undefined)).toBe('')
    expect(leadingEmoji('')).toBe('')
  })

  it('数字 keycap(1️⃣)开头不被识别为图标,返回空串', () => {
    // 已知现状: keycap 的 ⃣ 必须跟在 Extended_Pictographic 后,数字 1 不是图形字符故不匹配
    expect(leadingEmoji('1️⃣keycap')).toBe('')
  })
})

describe('stripEmoji: 去除 emoji 与零宽连字符返回纯文字', () => {
  it('剥掉开头单 emoji', () => {
    expect(stripEmoji('💎算法与数据结构')).toBe('算法与数据结构')
  })

  it('剥掉 ZWJ 序列与其全部组成码点(👨‍💻)', () => {
    expect(stripEmoji('👨‍💻编程语言')).toBe('编程语言')
  })

  it('剥掉名称中间位置的 emoji', () => {
    expect(stripEmoji('中间💎emoji不算')).toBe('中间emoji不算')
  })

  it('剥掉肤色修饰符', () => {
    expect(stripEmoji('👍🏽肤色')).toBe('肤色')
  })

  it('纯文字原样返回(并 trim)', () => {
    expect(stripEmoji('纯文字')).toBe('纯文字')
    expect(stripEmoji('  有空格  ')).toBe('有空格')
  })

  it('null/undefined/空串安全:返回空串', () => {
    // @ts-expect-error 故意传 null
    expect(stripEmoji(null)).toBe('')
    // @ts-expect-error 故意传 undefined
    expect(stripEmoji(undefined)).toBe('')
    expect(stripEmoji('')).toBe('')
  })
})

describe('categorySlug: 由分类名生成稳定锚点 slug', () => {
  it('剥 emoji 后再 slug,保留中文', () => {
    expect(categorySlug('💎算法与数据结构')).toBe('算法与数据结构')
    expect(categorySlug('👨‍💻编程语言')).toBe('编程语言')
  })

  it('英文转小写并以连字符连接', () => {
    expect(categorySlug('Hello World')).toBe('hello-world')
  })

  it('剥去标点/路径分隔符', () => {
    expect(categorySlug('a.b/c')).toBe('abc')
  })

  it('纯 emoji 名(剥后为空)返回 "heading" 而非 "cat"', () => {
    // 已知 BUG: categorySlug 末尾的 `|| "cat"` 是死代码 —— slugify("") 已先返回 "heading",
    // 永远不会落到 || 分支。锁定现状为 "heading"(待修复 slugify 兜底或去掉死代码后更新断言)
    expect(categorySlug('💎')).toBe('heading')
    expect(categorySlug('')).toBe('heading')
  })
})

describe('countDocs: 递归统计有链接的文档数(纯分组节点不计)', () => {
  it('单叶子(有 link)计 1', () => {
    expect(countDocs(node({ name: 'x', link: '/x.html' }))).toBe(1)
  })

  it('空分组节点(无 link 无子)计 0', () => {
    expect(countDocs(node({ name: 'g', link: '' }))).toBe(0)
  })

  it('嵌套树:只统计带 link 的后代,分组节点本身不计', () => {
    const tree = node({
      name: 'root',
      link: '',
      chidren: [
        node({
          name: 'group',
          link: '',
          chidren: [
            node({ name: 'leaf1', link: '/a.html' }),
            node({ name: 'leaf2', link: '/b.html' }),
          ],
        }),
        node({ name: 'leaf3', link: '/c.html' }),
      ],
    })
    expect(countDocs(tree)).toBe(3)
  })

  it('既有 link 又有带 link 子节点的节点:自身也计入', () => {
    const tree = node({
      name: 'root',
      link: '/root.html',
      chidren: [node({ name: 'leaf', link: '/a.html' })],
    })
    expect(countDocs(tree)).toBe(2)
  })

  it('chidren 缺省(undefined)时不报错,按自身 link 计数', () => {
    // CatalogUtils 用 `cat.chidren || []` 兜底
    const bare = { name: 'y', link: '/y.html' } as unknown as Category
    expect(countDocs(bare)).toBe(1)
  })

  it('已知约定: 字段名是拼错的 chidren —— 用正确拼写 children 会被静默忽略(计 0)', () => {
    // 已知 BUG/约定: countDocs 读 cat.chidren,若数据用了正确拼写 children 则永远遍历不到子节点。
    // 锁定现状,提醒上下游必须沿用 chidren 这个历史拼写(待全局重命名字段后更新)
    const wrongSpelling = {
      name: 'r',
      link: '',
      children: [{ link: '/a.html' }, { link: '/b.html' }],
    } as unknown as Category
    expect(countDocs(wrongSpelling)).toBe(0)
  })
})

describe('safeMatch: 异常节点匹配不中断渲染(try/catch 兜底)', () => {
  it('正常匹配:透传 categoryService.categoryIsMatch 的真值', () => {
    categoryIsMatch.mockReturnValueOnce(true)
    const n = node({ name: 'Docker', link: '/Docker.html' })
    expect(safeMatch(n, 'docker')).toBe(true)
    expect(categoryIsMatch).toHaveBeenCalledWith(n, 'docker')
  })

  it('正常未匹配:透传 false', () => {
    categoryIsMatch.mockReturnValueOnce(false)
    expect(safeMatch(node({ name: 'x', link: '/x.html' }), 'zzz')).toBe(false)
  })

  it('底层抛错(如 decodeURI 失败)时返回 false 而非冒泡异常', () => {
    categoryIsMatch.mockImplementation(() => {
      throw new URIError('URI malformed')
    })
    expect(() => safeMatch(node({ name: 'bad', link: '/%E0%A4%A.html' }), 'kw')).not.toThrow()
    expect(safeMatch(node({ name: 'bad2', link: '/%' }), 'kw2')).toBe(false)
    categoryIsMatch.mockReset()
  })
})

describe('highlightName: 字面命中 <mark> 高亮 / 拼音命中整名标主色 / 先转义后匹配', () => {
  it('字面子串大小写不敏感地用 <mark> 包裹', () => {
    expect(highlightName('Docker 教程', 'docker', false)).toBe('<mark>Docker</mark> 教程')
    expect(highlightName('DOCKER', 'docker', false)).toBe('<mark>DOCKER</mark>')
  })

  it('多个空格分隔的关键词分别高亮', () => {
    expect(highlightName('docker nginx 教程', 'docker nginx', false)).toBe(
      '<mark>docker</mark> <mark>nginx</mark> 教程',
    )
  })

  it('空关键词:仅做 HTML 转义,不加 <mark>', () => {
    expect(highlightName('<b>x</b>', '', false)).toBe('&lt;b&gt;x&lt;/b&gt;')
    expect(highlightName('a&"c', '   ', false)).toBe('a&amp;&quot;c')
  })

  it('名称先被 HTML 转义(<>&" 全部实体化)再处理', () => {
    expect(highlightName('a<b>&"c', 'x', false)).toBe('a&lt;b&gt;&amp;&quot;c')
  })

  it('关键词中的正则特殊字符按字面处理(a.b 命中 a.b)', () => {
    expect(highlightName('a.b', 'a.b', false)).toBe('<mark>a.b</mark>')
  })

  it('正则特殊字符不当作通配符(a.b 不应误命中 axb)', () => {
    // escapeRegExp 把 . 转义,故 axb 不被高亮(若未转义则 . 会匹配任意字符)
    expect(highlightName('axb', 'a.b', false)).toBe('axb')
  })

  it('关键词先 escapeHtml 再匹配:搜 <mark> 命中名称里被转义后的 &lt;mark&gt;', () => {
    // 验证转义顺序: 名称里的 <mark> 先变 &lt;mark&gt;,关键词 <mark> 也先变 &lt;mark&gt; 才匹配
    expect(highlightName('a<mark>b', '<mark>', false)).toBe('a<mark>&lt;mark&gt;</mark>b')
  })

  it('无字面命中但 pinyinHit=true:整名用 .pinyin-hit 包裹', () => {
    expect(highlightName('算法', 'suanfa', true)).toBe('<span class="pinyin-hit">算法</span>')
  })

  it('无字面命中且 pinyinHit=false:返回转义后的原名,无标记', () => {
    expect(highlightName('算法', 'zzz', false)).toBe('算法')
  })

  it('字面命中优先于拼音:即便 pinyinHit=true 也只出 <mark> 不出 pinyin-hit', () => {
    expect(highlightName('Docker', 'docker', true)).toBe('<mark>Docker</mark>')
  })

  it('null 名称安全:返回空串', () => {
    // @ts-expect-error 故意传 null
    expect(highlightName(null, 'x', false)).toBe('')
  })
})

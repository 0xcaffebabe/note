/**
 * DocBuildMove 纯字符串辅助函数单测
 *
 * 覆盖两个从插件中导出的、与运行时构建无关的纯函数:
 *  - escapeHtmlText: HTML 文本转义 (& < > ")
 *  - generalHtmlContent: 以 index.html 为模板生成单文档静态 html
 *
 * 核心关注点(历史 KaTeX 回归): 这两个函数刻意使用「回调形式」的 .replace
 * 来注入替换值, 以避免 '$$' / '$&' / '$1' 等被 String.prototype.replace 当作
 * 替换模式而被吞掉。文档正文里常含 '$$'(KaTeX 公式定界符), 一旦被解释会破坏内容。
 * 因此本测试重点验证: 输入中的 '$$' '$&' '$1' 原样保留(verbatim)。
 *
 * 运行环境: node (纯字符串逻辑; generalHtmlContent 内部用到 jsdom, 已作为依赖可用)。
 * 行为均通过 npx tsx 实测探针对齐, 非显然之处以「已知 BUG」注明当前真实行为。
 */
import { describe, it, expect } from 'vitest'
import { escapeHtmlText } from '@/core/util/StringUtils'
import { generalHtmlContent } from '@/platform/node/plugins/DocBuildMove'
import DocFileInfo from '@/core/domain/DocFileInfo'

// 构造最小可用的 DocFileInfo: 函数仅读取 name / content
function makeInfo(name: string, content: string): DocFileInfo {
  const info = new DocFileInfo()
  info.name = name
  info.content = content
  return info
}

const TEMPLATE =
  '<!DOCTYPE html><html><head><title>MySite</title></head><body><div id="app"></div></body></html>'

describe('escapeHtmlText', () => {
  it('转义全部四类特殊字符 & < > "', () => {
    expect(escapeHtmlText('a & b < c > d " e')).toBe(
      'a &amp; b &lt; c &gt; d &quot; e',
    )
  })

  it('单独转义每个字符', () => {
    expect(escapeHtmlText('&')).toBe('&amp;')
    expect(escapeHtmlText('<')).toBe('&lt;')
    expect(escapeHtmlText('>')).toBe('&gt;')
    expect(escapeHtmlText('"')).toBe('&quot;')
  })

  it("不转义单引号 ' (当前实现只处理双引号)", () => {
    expect(escapeHtmlText("it's a 'test'")).toBe("it's a 'test'")
  })

  it('普通文本原样返回', () => {
    expect(escapeHtmlText('plain text 123 中文')).toBe('plain text 123 中文')
  })

  it('空字符串返回空字符串', () => {
    expect(escapeHtmlText('')).toBe('')
  })

  // 历史 KaTeX 回归的核心保障: 这些 $ 模式必须原样保留
  it("'$$' 原样保留(不被当作替换模式)", () => {
    expect(escapeHtmlText('$$')).toBe('$$')
    expect(escapeHtmlText('formula $$x^2$$ end')).toBe('formula $$x^2$$ end')
  })

  it("'$&' 原样保留(不被替换成整体匹配)", () => {
    // 若用字符串形式 .replace, '$&' 会被替换成匹配到的子串
    expect(escapeHtmlText('a$&b')).toBe('a$&amp;b')
    // 注意: $ 后紧跟 & 时, & 仍被独立转义为 &amp;, 但 $ 字面保留
    expect(escapeHtmlText('$&')).toBe('$&amp;')
  })

  it("'$1' 数字捕获组模式原样保留", () => {
    expect(escapeHtmlText('$1 $2 $99')).toBe('$1 $2 $99')
  })

  it("'$`' 与 \"$'\" 前后引用模式原样保留", () => {
    expect(escapeHtmlText("$` $'")).toBe("$` $'")
  })

  it('混合 $ 模式与待转义字符: $ 字面保留, 特殊字符正常转义', () => {
    // 实测探针: "$$ $& $1 $` $'" -> "$$ $&amp; $1 $` $'"
    expect(escapeHtmlText("$$ $& $1 $` $'")).toBe("$$ $&amp; $1 $` $'")
  })

  it('幂等: 已有实体不被二次转义(& 用负向先行守卫)', () => {
    // '&lt;' 中的 & 属已有实体前缀, 不再被转义, 保持原样
    expect(escapeHtmlText('&lt;')).toBe('&lt;')
    // '<b>' 与 '</b>' 的尖括号正常转义, 而 '&amp;' 作为已有实体原样保留
    expect(escapeHtmlText('<b>&amp;</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;')
    // 幂等性: 对已转义文本再转义一次结果不变
    expect(escapeHtmlText(escapeHtmlText('a & b < c'))).toBe(escapeHtmlText('a & b < c'))
  })
})

describe('generalHtmlContent', () => {
  it('把模板 <title> 替换为文档名, 并注入 description/og/static-content', () => {
    const info = makeInfo('My Doc', '# Hello\n\nThis is **bold** text.')
    const out = generalHtmlContent(TEMPLATE, info)

    expect(out).toContain('<title>My Doc</title>')
    // description 取正文纯文本(去掉 markdown 标记与换行)前 100 字, 末尾追加 '...'
    expect(out).toContain('<meta name="description" content="HelloThis is bold text....">')
    expect(out).toContain('<meta property="og:title" content="My Doc">')
    expect(out).toContain('<meta property="og:type" content="article">')
    // og:site_name 取自模板 <title>
    expect(out).toContain('<meta property="og:site_name" content="MySite">')
    expect(out).toContain('<meta name="twitter:card" content="summary">')
    // 正文以可见 static-content 直出, 渲染为 HTML
    expect(out).toContain("<div class='content static-content'>")
    expect(out).toContain('<h1>Hello</h1>')
    expect(out).toContain('<strong>bold</strong>')
  })

  // 历史 KaTeX 回归核心: 正文与标题中的 $$ / $& / $1 必须原样进入产物
  it("正文含 KaTeX '$$'/'$&'/'$1' 时原样保留, 不被替换模式吞掉", () => {
    const info = makeInfo('Math $&$1', 'inline $$x = $&$1$$ here')
    const out = generalHtmlContent(TEMPLATE, info)

    // 正文 static-content 中的 $ 模式逐字保留
    expect(out).toContain('inline $$x = $&$1$$ here')
    // 标题中的 $& / $1 也保留 ($ 字面 + & 被转义为 &amp;)
    expect(out).toContain('<title>Math $&amp;$1</title>')
    expect(out).toContain('<meta property="og:title" content="Math $&amp;$1">')
    // 不应出现替换模式被解释的痕迹(例如 $& 被替换成 'title')
    expect(out).not.toContain('<title>Math title')
  })

  it('正文里的 .md 链接被改写为 .html (大小写不敏感)', () => {
    const info = makeInfo('Links', '[a](foo.md) and [b](bar.MD)')
    const out = generalHtmlContent(TEMPLATE, info)
    expect(out).toContain('<a href="foo.html">a</a>')
    expect(out).toContain('<a href="bar.html">b</a>')
    expect(out).not.toContain('foo.md')
    expect(out).not.toContain('bar.MD')
  })

  it('preloadTags 与 jsonPath 被注入 </head> 之前', () => {
    const info = makeInfo('X', 'hi')
    const preload = '<link rel="modulepreload" href="/a.js">'
    const out = generalHtmlContent(TEMPLATE, info, preload, '/x.json')
    expect(out).toContain('<link rel="modulepreload" href="/a.js">')
    expect(out).toContain('<link rel="preload" as="fetch" href="/x.json">')
    // 注入位置在 </head> 前
    expect(out.indexOf('/x.json')).toBeLessThan(out.indexOf('</head>'))
  })

  it('jsonPath 为空时不生成 json preload 链接', () => {
    const info = makeInfo('X', 'hi')
    const out = generalHtmlContent(TEMPLATE, info)
    expect(out).not.toContain('as="fetch"')
  })

  it('文档名中的 HTML 特殊字符被转义进 title 与 og:title', () => {
    const info = makeInfo('A & B <C> "D"', 'body')
    const out = generalHtmlContent(TEMPLATE, info)
    expect(out).toContain('<title>A &amp; B &lt;C&gt; &quot;D&quot;</title>')
    expect(out).toContain('<meta property="og:title" content="A &amp; B &lt;C&gt; &quot;D&quot;">')
  })

  it('模板 title 含 < 时 site_name 完整提取([\\s\\S]*? 非贪婪到 </title>)', () => {
    // 捕获组改用 [\s\S]*? 后, 含 '<' 的标题不再被截断, 整段被提取并按 HTML 转义
    const template = '<head><title>A & B <X></title></head><body></body>'
    const info = makeInfo('N', 'c')
    const out = generalHtmlContent(template, info)
    expect(out).toContain('<meta property="og:site_name" content="A &amp; B &lt;X&gt;">')
  })

  it('幂等性: 相同输入多次调用产物一致(模块级 dom 复用不串扰)', () => {
    const info = makeInfo('Repeat', 'content **here**')
    const a = generalHtmlContent(TEMPLATE, info)
    const b = generalHtmlContent(TEMPLATE, info)
    expect(a).toBe(b)
  })
})

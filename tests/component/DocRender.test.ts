import { describe, it, expect, beforeEach } from 'vitest'
import DocRender from '@/render/DocRender'

/*
 * DocRender 把 markdown 经 marked + 自定义 renderer 渲染为站内 HTML。
 * 这个套件守护那些“站内约定”而非 marked 默认行为的自定义渲染逻辑, 一旦回归会影响全站文档外观/链接/安全:
 *   - link:   外链强制 target=_blank + rel=noopener noreferrer 且无 origin-link; 内链经 resloveDocUrl+buildDocLink
 *             生成 .html 路径, 仅当带 #锚点 时才追加 ?headingId=, 并携带 origin-link 原始地址;
 *             链接文本里的 <sup> 节点(脚注角标)会被剔除文本化, 其余文本保留。
 *   - code:   mermaid 走 .mermaid-wrapper(带 data-raw 转义源 + 形如 mermaid-xxxxxx 的随机 id);
 *             其它语言走 .code-block(带 data-lang + 工具栏 + language-<lang>); 无语言回退 'text';
 *             escapeHtml/escapeAttr 阻断 lang/源码里的引号与 <script> 注入。
 *   - heading: md 一级标题渲染为 h2(level=min(depth+1,6)); id 由 slug(先剥 HTML 标签)生成;
 *             同名标题去重加后缀; 末尾追加 .heading-anchor 锚链接。
 *   - blockquote: GFM admonition `> [!NOTE]` 等 7 种类型 → .callout-<cls> + CALLOUT_META 中文标题, 标记行被剥离,
 *             类型大小写不敏感; 未知 [!FOO] 或普通引用 → 原样 <blockquote>。
 *   - table:  外层包一层 .table-wrapper。
 *   - image:  本地路径经 baseUrl 与 localImageProxy 的双重前缀重写(数据源功能已移除, baseUrl 恒为同源根 '/')。
 *
 * 环境: 放在 component(jsdom) 因为 render.link 用到了 DOMParser。
 * baseUrl 恒为 '/', 故所有内链/本地图片输出是确定的。
 */

// 多数断言基于解析后的 DOM(querySelector/getAttribute), 避免 marked 输出的换行/空白差异带来脆性。
function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

// docId 固定为 'java-foo' → 锚链接 href 应为 /java/foo.html?headingId=<id>
function render(md: string, docId = 'java-foo'): string {
  return new DocRender(md, docId, [], []).render()
}

beforeEach(() => {
  // baseUrl 恒为同源根 '/'(数据源功能已移除), 清 localStorage 仅为隔离, 不影响 baseUrl/localImageProxy 输出
  localStorage.clear()
})

describe('DocRender.render — link', () => {
  it('外链: target=_blank + rel=noopener noreferrer 且不含 origin-link', () => {
    const a = parse(render('[ext](https://example.com)')).querySelector('a')!
    expect(a.getAttribute('href')).toBe('https://example.com')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toBe('noopener noreferrer')
    expect(a.hasAttribute('origin-link')).toBe(false)
    expect(a.textContent).toBe('ext')
  })

  it('内链(无锚点): 转 .html 路径 + 携带 origin-link, 不含 ?headingId=', () => {
    const html = render('[doc](/doc/java/集合.md)')
    const a = parse(html).querySelector('a')!
    expect(a.getAttribute('href')).toBe('/java/集合.html')
    expect(a.getAttribute('href')).not.toContain('headingId')
    expect(a.getAttribute('origin-link')).toBe('/doc/java/集合.md')
    expect(a.hasAttribute('target')).toBe(false)
  })

  it('内链(带 #锚点): href 追加 ?headingId=<anchor>', () => {
    const a = parse(render('[doc](/doc/java/集合.md#hashmap)')).querySelector('a')!
    expect(a.getAttribute('href')).toBe('/java/集合.html?headingId=hashmap')
    expect(a.getAttribute('origin-link')).toBe('/doc/java/集合.md#hashmap')
  })

  it('内链文本含 <sup>: sup 文本被剔除, 其余文本保留', () => {
    // 源 ~line 112-116: 把 text 当 HTML 解析, 过滤 tagName==SUP 的节点后拼接 textContent
    const a = parse(render('[文本<sup>注</sup>尾](/doc/java/集合.md)')).querySelector('a')!
    expect(a.textContent).toBe('文本尾')
    expect(a.innerHTML).not.toContain('sup')
  })

  it('内链普通文本(无 HTML)原样保留', () => {
    const a = parse(render('[just text](/doc/java/集合.md)')).querySelector('a')!
    expect(a.textContent).toBe('just text')
    expect(a.getAttribute('href')).toBe('/java/集合.html')
  })

  it('纯 #锚点: 回落到当前文档自身, href 为当前文档 .html?headingId=<anchor>', () => {
    // resloveDocUrl('#frag') → {id:'', headingId:'frag'}; 空 id 回落到实例 docId='java-foo'
    // → buildDocLink('java-foo','frag') = /java/foo.html?headingId=frag, 锚点在本文档内跳转而非丢失
    const a = parse(render('[x](#frag)')).querySelector('a')!
    expect(a.getAttribute('href')).toBe('/java/foo.html?headingId=frag')
    expect(a.getAttribute('origin-link')).toBe('#frag')
    expect(a.getAttribute('href')).toContain('headingId=frag')
  })

  it('外链的 href 经 escapeAttr、text 经 escapeHtml 转义(&、< 不再原样进入 a 标签)', () => {
    // 外链分支与 code/image 分支一致: href 走 escapeAttr, text 走 escapeHtml, 阻断 &/< 注入
    const html = render('[a&b<c](https://e.com/p?x=1&y=2)')
    // href 中的 & 被 escapeAttr 转为 &amp;
    expect(html).toContain("href='https://e.com/p?x=1&amp;y=2'")
    // text 中的 & 与 < 被 escapeHtml 转义, 不再原样输出
    expect(html).toContain('a&amp;b&lt;c')
    expect(html).not.toContain('a&b<c')
    // 解析回 DOM: textContent 读回解码后的原文, href 读回解码后的原始地址
    const a = parse(html).querySelector('a')!
    expect(a.textContent).toBe('a&b<c')
    expect(a.getAttribute('href')).toBe('https://e.com/p?x=1&y=2')
  })
})

describe('DocRender.render — code', () => {
  it('mermaid: .mermaid-wrapper[data-raw] + 形如 mermaid-xxxxxx 的 id + 源被 escapeHtml', () => {
    const wrapper = parse(render('```mermaid\ngraph TD;A-->B;\n```')).querySelector('.mermaid-wrapper')!
    expect(wrapper).not.toBeNull()
    // data-raw 经 escapeAttr: > 变成 &gt;(getAttribute 读回为已解码的 >)
    expect(wrapper.getAttribute('data-raw')).toBe('graph TD;A-->B;')
    const source = wrapper.querySelector('.mermaid-source')!
    expect(source.id).toMatch(/^mermaid-[0-9a-z]{6}$/)
    // 源经 escapeHtml: textContent 读回解码后的 >
    expect(source.textContent).toBe('graph TD;A-->B;')
  })

  it('mermaid: 多次渲染生成不同的随机 id', () => {
    const id1 = parse(render('```mermaid\nA\n```')).querySelector('.mermaid-source')!.id
    const id2 = parse(render('```mermaid\nB\n```')).querySelector('.mermaid-source')!.id
    expect(id1).not.toBe(id2)
  })

  it('普通语言: .code-block[data-lang] + 工具栏 + code.language-<lang>', () => {
    const block = parse(render('```js\nconst a = 1;\n```')).querySelector('.code-block')!
    expect(block.getAttribute('data-lang')).toBe('js')
    expect(block.querySelector('.code-block-toolbar .code-lang')!.textContent).toBe('js')
    expect(block.querySelector('.code-copy')).not.toBeNull()
    expect(block.querySelector('code')!.classList.contains('language-js')).toBe(true)
  })

  it('无语言: 回退为 text', () => {
    const block = parse(render('```\nplain text\n```')).querySelector('.code-block')!
    expect(block.getAttribute('data-lang')).toBe('text')
    expect(block.querySelector('code')!.classList.contains('language-text')).toBe(true)
  })

  it('源码内容经 escapeHtml: <、> 不会变成真实标签', () => {
    const block = parse(render('```js\nvar x = "<x>";\n```')).querySelector('.code-block')!
    const code = block.querySelector('code')!
    // textContent 读回原文; 但 DOM 中不存在被注入的子元素
    expect(code.textContent).toBe('var x = "<x>";')
    expect(code.querySelector('x')).toBeNull()
  })

  it('lang 含引号/尖括号: escapeAttr 防止跳出属性注入新标签', () => {
    // 喂入恶意 lang 与含 </code> 的源, 验证不会产生游离的 <script>
    const html = render('```js"><script>alert(1)</script>\nvar x = "</code><img src=x>";\n```')
    const doc = parse(html)
    // 注入未能逃逸: 没有真实的 script / img 元素被构造出来
    expect(doc.querySelector('script')).toBeNull()
    expect(doc.querySelector('img')).toBeNull()
    // 引号被转义进入属性
    expect(html).toContain('&quot;&gt;&lt;script&gt;')
  })
})

describe('DocRender.render — heading', () => {
  it('md 一级标题(#) 渲染为 h2, id 为 slug, 末尾带 .heading-anchor', () => {
    const doc = parse(render('# Hello World'))
    const h = doc.querySelector('h2')!
    expect(h).not.toBeNull()
    expect(h.id).toBe('hello-world')
    const anchor = h.querySelector('a.heading-anchor')!
    expect(anchor.getAttribute('href')).toBe('/java/foo.html?headingId=hello-world')
    expect(anchor.getAttribute('aria-label')).toBe('标题锚点')
    expect(anchor.textContent).toBe('#')
  })

  it('六级标题(######) 渲染为 h6(level=min(6+1,6) 夹紧, 不产生 h7)', () => {
    const doc = parse(render('###### Six'))
    expect(doc.querySelector('h6')).not.toBeNull()
    expect(doc.querySelector('h7' as 'h6')).toBeNull()
  })

  it('// 已知行为: 7 个 # 在 marked 中不是合法 ATX 标题, 渲染为普通段落而非标题', () => {
    // 源里的 min(depth+1,6) 夹紧逻辑实际不可经 markdown 触发到 depth>6, marked 直接把 7# 当文本
    const doc = parse(render('####### Seven'))
    expect(doc.querySelector('h6')).toBeNull()
    expect(doc.querySelector('p')!.textContent).toContain('####### Seven')
  })

  it('id 生成前先剥离标题中的 HTML 标签', () => {
    // raw 经 replace(/<[!\/a-z].*?>/gi,'') 去标签后再 slug, 但渲染文本仍保留标签
    const h = parse(render('# Title <b>bold</b>')).querySelector('h2')!
    expect(h.id).toBe('title-bold')
    expect(h.querySelector('b')!.textContent).toBe('bold')
  })

  it('同名标题去重: 第二个相同标题 id 加 -1 后缀', () => {
    const headings = parse(render('# Same\n\n# Same')).querySelectorAll('h2')
    expect(headings).toHaveLength(2)
    expect(headings[0].id).toBe('same')
    expect(headings[1].id).toBe('same-1')
  })

  it('标题内含行内代码: id 用纯文本 slug, 渲染保留 <code>', () => {
    const h = parse(render('# `code` heading')).querySelector('h2')!
    expect(h.id).toBe('code-heading')
    expect(h.querySelector('code')!.textContent).toBe('code')
  })
})

describe('DocRender.render — blockquote callout', () => {
  // CALLOUT_META: 7 种类型 → {cls, 中文标题}
  const cases: Array<[string, string, string]> = [
    ['NOTE', 'note', '提示'],
    ['INFO', 'note', '信息'],
    ['TIP', 'tip', '技巧'],
    ['IMPORTANT', 'important', '重要'],
    ['WARNING', 'warning', '注意'],
    ['CAUTION', 'danger', '警告'],
    ['DANGER', 'danger', '危险'],
  ]

  for (const [type, cls, label] of cases) {
    it(`[!${type}] → .callout-${cls} + 标题“${label}”, 标记行被剥离`, () => {
      const doc = parse(render(`> [!${type}]\n> body-${type.toLowerCase()}`))
      const callout = doc.querySelector(`.callout.callout-${cls}`)!
      expect(callout).not.toBeNull()
      expect(callout.querySelector('.callout-title')!.textContent).toBe(label)
      // 正文保留, 但 [!TYPE] 标记不应出现在输出里
      expect(callout.textContent).toContain(`body-${type.toLowerCase()}`)
      expect(callout.textContent).not.toContain(`[!${type}]`)
      // 不再是裸 blockquote
      expect(doc.querySelector('blockquote')).toBeNull()
    })
  }

  it('类型大小写不敏感: [!note] 同样识别为 callout', () => {
    const callout = parse(render('> [!note]\n> low')).querySelector('.callout-note')!
    expect(callout).not.toBeNull()
    expect(callout.querySelector('.callout-title')!.textContent).toBe('提示')
  })

  it('未知类型 [!FOO]: 保持普通 blockquote, 标记行原样保留', () => {
    const doc = parse(render('> [!FOO]\n> x'))
    expect(doc.querySelector('.callout')).toBeNull()
    const bq = doc.querySelector('blockquote')!
    expect(bq).not.toBeNull()
    expect(bq.textContent).toContain('[!FOO]')
  })

  it('普通引用(无 admonition 标记): 渲染为原样 blockquote', () => {
    const doc = parse(render('> just a quote'))
    expect(doc.querySelector('.callout')).toBeNull()
    expect(doc.querySelector('blockquote')!.textContent).toContain('just a quote')
  })
})

describe('DocRender.render — table', () => {
  it('表格外层包一层 .table-wrapper, 内部仍是 <table>', () => {
    const doc = parse(render('| a | b |\n|---|---|\n| 1 | 2 |'))
    const wrapper = doc.querySelector('.table-wrapper')!
    expect(wrapper).not.toBeNull()
    expect(wrapper.querySelector('table')).not.toBeNull()
    expect(wrapper.querySelectorAll('th')).toHaveLength(2)
    expect(wrapper.querySelectorAll('td')).toHaveLength(2)
  })
})

describe('DocRender.render — image + localImageProxy', () => {
  it('// 已知行为: 本地绝对路径 /img.png 经 render.image 与 localImageProxy 双重前缀, baseUrl=\'/\' 下净结果仍为 /img.png', () => {
    // render.image: href = baseUrl()+href.replace('/','') = '/'+'img.png' = '/img.png' (replace 只换首个 '/')
    // localImageProxy('/img.png'): startsWith('/') → 去首 '/' → 'img.png' → baseUrl()+'img.png' = '/img.png'
    // 两步各剥一次首斜杠再补回, 在 baseUrl='/' 下幂等 → /img.png
    const img = parse(render('![alt](/img.png)')).querySelector('img')!
    expect(img.getAttribute('src')).toBe('/img.png')
    expect(img.getAttribute('alt')).toBe('alt')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.closest('figure.img-wrapper')).not.toBeNull()
    expect(img.closest('figure')!.querySelector('figcaption.img-title')!.textContent).toBe('alt')
  })

  it('// 已知行为: 多级本地路径 /a/b/img.png 双重重写后保持 /a/b/img.png(每步仅剥首斜杠)', () => {
    const img = parse(render('![alt](/a/b/img.png)')).querySelector('img')!
    expect(img.getAttribute('src')).toBe('/a/b/img.png')
  })

  it('相对路径 ./img.png: render.image 不改(非 / 开头) → localImageProxy 去 ./ 前缀后加 baseUrl', () => {
    // render.image 仅处理 '/' 开头; './img.png' 直接进 localImageProxy: 去 './' → 'img.png' → '/img.png'
    const img = parse(render('![alt](./img.png)')).querySelector('img')!
    expect(img.getAttribute('src')).toBe('/img.png')
  })

  it('http 外链图片: 既不被 render.image 改写也不被 localImageProxy 加前缀', () => {
    const img = parse(render('![alt](https://x.com/i.png)')).querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://x.com/i.png')
  })

  it('协议相对 //cdn 图片: localImageProxy 原样透传', () => {
    const img = parse(render('![alt](//cdn.com/i.png)')).querySelector('img')!
    expect(img.getAttribute('src')).toBe('//cdn.com/i.png')
  })

  it('alt 含双引号: escapeAttr 转义进 alt 属性, figcaption 保留原文', () => {
    const figure = parse(render('![a"b](/x.png)')).querySelector('figure')!
    expect(figure.querySelector('img')!.getAttribute('alt')).toBe('a"b')
    expect(figure.querySelector('figcaption')!.textContent).toBe('a"b')
  })
})

describe('DocRender.render — 综合/空输入', () => {
  it('空 markdown 渲染为空串', () => {
    expect(render('').trim()).toBe('')
  })

  it('纯段落文本不受自定义 renderer 影响', () => {
    const doc = parse(render('hello world'))
    expect(doc.querySelector('p')!.textContent).toBe('hello world')
  })
})

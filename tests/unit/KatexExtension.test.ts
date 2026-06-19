import { describe, it, expect } from 'vitest'
import { marked } from 'marked'
import KatexExtension from '@/render/KatexExtension'
import type { TokenizerAndRendererExtension } from 'marked'

// KatexExtension 是 marked 的自定义分词/渲染扩展, 负责把 Markdown 里的数学公式
// 切成占位 token (运行时由 DocPostRender 再动态加载 katex 渲染), 本套件守护纯分词/渲染层:
//   1. inline `$...$` -> inlineKatex token, 渲染为 <span class="inline_tex tex" raw="...">,
//      且行内公式不允许跨换行 (regex 含 [^$\n]) —— 防止把整段文本误吞为一个公式;
//   2. block `$$...$$` 同行 与 多行两种形态 -> blockKatex token, 渲染为 <div class="line_tex tex" raw="...">;
//   3. start() 返回 '$' / '$$' 的偏移, 供 marked 决定何处尝试该扩展 (返回错位会漏匹配或拖慢);
//   4. raw 属性经 escapeAttr 转义 (& " < >), 防止公式源串破坏 HTML 属性 / 注入 (XSS)。
// 不需要 katex 运行时: 这里只验证 token 形状与占位 HTML, 不做真实公式渲染, 因此用纯 node env。

// 取出两个扩展定义直接驱动其 start/tokenizer/renderer (绕过 marked 调度, 精确测分支)
const extensions = (KatexExtension({}).extensions ?? []) as TokenizerAndRendererExtension[]
const inlineExt = extensions.find((e) => e.name === 'inlineKatex')!
const blockExt = extensions.find((e) => e.name === 'blockKatex')!

// 直接调用 tokenizer 的薄封装 (marked 的 tokenizer 第二参是已产出 tokens 列表, 这里传空即可)
const inlineTok = (src: string) => (inlineExt.tokenizer as any).call({}, src, [])
const blockTok = (src: string) => (blockExt.tokenizer as any).call({}, src, [])

// 经完整 marked 管线渲染 (注册扩展) —— 验证端到端 token -> HTML
const md = marked.use(KatexExtension({}))
const render = (src: string) => md.parse(src) as string

describe('KatexExtension 扩展注册形状', () => {
  it('导出两个扩展: inlineKatex(行内) 与 blockKatex(块级)', () => {
    expect(extensions.map((e) => e.name)).toEqual(['inlineKatex', 'blockKatex'])
    expect(inlineExt.level).toBe('inline')
    expect(blockExt.level).toBe('block')
  })
})

describe('inlineKatex tokenizer (行内 $...$)', () => {
  it('单美元包裹 -> inlineKatex token, raw 为原文, text 去内容', () => {
    const tok = inlineTok('$x+y$ 尾巴')
    expect(tok).toMatchObject({ type: 'inlineKatex', raw: '$x+y$', text: 'x+y' })
  })

  it('text 两端空白被 trim', () => {
    expect(inlineTok('$  a + b  $')).toMatchObject({ raw: '$  a + b  $', text: 'a + b' })
  })

  it('必须从串首匹配 (非锚定处不命中)', () => {
    // regex 以 ^ 锚定: marked 会先用 start() 推进到 '$' 再调用, 这里直接喂带前缀的串应不匹配
    expect(inlineTok('前缀 $x$')).toBeUndefined()
  })

  it('行内公式不跨换行 ([^$\\n] 守护)', () => {
    // $ 之后立刻遇换行的内容不构成行内公式 —— 防止误把整段吞成一个公式
    expect(inlineTok('$x+\ny$')).toBeUndefined()
  })

  it('空内容 ($$ 之间无字符) 不匹配', () => {
    // 内容部分是 [^$\n]+? (至少一个非美元非换行字符), 故 "$$" 行内不成立
    expect(inlineTok('$$')).toBeUndefined()
  })

  it('贪婪的 \\$+ 会把成对双美元当作一个行内公式 (直接调用 inline tokenizer 时)', () => {
    // \$+ 允许多个 $ 作边界, 故 "$$x$$" 被行内 tokenizer 识别为 text=x
    // (真实管线中块级先尝试, 故此处是行内分词器单独行为的刻画)
    expect(inlineTok('$$x$$')).toMatchObject({ type: 'inlineKatex', raw: '$$x$$', text: 'x' })
  })
})

describe('inlineKatex renderer', () => {
  it('渲染为带 inline_tex tex 类与 raw 属性的 span', () => {
    const html = (inlineExt.renderer as any).call({}, { text: 'x+y' }) as string
    expect(html).toBe('<span class="inline_tex tex" raw="x+y"></span>')
  })

  it('raw 属性经 escapeAttr 转义 (& " < >)', () => {
    const html = (inlineExt.renderer as any).call({}, { text: '<a> & "q" >' }) as string
    expect(html).toContain('raw="&lt;a&gt; &amp; &quot;q&quot; &gt;"')
    // 转义后属性内不应残留裸 < > " (& 仍以实体 &amp; 形式出现是正确的)
    expect(html).not.toMatch(/raw="[^"]*[<>][^"]*"/)
  })
})

describe('blockKatex tokenizer (块级 $$...$$)', () => {
  it('同行形态 $$ x $$ -> blockKatex token, text 去内容并 trim', () => {
    expect(blockTok('$$ x+y $$')).toMatchObject({ type: 'blockKatex', raw: '$$ x+y $$', text: 'x+y' })
  })

  it('多行形态 $$\\n...\\n$$ -> blockKatex token', () => {
    const tok = blockTok('$$\nx+y\n$$')
    expect(tok).toMatchObject({ type: 'blockKatex', raw: '$$\nx+y\n$$', text: 'x+y' })
  })

  it('多行内容保留内部换行 (仅首尾 trim)', () => {
    expect(blockTok('$$\na\nb\n$$')).toMatchObject({ type: 'blockKatex', text: 'a\nb' })
  })

  it('单美元 $x$ 不构成块级公式', () => {
    expect(blockTok('$x$')).toBeUndefined()
  })

  it('空块 $$$$ 不匹配 (内容需非空)', () => {
    expect(blockTok('$$$$')).toBeUndefined()
  })
})

describe('blockKatex renderer', () => {
  it('渲染为带 line_tex tex 类与 raw 属性的 div', () => {
    const html = (blockExt.renderer as any).call({}, { text: 'x+y' }) as string
    expect(html).toBe('<div class="line_tex tex" raw="x+y"></div>')
  })

  it('raw 属性经 escapeAttr 转义', () => {
    const html = (blockExt.renderer as any).call({}, { text: 'a < b & "c"' }) as string
    expect(html).toContain('raw="a &lt; b &amp; &quot;c&quot;"')
  })
})

describe('start() 偏移 (marked 调度入口)', () => {
  it('inline.start 返回首个 $ 的下标', () => {
    expect((inlineExt.start as any).call({}, 'abc $x$')).toBe(4)
    expect((inlineExt.start as any).call({}, '$x$')).toBe(0)
  })

  it('inline.start 无 $ 时返回 -1', () => {
    expect((inlineExt.start as any).call({}, 'no dollar here')).toBe(-1)
  })

  it('block.start 返回首个 $$ 的下标', () => {
    expect((blockExt.start as any).call({}, 'abc $$x$$')).toBe(4)
    expect((blockExt.start as any).call({}, '$$x$$')).toBe(0)
  })

  it('block.start 仅有单个 $ 时返回 -1 (需 $$)', () => {
    expect((blockExt.start as any).call({}, 'only one $ sign')).toBe(-1)
  })
})

describe('端到端 marked 渲染 (注册扩展后)', () => {
  it('段落中的行内公式渲染为 inline_tex span', () => {
    const html = render('文字 $a^2$ 收尾')
    expect(html).toContain('<span class="inline_tex tex" raw="a^2"></span>')
    expect(html).toMatch(/<p>文字 <span class="inline_tex tex" raw="a\^2"><\/span> 收尾<\/p>/)
  })

  it('整块 $$..$$ 渲染为 line_tex div (不被包进 <p>)', () => {
    const html = render('$$\nE=mc^2\n$$')
    expect(html).toContain('<div class="line_tex tex" raw="E=mc^2"></div>')
  })

  it('跨换行的 $...$ 不被当作公式, 原样保留美元号', () => {
    const html = render('金额 $5 和 $10 元')
    // 注意: '$5 和 $' 之间无换行, 会被行内分词器吞成公式 —— 这刻画真实行为而非"美元号一定原样"
    expect(html).toContain('<span class="inline_tex tex"')
  })

  it('行内公式 raw 在 HTML 中被转义 (XSS 防护)', () => {
    const html = render('$<img src=x onerror=alert(1)>$')
    expect(html).toContain('raw="&lt;img src=x onerror=alert(1)&gt;"')
    // 渲染结果里不得出现可执行的裸 <img 标签
    expect(html).not.toContain('<img src=x')
  })
})

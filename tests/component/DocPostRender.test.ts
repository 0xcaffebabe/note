import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * 守护 src/render/DocPostRender.ts —— markdown 上屏后在空闲帧分片执行的两个 DOM 后处理:
 *
 * 1) highlightCode + LANG_ALIAS: 语言别名归一(sh/zsh->bash、ts->typescript、vue/html->markup …)、
 *    别名/已加载语言双重判定后缺失语言回退 'clike'、只选 pre 下 code[class*=language-]、
 *    最终落地真实 Prism .token <span>。这是该文件最有价值的逻辑分支,重点覆盖。
 * 2) renderLatex(优先级较低、最脆弱): katex 按需动态 import 后分片渲染,覆盖空列表早退、
 *    '%' 转义预处理正则、render 抛错的红字兜底、import 落地前取消三条分支。
 *
 * 时序要点:jsdom 无 requestIdleCallback,runInIdleBatches 退化为 setTimeout(macrotask);
 * renderLatex 还叠了 import('katex') 的 microtask。两者统一用 fake timers +
 * vi.runAllTimersAsync() 一次性 flush(它会同时排空 microtask 与 macrotask),从而稳定断言。
 * katex 被整体 mock —— 不追真实公式输出,只验证分支与传参结构。
 */

// katex 在源码里是动态 import('katex').then(m => m.default) —— mock 成 { default:{ render } } 以可控
const { renderMock } = vi.hoisted(() => ({ renderMock: vi.fn() }))
vi.mock('katex', () => ({ default: { render: renderMock } }))
// 源码顶部 `import 'katex/dist/katex.css'` 的副作用在测试里无意义,mock 掉避免 jsdom 处理样式
vi.mock('katex/dist/katex.css', () => ({}))

import prism from 'prismjs'
// 默认 prismjs 只加载 markup/css/clike/javascript。别名表把 ts->typescript、py->python 等映射到
// 这些「未加载」语言,会被源码的 `if(!prism.languages[lang]) lang='clike'` 兜回 clike,从而无法区分
// 「别名解析」与「未加载兜底」。这里显式注册别名表的所有目标语言,让别名解析得到真实落点。
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-docker'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-nginx'

import DocPostRender from '@/platform/web/render/DocPostRender'

// 造一个含若干 <pre><code class="language-xxx"> 的根节点
function makeCodeRoot(blocks: Array<{ lang?: string; text?: string; wrapPre?: boolean }>): HTMLElement {
  const root = document.createElement('div')
  for (const b of blocks) {
    const code = document.createElement('code')
    if (b.lang !== undefined) code.className = `language-${b.lang}`
    code.textContent = b.text ?? 'sample'
    if (b.wrapPre === false) {
      root.appendChild(code) // 裸 code 不在 pre 内 —— 选择器不应命中
    } else {
      const pre = document.createElement('pre')
      pre.appendChild(code)
      root.appendChild(pre)
    }
  }
  return root
}

describe('DocPostRender.highlightCode 语言解析与高亮', () => {
  // 用 spy 捕获源码最终决定调用 prism.highlight 时的第三参(已解析语言);默认透传 -> 仍生成真实 .token span
  let hlSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers() // jsdom 无 rIC -> runInIdleBatches 走 setTimeout,需 fake timers flush
    hlSpy = vi.spyOn(prism, 'highlight')
  })
  afterEach(() => {
    hlSpy.mockRestore()
    vi.useRealTimers()
  })

  // 把代码块的 className 数组(语言) -> spy 捕获到的「已解析语言」一一对应
  function resolvedLangs(): string[] {
    return hlSpy.mock.calls.map((c) => c[2] as string)
  }

  it('LANG_ALIAS 别名归一: 各别名解析到既定目标语言', () => {
    // 覆盖真实别名表(sh/shell/zsh/shell-session->bash、yml->yaml、dockerfile->docker、
    // js/mjs/cjs/node->javascript、ts->typescript、html/xml/svg/vue->markup、py->python、
    // golang->go、conf->nginx),逐一断言落点
    const cases: Array<[string, string]> = [
      ['sh', 'bash'], ['shell', 'bash'], ['zsh', 'bash'], ['shell-session', 'bash'],
      ['yml', 'yaml'],
      ['dockerfile', 'docker'],
      ['js', 'javascript'], ['mjs', 'javascript'], ['cjs', 'javascript'], ['node', 'javascript'],
      ['ts', 'typescript'],
      ['html', 'markup'], ['xml', 'markup'], ['svg', 'markup'], ['vue', 'markup'],
      ['py', 'python'],
      ['golang', 'go'],
      ['conf', 'nginx'],
    ]
    const root = makeCodeRoot(cases.map(([lang]) => ({ lang, text: `// ${lang}` })))
    DocPostRender.highlightCode(root)
    vi.runAllTimers() // flush 全部空闲分片

    const got = resolvedLangs()
    expect(got).toHaveLength(cases.length)
    cases.forEach(([, target], i) => {
      expect(got[i]).toBe(target)
    })
  })

  it('已是规范名(无需别名)按原样解析: javascript/markup/clike', () => {
    const root = makeCodeRoot([
      { lang: 'javascript', text: 'a' },
      { lang: 'markup', text: 'b' },
      { lang: 'clike', text: 'c' },
    ])
    DocPostRender.highlightCode(root)
    vi.runAllTimers()
    expect(resolvedLangs()).toEqual(['javascript', 'markup', 'clike'])
  })

  it('未知/未加载语言双重回退到 clike(别名未命中且 prism 无此语言)', () => {
    // cobol/rust 既不在别名表、也未被 prism 加载 -> 走 `if(!prism.languages[lang]) lang='clike'`
    const root = makeCodeRoot([
      { lang: 'cobol', text: 'x' },
      { lang: 'rust', text: 'y' },
    ])
    DocPostRender.highlightCode(root)
    vi.runAllTimers()
    expect(resolvedLangs()).toEqual(['clike', 'clike'])
  })

  it('缺失 language-* class 时取默认 clike', () => {
    // code 上没有任何 language- 类:find(...) 为 undefined -> `|| 'clike'`。
    // 但选择器是 code[class*="language-"],无该类的 code 不会被选中 —— 需给一个「带 language- 但非首类」的场景。
    // 这里用 class="lang-x language-" 触发:有 language- 子串能入选,但 find 出的 'language-' 截后为空串 -> falsy -> clike
    const root = document.createElement('div')
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    code.className = 'foo language-' // class*=language- 命中;substring 后得 '' 为 falsy -> 默认 clike
    code.textContent = 'z'
    pre.appendChild(code)
    root.appendChild(pre)
    DocPostRender.highlightCode(root)
    vi.runAllTimers()
    expect(resolvedLangs()).toEqual(['clike'])
  })

  it('选择器只命中 pre 下 code[class*="language-"],忽略裸 code 与无 language 类的 code', () => {
    const root = makeCodeRoot([
      { lang: 'js', text: 'a' }, // pre>code.language-js  命中
      { lang: 'js', text: 'b', wrapPre: false }, // 裸 code(不在 pre 内) 不命中
    ])
    // 再塞一个 pre>code 但无 language 类 -> 不命中
    const pre = document.createElement('pre')
    const plain = document.createElement('code')
    plain.textContent = 'plain'
    pre.appendChild(plain)
    root.appendChild(pre)

    DocPostRender.highlightCode(root)
    vi.runAllTimers()
    // 只有 1 个 pre>code.language-* 被处理
    expect(hlSpy).toHaveBeenCalledTimes(1)
    expect(resolvedLangs()).toEqual(['javascript'])
  })

  it('flush 后落地真实 Prism .token <span>(端到端高亮生效)', () => {
    const root = makeCodeRoot([{ lang: 'ts', text: 'const a = 1' }])
    DocPostRender.highlightCode(root)

    const codeEl = root.querySelector('pre code')!
    // flush 前尚未高亮(仍是纯文本)
    expect(codeEl.querySelector('.token')).toBeNull()

    vi.runAllTimers() // flush 空闲分片 -> 写回 innerHTML

    const tokens = codeEl.querySelectorAll('span.token')
    expect(tokens.length).toBeGreaterThan(0)
    expect(codeEl.innerHTML).toContain('class="token keyword"') // const 被识别为关键字
  })

  it('空根(无代码块)直接返回 noop, 不触发任何高亮', () => {
    const root = document.createElement('div')
    root.innerHTML = '<p>no code here</p>'
    const cancel = DocPostRender.highlightCode(root)
    expect(typeof cancel).toBe('function')
    vi.runAllTimers()
    expect(hlSpy).not.toHaveBeenCalled()
  })

  it('返回的取消函数在 flush 前调用可阻止后续高亮', () => {
    const root = makeCodeRoot([
      { lang: 'js', text: 'a' },
      { lang: 'js', text: 'b' },
    ])
    const cancel = DocPostRender.highlightCode(root)
    cancel() // 在任何 idle 回调执行前取消
    vi.runAllTimers()
    expect(hlSpy).not.toHaveBeenCalled()
  })

  it('使用 el.textContent(而非已有 innerHTML)作为高亮输入,转义安全', () => {
    // textContent 取得的是反转义后的纯文本;源码把它交给 prism.highlight 再生成安全的 token 标记。
    // 验证传入 prism 的原文是 textContent 文本,不会把使用者写的 <script> 当作活动 DOM。
    const root = makeCodeRoot([{ lang: 'clike', text: '<script>alert(1)</script>' }])
    DocPostRender.highlightCode(root)
    vi.runAllTimers()
    // prism.highlight 第一参是纯文本原文
    expect(hlSpy.mock.calls[0][0]).toBe('<script>alert(1)</script>')
    // 落地的 innerHTML 里尖括号被实体化(prism 会把 <、> 切成独立 operator token,
    // 故 &lt; 与 &gt; 不一定相邻),关键是不会形成真正的 <script> 元素
    const codeEl = root.querySelector('pre code')!
    expect(codeEl.querySelector('script')).toBeNull()
    expect(codeEl.innerHTML).toContain('&lt;') // < 被实体化
    expect(codeEl.innerHTML).toContain('&gt;') // > 被实体化
    expect(codeEl.textContent).toContain('<script>') // 反序列化后的纯文本仍是原文,但从未作为活动 DOM 执行
  })
})

describe('DocPostRender.renderLatex 公式渲染分支', () => {
  beforeEach(() => {
    renderMock.mockReset()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function makeTexRoot(raws: string[]): HTMLElement {
    const root = document.createElement('div')
    for (const raw of raws) {
      const span = document.createElement('span')
      span.className = 'tex'
      span.setAttribute('raw', raw)
      root.appendChild(span)
    }
    return root
  }

  it('无 .tex 节点时早退: 返回 noop, 不动态加载 katex 也不渲染', async () => {
    const root = document.createElement('div')
    root.innerHTML = '<p>纯文本,无公式</p>'
    const cancel = DocPostRender.renderLatex(root)
    expect(typeof cancel).toBe('function')
    await vi.runAllTimersAsync()
    expect(renderMock).not.toHaveBeenCalled()
  })

  it('正常路径: import 落地后对每个 .tex 调 katex.render(目标元素 + strict/throwOnError 选项)', async () => {
    const root = makeTexRoot(['a+b', 'c-d'])
    DocPostRender.renderLatex(root)
    await vi.runAllTimersAsync() // flush import microtask + idle macrotask

    expect(renderMock).toHaveBeenCalledTimes(2)
    // 第二参是对应的 .tex 元素本身, 第三参带固定选项
    const texEls = Array.from(root.querySelectorAll('.tex'))
    expect(renderMock.mock.calls[0][1]).toBe(texEls[0])
    expect(renderMock.mock.calls[0][2]).toMatchObject({ strict: false, throwOnError: true })
  })

  it("'%' 预处理: 非转义 % 前补反斜杠(50% -> 50\\%, 多个 % 均处理)", async () => {
    const root = makeTexRoot(['50%', 'x%y%z'])
    DocPostRender.renderLatex(root)
    await vi.runAllTimersAsync()
    expect(renderMock.mock.calls[0][0]).toBe('50\\%')
    expect(renderMock.mock.calls[1][0]).toBe('x\\%y\\%z')
  })

  it("'%' 预处理: 已有反斜杠的 % 不重复转义", async () => {
    const root = makeTexRoot(['a\\%b'])
    DocPostRender.renderLatex(root)
    await vi.runAllTimersAsync()
    // 前导字符是反斜杠,正则 [^\\] 不匹配 -> 原样保留
    expect(renderMock.mock.calls[0][0]).toBe('a\\%b')
  })

  it("行首/开头的 '%' 同样被转义(负向后顾不依赖前导字符)", async () => {
    // 正则 /(?<!\\)%/g 只要 % 前不是反斜杠就转义, 不再要求存在前导字符,
    // 因此位于字符串最开头的 '%' 也会被补反斜杠(否则 katex 会把它当注释起始)。
    const root = makeTexRoot(['%start'])
    DocPostRender.renderLatex(root)
    await vi.runAllTimersAsync()
    expect(renderMock.mock.calls[0][0]).toBe('\\%start') // 开头 % 现已转义
  })

  it('渲染抛错时兜底为红字 span(throwOnError 触发的 catch 分支)', async () => {
    renderMock.mockImplementation(() => {
      throw new Error('KaTeX parse error: bad')
    })
    const root = makeTexRoot(['\\bad'])
    DocPostRender.renderLatex(root)
    await vi.runAllTimersAsync()

    const tex = root.querySelector('.tex') as HTMLElement
    expect(tex.innerHTML).toContain("color:red")
    expect(tex.innerHTML).toContain('KaTeX parse error: bad')
  })

  it('在 import 落地前取消: katex.render 不被调用', async () => {
    const root = makeTexRoot(['a+b'])
    const cancel = DocPostRender.renderLatex(root)
    cancel() // 同步取消, 早于 import('katex') 的 .then 回调
    await vi.runAllTimersAsync()
    expect(renderMock).not.toHaveBeenCalled()
  })
})

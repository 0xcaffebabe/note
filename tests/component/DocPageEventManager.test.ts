import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * 守护 src/pages/doc/DocPageHeadingResolver.ts —— 从 DocPageEventManager 抽出的两段
 * 与 Vue/element-plus 解耦的逻辑(原类构造依赖 Vue 实例且顶部 import 约 8 个 .vue/element-plus
 * 模块, 直接实例化不现实, 故只测抽出的独立 helper):
 *
 * 1) resolveHeadingElement —— syncHeading 的标题三级解析。覆盖:
 *    a) 直接命中原始 id; b) 原始 id 未中但 slug 化后命中(兼容搜索索引/旧链接的标题原文);
 *    c) 前两级皆未中, 退化为 .markdown-section 下 h1~h6 的「忽略大小写 + trim」文本前缀匹配;
 *    d) 全未命中返回 null; 以及若干边界(前缀匹配只认 .markdown-section 内、startsWith 而非包含、
 *    第一个命中者优先、自定义 doc 注入)。
 * 2) openOutterLinkFallback —— openOutterLink 的崩溃兜底分支。覆盖:有 brower 时调用其 show 且
 *    不开新标签; 无 brower(undefined)时退回 window.open(link,'_blank','noopener')。
 *
 * jsdom(component)环境提供 document / window.open;后者被 vi.spyOn 桩住以断言参数。
 */

import { resolveHeadingElement, openOutterLinkFallback } from '@/platform/web/pages/doc/DocPageHeadingResolver'

// 往真实 jsdom document 上插一段 html, 每个用例前清空
function setBody(html: string) {
  document.body.innerHTML = html
}

beforeEach(() => {
  setBody('')
})

describe('resolveHeadingElement —— 标题三级解析', () => {
  describe('第一级: 直接命中原始 id', () => {
    it('原始 headingId 与某元素 id 完全一致时直接返回该元素', () => {
      setBody('<h2 id="installation">安装</h2>')
      const elm = resolveHeadingElement('installation')
      expect(elm).not.toBeNull()
      expect(elm!.id).toBe('installation')
    })

    it('原始 id 命中优先于其它级别(即便存在同 slug 的其它元素)', () => {
      setBody(`
        <div class="markdown-section">
          <h2 id="Hello World">直命</h2>
          <h2 id="hello-world">slug级</h2>
        </div>
      `)
      // 'Hello World' 直接作为 id 命中第一级, 不应落到 slug('hello-world')那一个
      const elm = resolveHeadingElement('Hello World')
      expect(elm!.id).toBe('Hello World')
      expect(elm!.textContent).toBe('直命')
    })
  })

  describe('第二级: 原始 id 未中, slug 化后命中', () => {
    it('传入标题原文(含大小写/空格), slug 化为 hello-world 后命中', () => {
      setBody('<h2 id="hello-world">Hello World</h2>')
      const elm = resolveHeadingElement('Hello World')
      expect(elm!.id).toBe('hello-world')
    })

    it('传入带 markdown # 前缀的原文, slug 去前缀后命中', () => {
      setBody('<h3 id="my-title">My Title</h3>')
      const elm = resolveHeadingElement('## My Title')
      expect(elm!.id).toBe('my-title')
    })

    it('大写原文 slug 转小写后命中', () => {
      setBody('<h2 id="upper">UPPER</h2>')
      const elm = resolveHeadingElement('UPPER')
      expect(elm!.id).toBe('upper')
    })

    it('中文标题 slug 保留中文后命中', () => {
      setBody('<h2 id="中文标题">中文标题</h2>')
      const elm = resolveHeadingElement('中文标题')
      expect(elm!.id).toBe('中文标题')
    })
  })

  describe('第三级: id/slug 皆未中, 按 .markdown-section 内标题文本前缀匹配', () => {
    it('忽略大小写 + trim 的前缀匹配命中', () => {
      setBody(`
        <div class="markdown-section">
          <h2 id="h-a">  Getting Started 入门  </h2>
          <h2 id="h-b">其它</h2>
        </div>
      `)
      // headingId='getting started' 既非任何 id 也非任何 slug, 落到文本前缀匹配
      const elm = resolveHeadingElement('getting started')
      expect(elm!.id).toBe('h-a')
    })

    it('前缀匹配采用 startsWith 而非「包含」: 中段子串不命中', () => {
      setBody(`
        <div class="markdown-section">
          <h2 id="h-a">Introduction to Vue</h2>
        </div>
      `)
      // 'Vue' 是中段子串而非前缀 -> 不命中, 返回 null
      const elm = resolveHeadingElement('Vue')
      expect(elm).toBeNull()
    })

    it('多个标题都以该前缀开头时取第一个(DOM 顺序)', () => {
      setBody(`
        <div class="markdown-section">
          <h2 id="first">Config 一级</h2>
          <h3 id="second">Config 二级</h3>
        </div>
      `)
      const elm = resolveHeadingElement('config')
      expect(elm!.id).toBe('first')
    })

    it('已知 BUG: 选择器 ".markdown-section h1,h2,h3,h4,h5,h6" 实为逗号分组, 仅 h1 受 .markdown-section 限定, h2~h6 全局匹配', () => {
      setBody(`
        <h2 id="outside">Outside Heading</h2>
        <div class="markdown-section"></div>
      `)
      // 'Outside' 非 id 非 slug(slug 为 outside-heading)。按注释本意 h2 应只在 markdown-section 内,
      // 但 CSS 逗号把选择器拆成 [".markdown-section h1", "h2", "h3", "h4", "h5", "h6"],
      // 故 section 外的 h2 仍被前缀匹配命中。这里固化当前真实行为(非 null)。
      const elm = resolveHeadingElement('Outside')
      expect(elm).not.toBeNull()
      expect(elm!.id).toBe('outside')
    })

    it('已知 BUG 对照: 真正受 .markdown-section 限定的只有 h1, section 外的 h1 前缀匹配不命中', () => {
      setBody(`
        <h1 id="outside-h1">Lonely Heading</h1>
        <div class="markdown-section"></div>
      `)
      // h1 在选择器里写作 ".markdown-section h1", 受限定 -> section 外的 h1 不参与匹配 -> null
      const elm = resolveHeadingElement('Lonely')
      expect(elm).toBeNull()
    })

    it('h1~h6 各级标题均参与前缀匹配', () => {
      setBody(`
        <div class="markdown-section">
          <h6 id="deep">Deep Level Heading</h6>
        </div>
      `)
      const elm = resolveHeadingElement('deep level')
      expect(elm!.id).toBe('deep')
    })
  })

  describe('未命中与边界', () => {
    it('三级皆未命中返回 null', () => {
      setBody('<div class="markdown-section"><h2 id="x">无关标题</h2></div>')
      expect(resolveHeadingElement('完全不存在的')).toBeNull()
    })

    it('支持注入自定义 Document(默认取全局 document)', () => {
      const doc = new DOMParser().parseFromString(
        '<div class="markdown-section"><h2 id="injected">Injected Title</h2></div>',
        'text/html'
      )
      const elm = resolveHeadingElement('injected', doc)
      expect(elm!.id).toBe('injected')
      // 全局 document(空)中不应命中, 证明确实用了注入的 doc
      expect(resolveHeadingElement('injected')).toBeNull()
    })
  })
})

describe('openOutterLinkFallback —— 外部链接打开兜底', () => {
  let openSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    openSpy.mockRestore()
  })

  it('已挂载资源浏览器时调用其 show, 且不开新标签', () => {
    const brower = { show: vi.fn() }
    openOutterLinkFallback(brower, 'https://example.com/a')
    expect(brower.show).toHaveBeenCalledTimes(1)
    expect(brower.show).toHaveBeenCalledWith('https://example.com/a')
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('未挂载(undefined)时退回 window.open(link, _blank, noopener)', () => {
    openOutterLinkFallback(undefined, 'https://example.com/b')
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy).toHaveBeenCalledWith('https://example.com/b', '_blank', 'noopener')
  })
})

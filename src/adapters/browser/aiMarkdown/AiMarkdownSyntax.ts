import type { RendererObject } from 'marked'
import { escapeMarkup, safeMarkdownLink } from './AiMarkdownPolicy'

/** 模型 Markdown 的专用语法渲染器；图片只显示替代文本，原始 HTML 作为文本。 */
export function createAiMarkdownSyntax(): RendererObject {
  return {
    html({ text }) {
      return escapeMarkup(text)
    },
    image({ text }) {
      return text ? `<span class="ai-image-alt">[图片：${escapeMarkup(text)}]</span>` : ''
    },
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens)
      const url = safeMarkdownLink(href)
      if (!url) {
        return label
      }
      const external = /^https:\/\//i.test(url)
      return [
        `<a href="${escapeMarkup(url)}"`,
        title ? ` title="${escapeMarkup(title)}"` : '',
        external ? ' target="_blank" rel="noopener noreferrer"' : '',
        `>${label}</a>`,
      ].join('')
    },
    code({ text, lang }) {
      const language = (lang || '')
        .split(/\s/)[0]
        .replace(/[^a-zA-Z0-9_+#.-]/g, '')
        .slice(0, 32)
      return [
        '<div class="ai-code-block"><div class="ai-code-toolbar">',
        `<span>${escapeMarkup(language || '代码')}</span>`,
        '<button type="button" data-copy-code="true">复制代码</button>',
        `</div><pre><code>${escapeMarkup(text)}</code></pre></div>`,
      ].join('')
    },
  }
}

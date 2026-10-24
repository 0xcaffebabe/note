import DOMPurify from 'dompurify'
import { Marked } from 'marked'
import type { AiCitation } from '@/core/domain/AiDocumentTools'

const ALLOWED_TAGS = ['p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'del', 'blockquote', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'a', 'span', 'div', 'button']

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** History and model links are untrusted too. Never allow relative network/JS/data URLs. */
function safeUrl(value: unknown, citation = false): string | null {
  if (typeof value !== 'string' || value.length > 8192 || /[\u0000-\u0020\u007f\\]/.test(value)) return null
  try {
    const url = new URL(value, 'https://note.invalid')
    if (value.startsWith('/') && !value.startsWith('//') && url.origin === 'https://note.invalid') return value
    if (citation) return null
    if (value.startsWith('#')) return value
    if (/^https:\/\//i.test(value) && url.protocol === 'https:' && !url.username && !url.password) return value
  } catch { /* Malformed URLs render as plain text. */ }
  return null
}

/** Separate Marked instance: document KaTeX/HTML plugins never process model output. */
export function renderAiMarkdown(content: string, sources: AiCitation[] = []): string {
  const citations = new Map<string, { source: AiCitation; url: string; index: number }>()
  for (const source of sources) {
    const url = safeUrl(source?.url, true)
    if (url && /^D\d{1,24}S\d{1,8}$/.test(source.sourceId) && !citations.has(source.sourceId)) {
      citations.set(source.sourceId, { source, url, index: citations.size + 1 })
    }
  }
  const markdown = new Marked({ gfm: true, breaks: true, async: false })
  markdown.use({
    renderer: {
      html({ text }) { return escapeHtml(text) },
      image({ text }) { return text ? `<span class="ai-image-alt">[图片：${escapeHtml(text)}]</span>` : '' },
      link({ href, title, tokens }) {
        const label = this.parser.parseInline(tokens)
        const url = safeUrl(href)
        if (!url) return label
        const external = /^https:\/\//i.test(url)
        return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`
      },
      code({ text, lang }) {
        const language = (lang || '').split(/\s/)[0].replace(/[^a-zA-Z0-9_+#.-]/g, '').slice(0, 32)
        return `<div class="ai-code-block"><div class="ai-code-toolbar"><span>${escapeHtml(language || '代码')}</span><button type="button" data-copy-code="true">复制代码</button></div><pre><code>${escapeHtml(text)}</code></pre></div>`
      },
    },
    extensions: [{
      name: 'aiCitation',
      level: 'inline',
      start: text => text.indexOf('[D'),
      tokenizer(text) {
        const match = /^\[(D\d{1,24}S\d{1,8})\]/.exec(text)
        if (match && citations.has(match[1])) return { type: 'aiCitation', raw: match[0], sourceId: match[1] }
      },
      renderer(token) {
        const citation = citations.get(token.sourceId as string)
        return citation ? `<a class="ai-citation" href="${escapeHtml(citation.url)}" title="${escapeHtml(citation.source.title)}" aria-label="${escapeHtml(citation.source.title)}">[${citation.index}]</a>` : escapeHtml(token.raw)
      },
    }],
  })
  return DOMPurify.sanitize(markdown.parse(content) as string, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'type', 'data-copy-code', 'aria-label', 'start', 'align'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'svg', 'math', 'img', 'video', 'audio', 'form', 'input'],
  })
}

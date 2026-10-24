import DOMPurify from 'dompurify'
import { escapeAttr } from '@/core/util/StringUtils'

const SITE_BASE = 'https://note.invalid'

/** 模型输出中的文本和属性统一转义，包括引号，不能借 Markdown 注入 HTML。 */
export function escapeMarkup(value: string): string {
  return escapeAttr(value).replace(/'/g, '&#39;')
}

/** 校验普通链接；允许站内路径、页内锚点与无凭据的 HTTPS 外链。 */
export function safeMarkdownLink(value: unknown): string | null {
  const url = parseLink(value)
  if (!url || typeof value !== 'string') {
    return null
  }
  if (isSitePath(value, url) || value.startsWith('#')) {
    return value
  }
  if (/^https:\/\//i.test(value) && url.protocol === 'https:' && !url.username && !url.password) {
    return value
  }
  return null
}

/** 引用只能指向知识站点的绝对路径；历史记录中的 URL 同样重新校验。 */
export function safeCitationLink(value: unknown): string | null {
  const url = parseLink(value)
  return url && typeof value === 'string' && isSitePath(value, url) ? value : null
}

function parseLink(value: unknown): URL | undefined {
  if (typeof value !== 'string' || value.length > 8192 || /[\u0000-\u0020\u007f\\]/.test(value)) {
    return undefined
  }
  try {
    return new URL(value, SITE_BASE)
  } catch {
    // 无法解析的链接降级为普通文本，不能影响整个回答的渲染。
    return undefined
  }
}

function isSitePath(value: string, url: URL): boolean {
  return value.startsWith('/') && !value.startsWith('//') && url.origin === SITE_BASE
}

/** Markdown 扩展生成的 HTML 仍经过最终白名单净化，禁止主动加载外部资源。 */
export function sanitizeAiHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'hr',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'strong',
      'em',
      'del',
      'blockquote',
      'ul',
      'ol',
      'li',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'pre',
      'code',
      'a',
      'span',
      'div',
      'button',
    ],
    ALLOWED_ATTR: [
      'href',
      'title',
      'target',
      'rel',
      'class',
      'type',
      'data-copy-code',
      'aria-label',
      'start',
      'align',
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'svg', 'math', 'img', 'video', 'audio', 'form', 'input'],
  })
}

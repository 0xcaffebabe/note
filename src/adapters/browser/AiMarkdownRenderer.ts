import { Marked } from 'marked'
import type { AiCitation } from '@/core/domain/AiDocumentTools'
import { createCitationExtension } from './aiMarkdown/AiCitationExtension'
import { createAiMarkdownSyntax } from './aiMarkdown/AiMarkdownSyntax'
import { sanitizeAiHtml } from './aiMarkdown/AiMarkdownPolicy'

/**
 * 渲染不可信的模型回答；每次创建独立解析器，避免共享文档的 HTML/KaTeX 扩展。
 * 语法生成、引用校验和最终 HTML 净化分别维护，返回值可交给 AI 消息组件展示。
 */
export function renderAiMarkdown(content: string, sources: AiCitation[] = []): string {
  const markdown = new Marked({ gfm: true, breaks: true, async: false })
  markdown.use({
    renderer: createAiMarkdownSyntax(),
    extensions: [createCitationExtension(sources)],
  })
  return sanitizeAiHtml(markdown.parse(content) as string)
}

// MarkdownPort 的 node 实现: 用 marked(构建期不需要 KaTeX 渲染扩展)。
// 与浏览器侧 MarkedMarkdownAdapter 实现同一端口, 仅不挂 KaTeX 扩展。
import type { MarkdownPort, MdRenderer } from '../../core/ports/MarkdownPort'
import { marked } from 'marked'

export class NodeMarkdownAdapter implements MarkdownPort {
  createRenderer(): MdRenderer {
    return new marked.Renderer() as unknown as MdRenderer
  }
  parse(markdown: string, opts: { renderer: MdRenderer; breaks?: boolean }): string {
    return marked.parse(markdown, { renderer: opts.renderer as unknown as marked.Renderer, breaks: opts.breaks }) as string
  }
  render(markdown: string): string {
    return marked(markdown) as string
  }
}

export const nodeMarkdown = new NodeMarkdownAdapter()

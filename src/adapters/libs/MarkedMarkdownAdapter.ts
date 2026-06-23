// MarkdownPort 的实现: 委托 marked, 并注册站内 KaTeX 扩展。
// KatexExtension 是 marked 专属扩展, 留在 outer(@/render)。core 不直接依赖它们。
import type { MarkdownPort, MdRenderer } from '@/core/ports'
import { marked } from 'marked'
import KatexExtension from './KatexExtension'

// katex扩展只需注册一次 重复use会向marked全局实例累加扩展
marked.use(KatexExtension({}))

export class MarkedMarkdownAdapter implements MarkdownPort {
  createRenderer(): MdRenderer {
    return new marked.Renderer() as unknown as MdRenderer
  }
  parse(markdown: string, opts: { renderer: MdRenderer; breaks?: boolean }): string {
    return marked.parse(markdown, {
      renderer: opts.renderer as unknown as marked.Renderer,
      breaks: opts.breaks,
    }) as string
  }
  render(markdown: string): string {
    return marked(markdown) as string
  }
}

export const markedMarkdown = new MarkedMarkdownAdapter()

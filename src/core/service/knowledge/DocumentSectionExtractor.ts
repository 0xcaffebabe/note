import type {
  PublishedDocumentContent,
  PublishedDocumentHeading,
  PublishedDocumentSection,
} from '../../domain/knowledge/PublishedDocument'

/**
 * 从站点已渲染的正文中提取章节，沿用真实标题 id 和 DOM 遍历顺序。
 * 修改传入的独立 DOM：去除交互控件与可执行标记，保留代码缩进、表格列边界和图片描述。
 * 不截断章节；模型的上下文预算由 Bridge 负责。
 */
export function extractDocumentSections(
  body: HTMLElement,
  fallbackTitle: string,
): Pick<PublishedDocumentContent, 'headings' | 'sources'> {
  const excludedElements = 'script,style,button,.heading-anchor,.code-block-toolbar,sup'
  body.querySelectorAll(excludedElements).forEach(node => node.remove())

  const sources: PublishedDocumentSection[] = []
  const headings: PublishedDocumentHeading[] = []
  let current: PublishedDocumentSection = {
    headingId: '',
    title: fallbackTitle,
    text: '',
  }
  sources.push(current)

  function visit(node: Node): void {
    if (node.nodeType === 3) {
      current.text += node.textContent || ''
      return
    }
    if (node.nodeType !== 1) {
      return
    }

    const element = node as Element
    if (/^H[1-6]$/.test(element.tagName) && element.id) {
      const title = element.textContent || fallbackTitle
      current = {
        headingId: element.id,
        title,
        text: title + '\n',
      }
      sources.push(current)
      headings.push({ id: element.id, title })
      return
    }

    if (element.tagName === 'PRE' || element.classList.contains('mermaid-source')) {
      current.text += '\n```\n' + (element.textContent || '') + '\n```\n'
      return
    }
    if (element.tagName === 'IMG') {
      current.text += element.getAttribute('alt') || ''
      return
    }
    if (element.tagName === 'TABLE') {
      current.text += '\n' + extractTableText(element) + '\n'
      return
    }

    Array.from(element.childNodes).forEach(visit)
    if (/^(P|DIV|LI|TR|BLOCKQUOTE|UL|OL|BR)$/.test(element.tagName)) {
      current.text += '\n'
    }
    if (/^(TD|TH)$/.test(element.tagName)) {
      current.text += '\t'
    }
  }

  Array.from(body.childNodes).forEach(visit)
  return {
    headings,
    sources: sources.filter(source => source.text.trim().length > 0),
  }
}

function extractTableText(table: Element): string {
  return Array.from(table.querySelectorAll('tr'), row => {
    return Array.from(row.querySelectorAll('th,td'), cell => {
      return cell.textContent?.trim() || ''
    }).join('\t')
  }).join('\n')
}

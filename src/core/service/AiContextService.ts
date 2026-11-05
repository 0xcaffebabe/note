import type { PublishedDocumentContent } from '../domain/knowledge/PublishedDocument'
import type { DomParserPort } from '../ports/DomParserPort'
import type { KnowledgeDocumentReaderPort } from '../ports/KnowledgeDocumentReaderPort'
import DocUtils from '../util/DocUtils'
import { extractDocumentSections } from './knowledge/DocumentSectionExtractor'

export type {
  PublishedDocumentContent,
  PublishedDocumentSection,
} from '../domain/knowledge/PublishedDocument'

/**
 * 静态文档内容的提取门面，负责组装文档身份、原文地址和渲染后的章节。
 * 读取与渲染经端口注入，DOM 遍历交给章节提取器；不承担 Agent 的上下文选择。
 */
export class AiContextService {
  constructor(
    private readonly docs: KnowledgeDocumentReaderPort,
    private readonly dom: DomParserPort,
  ) {}

  /** 读取完整文档并保留真实标题锚点，供独立发布的知识客户端引用。 */
  public async load(docId: string): Promise<PublishedDocumentContent> {
    const file = await this.docs.getDocFileInfo(docId)
    const body = this.dom.parse(this.docs.renderMd(file)).body
    const { headings, sources } = extractDocumentSections(body, file.name)

    return {
      docId,
      title: file.name,
      url: encodeURI(DocUtils.docId2HtmlPath(docId)),
      headings,
      sources,
    }
  }
}

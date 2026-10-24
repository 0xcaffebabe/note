import type DocFileInfo from '../../core/domain/DocFileInfo'
import type { KnowledgeDocumentReaderPort } from '../../core/ports/KnowledgeDocumentReaderPort'
import DocRender from '../../core/render/DocRender'
import { extractRelatedContent } from '../../core/service/doc/RelatedContentExtractor'
import { nodeDomParser } from './NodeDomParser'
import { nodeMarkdown } from './NodeMarkdownAdapter'

/**
 * 将构建阶段读取的 Markdown 接到站点原有渲染链。
 * 每次复制文件后剥离自动关联章节，避免污染共享的构建输入或改变目录锚点。
 */
export class KnowledgeDocumentReader implements KnowledgeDocumentReaderPort {
  private readonly renderer = new DocRender(nodeMarkdown, nodeDomParser)

  constructor(private readonly files: Map<string, DocFileInfo>) {}

  public async getDocFileInfo(id: string): Promise<DocFileInfo> {
    const file = { ...this.files.get(id)!, relatedLinks: undefined }
    extractRelatedContent(file)
    return file
  }

  public renderMd(file: DocFileInfo): string {
    return this.renderer.render(file.content, file.id, [], [])
  }
}

import type DocFileInfo from '../domain/DocFileInfo'

/**
 * 静态知识提取所需的文档读取与渲染能力。
 * 渲染实现必须复用站点正文渲染规则，使导出的目录锚点能直接跳转到原文。
 */
export interface KnowledgeDocumentReaderPort {
  getDocFileInfo(id: string): Promise<DocFileInfo>
  renderMd(file: DocFileInfo): string
}

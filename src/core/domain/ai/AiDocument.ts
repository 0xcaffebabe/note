/** 附件选择器使用的目录项，锚点与站点发布版本一致。 */
export interface AiDocumentHeading {
  id: string
  title: string
}

/** 桌面端读取站点静态资源后返回的文档目录。 */
export interface AiDocumentMetadata {
  docId: string
  title: string
  url: string
  contentHash: string
  headings: AiDocumentHeading[]
}

/** 提问只携带文档引用，正文由桌面端从站点获取。 */
export interface AiDocumentAttachment {
  docId: string
  headingIds?: string[]
  contentHash?: string
}

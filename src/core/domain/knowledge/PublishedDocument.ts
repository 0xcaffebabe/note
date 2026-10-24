/** 与站点目录锚点一致的标题，供独立发布的知识客户端定位原文。 */
export interface PublishedDocumentHeading {
  id: string
  title: string
}

/** 从站点渲染结果提取的完整章节；未设置标题的文档简介使用空 headingId。 */
export interface PublishedDocumentSection {
  headingId: string
  title: string
  text: string
}

/** 静态文档提取结果，不包含 Agent 的上下文选择或截断策略。 */
export interface PublishedDocumentContent {
  docId: string
  title: string
  url: string
  headings: PublishedDocumentHeading[]
  sources: PublishedDocumentSection[]
}

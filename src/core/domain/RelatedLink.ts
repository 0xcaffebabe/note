// 文档"关联内容（自动生成）"章节抽取出的单条关联链接
export interface RelatedLink {
  href: string  // 站内路由地址 (/path.html)
  path: string  // 原始路径文本 (/path.md) 用于提取展示名/面包屑
  desc: string  // 关联理由
  // 链接在正文所在行的上下文片段(供"其他链接"分组展示, 链接文本居中, 前后各截一段)
  context?: { before: string; text: string; after: string }
}

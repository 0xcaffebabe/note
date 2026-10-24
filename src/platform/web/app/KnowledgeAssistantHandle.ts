/** 应用层唤起懒加载知识助手弹窗的最小接口，不暴露聊天内部状态。 */
export interface KnowledgeAssistantHandle {
  show(): void
}

/** 文档服务生成的可核验引用，不采用模型自行生成的引用地址。 */
export interface AiCitation {
  sourceId: string
  title: string
  url: string
  contentHash?: string
  revision?: string
}

/** 工具参数的展示字段，由桌面端根据实际调用提取。 */
export interface AiToolCallInputField {
  label: string
  value: string
}

/** 精简的工具调用概览，不包含原始工具结果或模型生成的总结。 */
export interface AiToolCallOverview {
  input: AiToolCallInputField[]
  summary?: string
  items?: string[]
  note?: string
}

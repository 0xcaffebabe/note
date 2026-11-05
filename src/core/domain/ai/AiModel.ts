/** 桥接协议支持的推理强度；具体模型只开放其中的一个子集。 */
export const AI_EFFORTS = ['default', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'] as const

export type AiEffort = typeof AI_EFFORTS[number]

/** 桌面端发现的模型能力，不包含提供方凭证。 */
export interface AiModel {
  id: string
  name: string
  efforts: AiEffort[]
  defaultEffort?: AiEffort
  contextWindowTokens?: number
  maxOutputTokens?: number
}

/** 桌面端配置的模型提供方及其可选模型目录。 */
export interface AiProvider {
  id: string
  name: string
  protocol: string
  model: string
  efforts?: AiEffort[]
  models?: AiModel[]
}

/** 新聊天或单次提问采用的模型配置。 */
export interface AiModelSelection {
  providerId: string
  model: string
  effort?: AiEffort
}

/** 模型可覆盖的 token 预算；缺省值由统一预算规则解析。 */
export interface AiModelLimits {
  contextWindowTokens?: number
  maxOutputTokens?: number
}

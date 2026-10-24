import type { AiModel } from '@/core/ports/AiBridgePort'

/** 模型选择器的展示项；key 同时区分提供商和模型，避免自定义模型重名。 */
export interface AssistantModelOption extends AiModel {
  providerId: string
  key: string
}

/** 同一提供商下的模型分组，仅用于选择器展示。 */
export interface AssistantModelGroup {
  id: string
  name: string
  models: AssistantModelOption[]
}

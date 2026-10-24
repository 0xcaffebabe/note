import { AI_EFFORTS, type AiEffort, type AiModel, type AiProvider } from '@/core/domain/ai/AiModel'
import { resolveAiModelLimits } from '@/core/domain/AiLimits'
import { isRecord } from './ProtocolValueReader'

function validText(value: unknown, max: number): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= max
    && !/[\u0000-\u001f\u007f]/.test(value)
}

function readEfforts(value: unknown): AiEffort[] {
  const allowed = Array.isArray(value)
    ? [...new Set(value.filter((effort): effort is AiEffort => AI_EFFORTS.includes(effort)))]
    : []
  return allowed.length ? allowed : ['default']
}

function readModel(value: unknown, ids: Set<string>): AiModel {
  if (!isRecord(value) || !validText(value.id, 256) || !validText(value.name, 256) || ids.has(value.id)) {
    throw new Error('invalid model')
  }
  ids.add(value.id)
  const efforts = readEfforts(value.efforts)
  const defaultEffort = value.defaultEffort as AiEffort
  if (
    (value.contextWindowTokens !== undefined && typeof value.contextWindowTokens !== 'number')
    || (value.maxOutputTokens !== undefined && typeof value.maxOutputTokens !== 'number')
  ) {
    throw new Error('invalid model limits')
  }
  const limits = resolveAiModelLimits({
    contextWindowTokens: value.contextWindowTokens as number | undefined,
    maxOutputTokens: value.maxOutputTokens as number | undefined,
  })
  return {
    id: value.id,
    name: value.name,
    efforts,
    ...(efforts.includes(defaultEffort) ? { defaultEffort } : {}),
    ...(value.contextWindowTokens !== undefined ? { contextWindowTokens: limits.contextWindowTokens } : {}),
    ...(value.maxOutputTokens !== undefined ? { maxOutputTokens: limits.maxOutputTokens } : {}),
  }
}

/** 校验桌面端模型目录，限制数量、消除未知 effort 并保留预算能力。 */
export function readProviders(value: unknown): AiProvider[] {
  if (!Array.isArray(value) || value.length > 200) {
    throw new Error('invalid providers')
  }
  const ids = new Set<string>()
  let modelCount = 0
  return value.map(provider => {
    if (
      !isRecord(provider)
      || !validText(provider.id, 128)
      || !validText(provider.name, 256)
      || !validText(provider.protocol, 80)
      || !validText(provider.model, 256)
      || ids.has(provider.id)
    ) {
      throw new Error('invalid provider')
    }
    ids.add(provider.id)
    const result: AiProvider = {
      id: provider.id,
      name: provider.name,
      protocol: provider.protocol,
      model: provider.model,
      efforts: readEfforts(provider.efforts),
    }
    if (provider.models !== undefined) {
      if (!Array.isArray(provider.models) || provider.models.length > 200) {
        throw new Error('invalid models')
      }
      modelCount += provider.models.length
      if (modelCount > 400) {
        throw new Error('too many models')
      }
      const modelIds = new Set<string>()
      result.models = provider.models.map(model => readModel(model, modelIds))
    }
    return result
  })
}

/** 隔离快照中的可变数组，防止界面修改连接持有的模型目录。 */
export function copyProviders(providers: AiProvider[]): AiProvider[] {
  return providers.map(provider => ({
    ...provider,
    ...(provider.efforts ? { efforts: [...provider.efforts] } : {}),
    ...(provider.models ? {
      models: provider.models.map(model => ({ ...model, efforts: [...model.efforts] })),
    } : {}),
  }))
}

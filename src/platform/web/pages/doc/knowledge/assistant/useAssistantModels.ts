import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { AiEffort, AiProvider, AiSessionSummary } from '@/core/ports/AiBridgePort'
import { resolveAiModelLimits } from '@/core/domain/AiLimits'
import type { AssistantModelGroup } from './AssistantModelOption'

/**
 * 管理当前窗口的模型选择，按会话偏好和实时目录恢复可用模型。
 * 这里只维护表单状态；提供商配置和会话偏好的持久化由 Note Bridge 负责。
 */
export function useAssistantModels(providers: Readonly<Ref<AiProvider[]>>) {
  const modelKey = ref('')
  const effort = ref<AiEffort>('default')
  let preferredProviderId = ''
  let preferredModel = ''
  let preferredEffort: AiEffort = 'default'

  const groups = computed<AssistantModelGroup[]>(() =>
    providers.value.map((provider) => {
      const models = provider.models?.length
        ? provider.models
        : [
            {
              id: provider.model,
              name: provider.model,
              efforts: provider.efforts?.length ? provider.efforts : (['default'] as AiEffort[]),
            },
          ]
      return {
        id: provider.id,
        name: provider.name,
        models: models.map((model) => ({
          ...model,
          providerId: provider.id,
          key: JSON.stringify([provider.id, model.id]),
        })),
      }
    }),
  )
  const options = computed(() => groups.value.flatMap((group) => group.models))
  const selectedModel = computed(() => options.value.find((item) => item.key === modelKey.value))
  const limits = computed(() => resolveAiModelLimits(selectedModel.value))
  const providerId = computed(() => selectedModel.value?.providerId || '')
  const model = computed(() => selectedModel.value?.id || '')
  const availableEfforts = computed<AiEffort[]>(() => {
    const efforts = selectedModel.value?.efforts
    return efforts?.length ? efforts : ['default']
  })

  function syncEffort() {
    effort.value = availableEfforts.value.includes(preferredEffort)
      ? preferredEffort
      : selectedModel.value?.defaultEffort || availableEfforts.value[0] || 'default'
  }

  function syncModel() {
    const available = options.value
    const preferredProvider = providers.value.find(
      (provider) => provider.id === preferredProviderId,
    )
    const firstProvider = providers.value[0]
    const selection =
      available.find(
        (item) => item.providerId === preferredProviderId && item.id === preferredModel,
      ) ||
      available.find(
        (item) => item.providerId === preferredProviderId && item.id === preferredProvider?.model,
      ) ||
      available.find((item) => item.key === modelKey.value) ||
      available.find(
        (item) => item.providerId === firstProvider?.id && item.id === firstProvider.model,
      ) ||
      available[0]
    modelKey.value = selection?.key || ''
    syncEffort()
  }

  function savePreference() {
    preferredProviderId = providerId.value
    preferredModel = model.value
    preferredEffort = effort.value
  }

  function restorePreference(session?: AiSessionSummary) {
    if (session) {
      preferredProviderId = session.providerId
      preferredModel = session.model
      preferredEffort = session.effort
    }
    syncModel()
  }

  function selectModel() {
    syncEffort()
    savePreference()
  }

  watch(providers, syncModel, { immediate: true })

  return {
    modelKey,
    effort,
    groups,
    options,
    limits,
    providerId,
    model,
    availableEfforts,
    selectModel,
    savePreference,
    restorePreference,
  }
}

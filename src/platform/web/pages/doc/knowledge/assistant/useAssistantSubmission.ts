import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { AiBridgePort, AiBridgeState, AiMessageInput } from '@/core/ports/AiBridgePort'
import type { useAssistantSessions } from './useAssistantSessions'
import type { useAssistantModels } from './useAssistantModels'
import type { useAssistantAttachment } from './useAssistantAttachment'
import type { PendingAssistantSubmission } from './PendingAssistantSubmission'

/**
 * 提交当前输入和附件引用，由 Bridge 创建、执行并持久化回答。
 * 确认丢失后的相同请求复用幂等键；切换会话后返回的响应不清空新会话输入。
 */
export function useAssistantSubmission(
  bridge: AiBridgePort,
  state: Readonly<Ref<AiBridgeState>>,
  sessions: ReturnType<typeof useAssistantSessions>,
  models: ReturnType<typeof useAssistantModels>,
  attachment: ReturnType<typeof useAssistantAttachment>,
  followTranscript: () => void,
) {
  const question = ref('')
  const sending = ref(false)
  let pendingSubmission: PendingAssistantSubmission | undefined
  const busy = computed(() => sending.value || sessions.active.value?.status === 'running')
  const canSend = computed(
    () =>
      state.value === 'ready' &&
      !!models.providerId.value &&
      !!models.model.value &&
      !busy.value &&
      !sessions.history.loading.value &&
      !!question.value.trim(),
  )

  function reset() {
    attachment.clear()
    question.value = ''
    sessions.error.value = ''
    attachment.visible.value = false
    followTranscript()
  }

  async function send() {
    if (!canSend.value) {
      return
    }
    const isCurrent = sessions.history.captureSelection()
    const text = question.value.trim()
    const selection = {
      providerId: models.providerId.value,
      model: models.model.value,
      effort: models.effort.value,
    }
    const attachments = attachment.references()
    sending.value = true
    sessions.error.value = ''
    attachment.visible.value = false
    followTranscript()
    try {
      const sessionId = sessions.activeId.value || (await sessions.create(selection))
      if (!sessionId || !isCurrent()) {
        return
      }
      const payload = {
        sessionId,
        text,
        ...selection,
        ...(attachments ? { attachments } : {}),
      }
      const fingerprint = JSON.stringify(payload)
      if (pendingSubmission?.fingerprint !== fingerprint) {
        pendingSubmission = { fingerprint, id: crypto.randomUUID() }
      }
      const input: AiMessageInput = { ...payload, clientRequestId: pendingSubmission.id }
      await bridge.sendMessage(input)
      pendingSubmission = undefined
      if (!isCurrent()) {
        return
      }
      if (question.value.trim() === text) {
        question.value = ''
      }
      attachment.clear()
      models.savePreference()
      await sessions.history.load()
    } catch (cause) {
      if (isCurrent()) {
        sessions.report(cause)
        if (state.value === 'ready') {
          void sessions.history.load()
        }
      }
    } finally {
      sending.value = false
    }
  }

  return { question, sending, busy, canSend, reset, send }
}

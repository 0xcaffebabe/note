import { nextTick, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { AiSessionTurn } from '@/core/ports/AiBridgePort'

/** 保持消息流底部跟随；用户上翻时暂停跟随，历史分页后维持原阅读位置。 */
export function useAssistantScroll(turns: Readonly<Ref<AiSessionTurn[]>>) {
  const element = ref<HTMLElement>()
  let followBottom = true

  function onScroll() {
    const transcript = element.value
    if (transcript) {
      followBottom = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 80
    }
  }

  function scrollToBottom() {
    const transcript = element.value
    if (transcript && followBottom) {
      transcript.scrollTop = transcript.scrollHeight
    }
  }

  function follow() {
    followBottom = true
  }

  function beforePrepend() {
    followBottom = false
    const oldHeight = element.value?.scrollHeight || 0
    const oldTop = element.value?.scrollTop || 0
    return () => {
      const transcript = element.value
      if (transcript) {
        transcript.scrollTop = oldTop + transcript.scrollHeight - oldHeight
      }
    }
  }

  watch(
    () =>
      turns.value
        .map((turn) => `${turn.answer.length}:${turn.toolCalls.length}:${turn.status}`)
        .join('|'),
    () => nextTick(scrollToBottom),
  )

  return { element, onScroll, scrollToBottom, follow, beforePrepend }
}

import { nextTick, onBeforeUnmount, ref } from 'vue'
import type { Ref } from 'vue'
import type {
  AiBridgePort,
  AiBridgeState,
  AiSessionSummary,
  AiSessionTurn,
} from '@/core/ports/AiBridgePort'

/**
 * 展示当前会话的已提交消息投影，支持向前分页和跳跃 revision 后的补读。
 * 每次选择或连接变化都会失效旧请求；逐条 revision 防止慢快照覆盖新推送。
 */
export function useSessionHistory(
  bridge: AiBridgePort,
  state: Readonly<Ref<AiBridgeState>>,
  activeId: Readonly<Ref<string>>,
  mergeSession: (session: AiSessionSummary) => void,
  report: (cause: unknown) => void,
  beforePrepend: () => () => void,
) {
  const turns = ref<AiSessionTurn[]>([])
  const cursor = ref<string>()
  const loading = ref(false)
  const revisions = new Map<string, number>()
  let selectionEpoch = 0
  let disposed = false
  let reloadQueued = false

  /** 捕获当前选择；异步操作在写入 UI 前使用此检查，避免跨会话串写。 */
  function captureSelection() {
    const epoch = selectionEpoch
    return () => !disposed && epoch === selectionEpoch
  }

  function invalidate() {
    selectionEpoch++
    loading.value = false
    reloadQueued = false
  }

  function reset() {
    invalidate()
    turns.value = []
    revisions.clear()
    cursor.value = undefined
  }

  function merge(incoming: AiSessionTurn[], revision: number) {
    for (const turn of incoming) {
      if ((revisions.get(turn.id) ?? -1) > revision) {
        continue
      }
      const index = turns.value.findIndex((item) => item.id === turn.id)
      if (index >= 0) {
        turns.value[index] = turn
      } else {
        turns.value.push(turn)
      }
      revisions.set(turn.id, revision)
    }
    turns.value.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
  }

  async function load(earlier = false) {
    const sessionId = activeId.value
    if (!sessionId || state.value !== 'ready') {
      return
    }
    if (loading.value) {
      if (!earlier) {
        reloadQueued = true
      }
      return
    }
    const isCurrent = captureSelection()
    loading.value = true
    const restoreViewport = earlier ? beforePrepend() : undefined
    try {
      const page = await bridge.getSession(sessionId, earlier ? cursor.value : undefined)
      if (!isCurrent()) {
        return
      }
      mergeSession(page.session)
      merge(page.turns, page.session.revision)
      cursor.value = page.nextCursor
      if (restoreViewport) {
        await nextTick(restoreViewport)
      }
    } catch (cause) {
      if (isCurrent()) {
        report(cause)
      }
    } finally {
      if (isCurrent()) {
        loading.value = false
        if (reloadQueued) {
          reloadQueued = false
          void load()
        }
      }
    }
  }

  onBeforeUnmount(() => {
    disposed = true
    invalidate()
  })

  return { turns, cursor, loading, captureSelection, invalidate, reset, merge, load }
}

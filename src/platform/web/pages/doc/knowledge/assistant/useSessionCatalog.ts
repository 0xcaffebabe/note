import { onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { AiBridgePort, AiBridgeState, AiSessionSummary } from '@/core/ports/AiBridgePort'

/**
 * 维护会话目录分页，合并推送中较新的 revision，防止列表请求覆盖最新状态。
 * 同时只执行一个目录请求；断线前的响应在重连后不再生效。
 */
export function useSessionCatalog(
  bridge: AiBridgePort,
  state: Readonly<Ref<AiBridgeState>>,
  activeId: Readonly<Ref<string>>,
  report: (cause: unknown) => void,
  afterRefresh: () => Promise<void>,
) {
  const sessions = ref<AiSessionSummary[]>([])
  const cursor = ref<string>()
  const loading = ref(false)
  let connectionEpoch = 0
  let disposed = false
  let refreshQueued = false

  function merge(session: AiSessionSummary) {
    const index = sessions.value.findIndex((item) => item.id === session.id)
    if (index < 0) {
      sessions.value.push(session)
    } else if (sessions.value[index].revision <= session.revision) {
      sessions.value[index] = session
    }
    sessions.value.sort((a, b) => b.updatedAt - a.updatedAt || b.id.localeCompare(a.id))
  }

  function replace(incoming: AiSessionSummary[]) {
    const current = sessions.value.find((session) => session.id === activeId.value)
    const known = new Map(sessions.value.map((session) => [session.id, session]))
    sessions.value = incoming.map((session) => {
      const existing = known.get(session.id)
      return existing && existing.revision > session.revision ? existing : session
    })
    if (current && !sessions.value.some((session) => session.id === current.id)) {
      sessions.value.push(current)
    }
  }

  async function refresh(append = false) {
    if (state.value !== 'ready' || loading.value) {
      if (!append) {
        refreshQueued = true
      }
      return
    }
    const epoch = connectionEpoch
    loading.value = true
    try {
      const page = await bridge.listSessions(append ? cursor.value : undefined)
      if (disposed || epoch !== connectionEpoch) {
        return
      }
      if (append) {
        page.sessions.forEach(merge)
      } else {
        replace(page.sessions)
      }
      cursor.value = page.nextCursor
      await afterRefresh()
    } catch (cause) {
      if (!disposed && epoch === connectionEpoch) {
        report(cause)
      }
    } finally {
      loading.value = false
      if (refreshQueued && !disposed && state.value === 'ready') {
        refreshQueued = false
        void refresh()
      }
    }
  }

  function remove(id: string) {
    sessions.value = sessions.value.filter((session) => session.id !== id)
  }

  watch(state, () => {
    connectionEpoch++
  })
  onBeforeUnmount(() => {
    disposed = true
    connectionEpoch++
  })

  return { sessions, cursor, loading, merge, refresh, remove }
}

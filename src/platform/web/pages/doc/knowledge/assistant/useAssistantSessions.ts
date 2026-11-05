import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type {
  AiBridgeEvent,
  AiBridgePort,
  AiBridgeState,
  AiModelSelection,
} from '@/core/ports/AiBridgePort'
import type { AssistantSessionHooks } from './AssistantSessionHooks'
import { useSessionCatalog } from './useSessionCatalog'
import { useSessionHistory } from './useSessionHistory'

/**
 * 协调会话选择、订阅和显式停止，不执行 Agent，也不在浏览器持久化聊天。
 * 卸载、换会话和断线只解除订阅；重连读取快照，绝不自动重发问题。
 */
export function useAssistantSessions(
  bridge: AiBridgePort,
  state: Readonly<Ref<AiBridgeState>>,
  hooks: AssistantSessionHooks,
) {
  const activeId = ref('')
  const error = ref('')
  let draftSelected = false
  let subscribedId = ''
  let disposed = false

  function report(cause: unknown) {
    error.value = cause instanceof Error ? cause.message : '读取聊天失败，请重试'
  }

  const catalog = useSessionCatalog(bridge, state, activeId, report, async () => {
    if (!activeId.value && !draftSelected && catalog.sessions.value.length) {
      await select(catalog.sessions.value[0].id)
    }
  })
  const history = useSessionHistory(
    bridge,
    state,
    activeId,
    catalog.merge,
    report,
    hooks.beforePrepend,
  )
  const active = computed(() =>
    catalog.sessions.value.find((session) => session.id === activeId.value),
  )

  async function observe() {
    const id = activeId.value
    if (!id || state.value !== 'ready') {
      return
    }
    const isCurrent = history.captureSelection()
    try {
      subscribedId = id
      await bridge.subscribeSession(id)
      if (isCurrent()) {
        await history.load()
      }
    } catch (cause) {
      if (isCurrent()) {
        report(cause)
      }
    }
  }

  function detach() {
    const id = subscribedId
    subscribedId = ''
    // 订阅解除失败不影响后台回答，也不应在窗口关闭后显示错误。
    if (id) {
      void bridge.unsubscribeSession(id).catch(() => {})
    }
  }

  async function select(id: string) {
    history.reset()
    detach()
    activeId.value = id
    draftSelected = false
    hooks.selected(active.value)
    await observe()
    if (!disposed && id === activeId.value) {
      hooks.ready(id)
    }
  }

  function newChat() {
    history.reset()
    detach()
    activeId.value = ''
    draftSelected = true
    hooks.selected()
  }

  async function create(selection: AiModelSelection) {
    const isCurrent = history.captureSelection()
    const session = await bridge.createSession(selection)
    if (!isCurrent()) {
      return undefined
    }
    catalog.merge(session)
    activeId.value = session.id
    draftSelected = false
    await observe()
    return isCurrent() ? session.id : undefined
  }

  async function archive(id: string) {
    try {
      await bridge.archiveSession(id)
      if (disposed) {
        return
      }
      if (id === activeId.value) {
        newChat()
      }
      catalog.remove(id)
    } catch (cause) {
      if (!disposed) {
        report(cause)
      }
    }
  }

  async function cancel() {
    const id = activeId.value
    if (!id || state.value !== 'ready') {
      return
    }
    try {
      await bridge.cancelRun(id)
      if (id === activeId.value) {
        await history.load()
      }
    } catch (cause) {
      if (!disposed) {
        report(cause)
      }
    }
  }

  function onEvent(event: AiBridgeEvent) {
    if (event.type === 'sessions.changed') {
      void catalog.refresh()
      return
    }
    if (event.type !== 'session.updated') {
      return
    }
    const previousRevision =
      catalog.sessions.value.find((session) => session.id === event.sessionId)?.revision ?? -1
    if (event.revision < previousRevision) {
      return
    }
    catalog.merge(event.session)
    if (event.sessionId !== activeId.value) {
      return
    }
    if (event.turn) {
      history.merge([event.turn], event.revision)
    }
    // 推送节流可能跨过完整轮次；补读快照以发现期间新增的消息。
    if (previousRevision >= 0 && event.revision > previousRevision + 1) {
      void history.load()
    }
  }

  const unsubscribe = bridge.subscribe(onEvent)
  watch(
    state,
    (value) => {
      history.invalidate()
      subscribedId = ''
      if (value === 'ready') {
        error.value = ''
        void catalog.refresh()
        if (activeId.value) {
          void observe()
        }
      }
    },
    { immediate: true },
  )
  onBeforeUnmount(() => {
    disposed = true
    detach()
    unsubscribe()
  })

  return {
    activeId,
    active,
    error,
    catalog,
    history,
    report,
    select,
    newChat,
    create,
    archive,
    cancel,
  }
}

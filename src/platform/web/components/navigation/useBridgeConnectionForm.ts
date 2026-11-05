import { ref, watch, type Ref } from 'vue'
import type { AiBridgePort, AiBridgeSnapshot } from '@/core/ports/AiBridgePort'

/**
 * 配对表单的局部输入和异步反馈；连接本身属于应用级 AiBridgePort。
 * 断开或忘记时使旧操作失效，防止迟到的 Promise 覆盖当前表单；关闭弹窗不释放连接。
 */
export function useBridgeConnectionForm(
  visible: Readonly<Ref<boolean>>,
  bridge: AiBridgePort,
  snapshot: Readonly<Ref<AiBridgeSnapshot>>,
) {
  const code = ref('')
  const port = ref(snapshot.value.port)
  const error = ref('')
  let operation = 0

  async function connect(action: () => Promise<unknown>): Promise<void> {
    const current = ++operation
    error.value = ''
    try {
      await action()
      if (current === operation) {
        code.value = ''
      }
    } catch (cause) {
      if (current === operation) {
        error.value = cause instanceof Error ? cause.message : '连接失败，请重试'
      }
    }
  }

  function pair(): Promise<void> {
    return connect(() => bridge.pair(code.value, port.value))
  }

  function reconnect(): Promise<void> {
    return connect(() => bridge.reconnect())
  }

  function disconnect(): void {
    operation++
    error.value = ''
    bridge.disconnect()
  }

  function forget(): void {
    operation++
    error.value = ''
    code.value = ''
    bridge.forget()
  }

  watch(visible, (shown) => {
    if (shown) {
      error.value = ''
      port.value = snapshot.value.port
    }
  })

  return { code, port, error, pair, reconnect, disconnect, forget }
}

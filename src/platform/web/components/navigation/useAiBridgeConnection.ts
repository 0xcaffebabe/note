import { computed, onBeforeUnmount, shallowRef } from 'vue'
import { useServices } from '@/platform/web/app/useServices'

/**
 * 将应用级桥接快照投影为组件响应式状态。
 * 组件只拥有自己的订阅，卸载时退订，不主动断开应用级共享连接。
 */
export function useAiBridgeConnection() {
  const bridge = useServices().aiBridge
  const snapshot = shallowRef(bridge.snapshot())
  const unsubscribe = bridge.subscribe((event) => {
    if (event.type === 'state' || event.type === 'providers') {
      snapshot.value = bridge.snapshot()
    }
  })
  onBeforeUnmount(unsubscribe)
  const state = computed(() => snapshot.value.state)
  const providers = computed(() => snapshot.value.providers)
  const statusText = computed(
    () =>
      ({
        disconnected: '未连接 Note Bridge',
        connecting: '正在连接本机…',
        ready: '已连接 Note Bridge',
      })[state.value],
  )
  return { bridge, snapshot, state, providers, statusText }
}

import { computed, onBeforeUnmount, shallowRef } from 'vue'
import { useServices } from '@/platform/web/app/useServices'

/** Component subscriptions are local; the connection belongs to the application. */
export function useAiBridgeConnection() {
  const bridge = useServices().aiBridge
  const snapshot = shallowRef(bridge.snapshot())
  const unsubscribe = bridge.subscribe(event => {
    if (event.type === 'state' || event.type === 'providers') snapshot.value = bridge.snapshot()
  })
  onBeforeUnmount(unsubscribe)
  const state = computed(() => snapshot.value.state)
  const providers = computed(() => snapshot.value.providers)
  const statusText = computed(() => ({
    disconnected: '未连接 Note Bridge',
    connecting: '正在连接本机…',
    ready: '已连接 Note Bridge',
  })[state.value])
  return { bridge, snapshot, state, providers, statusText }
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { AiBridgeEvent, AiBridgeSnapshot } from '@/core/ports/AiBridgePort'

const bridge = vi.hoisted(() => ({ snapshot: vi.fn(), subscribe: vi.fn(), pair: vi.fn(), reconnect: vi.fn(), disconnect: vi.fn(), forget: vi.fn() }))
vi.mock('@/platform/web/app/useServices', () => ({ useServices: () => ({ aiBridge: bridge }) }))
import NoteBridgeConnection from '@/platform/web/components/navigation/NoteBridgeConnection.vue'

let snapshot: AiBridgeSnapshot
let emit: (event: AiBridgeEvent) => void
const wrappers: ReturnType<typeof mount>[] = []
function update(next: Partial<AiBridgeSnapshot>) {
  snapshot = { ...snapshot, ...next }
  emit({ type: 'state', state: snapshot.state, message: snapshot.message })
}
function setup() {
  const wrapper = mount(NoteBridgeConnection, { props: { modelValue: true }, global: { stubs: {
    'el-dialog': { props: ['modelValue'], template: '<div v-if="modelValue"><slot /></div>' },
  } } })
  wrappers.push(wrapper)
  return wrapper
}
beforeEach(() => {
  vi.clearAllMocks()
  snapshot = { state: 'disconnected', providers: [], remembered: false, port: 19661 }
  bridge.snapshot.mockImplementation(() => snapshot)
  bridge.subscribe.mockImplementation(listener => { emit = listener; return vi.fn() })
})
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))

describe('NoteBridgeConnection', () => {
  it('配对失败可重试，成功后切换到已记住的连接管理，关闭不释放连接', async () => {
    bridge.pair.mockRejectedValueOnce(new Error('配对码已失效'))
    bridge.pair.mockImplementationOnce(async () => {
      update({ state: 'ready', remembered: true, port: 20001 })
      return []
    })
    const wrapper = setup()
    await wrapper.get('input[aria-label="配对码"]').setValue('123456')
    await wrapper.get('input[aria-label="本地端口"]').setValue(20001)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('配对码已失效')
    await wrapper.get('input[aria-label="配对码"]').setValue('654321')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(bridge.pair).toHaveBeenLastCalledWith('654321', 20001)
    expect(wrapper.text()).toContain('已记住此浏览器的连接凭证')
    expect(wrapper.text()).toContain('本地端口：20001')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    await wrapper.setProps({ modelValue: false })
    expect(bridge.disconnect).not.toHaveBeenCalled()
  })

  it('重连过程中忘记连接后，旧请求的错误不会覆盖新的配对表单', async () => {
    snapshot = { ...snapshot, remembered: true }
    let reject: (error: Error) => void = () => {}
    bridge.reconnect.mockImplementation(() => {
      update({ state: 'connecting' })
      return new Promise((_, rejectPromise) => { reject = rejectPromise })
    })
    bridge.forget.mockImplementation(() => update({ state: 'disconnected', remembered: false }))
    const wrapper = setup()
    await wrapper.findAll('button').find(button => button.text() === '重新连接')!.trigger('click')
    await wrapper.findAll('button').find(button => button.text() === '忘记连接')!.trigger('click')
    reject(new Error('旧重连已取消'))
    await flushPromises()
    expect(bridge.forget).toHaveBeenCalledOnce()
    expect(wrapper.get('input[aria-label="配对码"]').element.value).toBe('')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})

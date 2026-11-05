import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const calls = vi.hoisted(() => ({ show: vi.fn(), unmounted: vi.fn() }))
vi.mock('@/platform/web/components/navigation/SiteNavigation.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/platform/web/components/search/CommandPalette.vue', () => ({ default: { template: '<div />', methods: { show() {} } } }))
vi.mock('@/platform/web/pages/doc/LinkPreviewLayer.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/platform/web/pages/doc/knowledge/LLM.vue', async () => {
  const { defineComponent } = await import('vue')
  return { __esModule: true, default: defineComponent({
    name: 'AssistantStub', props: { doc: String }, data: () => ({ visible: false }),
    methods: { show() { this.visible = true; calls.show() } },
    unmounted: () => calls.unmounted(),
    template: '<section v-if="visible" role="dialog" :data-doc="doc">全库问答</section>',
  }) }
})
vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('@/platform/web/composables/useBreakpoint', async () => ({ isTouch: (await import('vue')).ref(false) }))
import { isTouch as touch } from '@/platform/web/composables/useBreakpoint'
import App from '@/platform/web/App.vue'
import EventBus from '@/platform/web/components/EventBus'

const route = reactive({ params: {} as Record<string, string>, meta: { hasBottomBar: false } })
const touchState = touch as { value: boolean }
const wrappers: ReturnType<typeof mount>[] = []
function setup() {
  const wrapper = mount(App, { global: {
    mocks: { $route: route, $store: { commit: vi.fn() }, $isMobile: () => false },
    stubs: {
      'el-container': { template: '<div><slot /></div>' },
      'el-main': { template: '<main><slot /></main>' },
      'router-view': defineComponent({ setup: () => ({ Component: { template: '<div>页面</div>' } }), template: '<slot :Component="Component" />' }),
    },
  } })
  wrappers.push(wrapper)
  return wrapper
}
function shortcut(target: EventTarget = document, extras: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: 'i', code: 'KeyI', altKey: true, bubbles: true, cancelable: true, ...extras })
  target.dispatchEvent(event)
  return event
}
beforeEach(() => { vi.clearAllMocks(); route.params = {}; touchState.value = false; localStorage.clear() })
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))

describe('全局知识助手入口', () => {
  it('首页首次打开后复用同一实例，跨路由只更新可选文档并清理入口监听', async () => {
    const wrapper = setup()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    EventBus.emit('show-knowledge-assistant')
    await flushPromises()
    expect(wrapper.get('[role="dialog"]').attributes('data-doc')).toBeUndefined()
    expect(calls.show).toHaveBeenCalledTimes(1)
    route.params = { docPath: '编程语言/Java.html' }
    await flushPromises()
    expect(wrapper.get('[role="dialog"]').attributes('data-doc')).toBe('编程语言-Java')
    route.params = {}
    await flushPromises()
    expect(wrapper.get('[role="dialog"]').attributes('data-doc')).toBeUndefined()
    expect(calls.show).toHaveBeenCalledTimes(1)
    expect(calls.unmounted).not.toHaveBeenCalled()
    wrapper.unmount(); wrappers.splice(wrappers.indexOf(wrapper), 1)
    EventBus.emit('show-knowledge-assistant')
    shortcut()
    await flushPromises()
    expect(calls.show).toHaveBeenCalledTimes(1)
    expect(calls.unmounted).toHaveBeenCalledTimes(1)
  })

  it('Alt+I 支持非文档页且尊重输入、修饰键、重复按键、触屏及已处理事件', async () => {
    setup()
    for (const tag of ['input', 'textarea', 'select']) {
      const input = document.createElement(tag)
      document.body.append(input)
      expect(shortcut(input).defaultPrevented).toBe(false)
      input.remove()
    }
    const editable = document.createElement('div')
    editable.contentEditable = 'true'
    editable.setAttribute('contenteditable', 'true')
    const child = document.createElement('span')
    editable.append(child); document.body.append(editable)
    shortcut(child); editable.remove()
    for (const extras of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { repeat: true }]) shortcut(document, extras)
    touchState.value = true; shortcut(); touchState.value = false
    const processed = new KeyboardEvent('keydown', { key: 'i', altKey: true, cancelable: true })
    processed.preventDefault(); document.dispatchEvent(processed)
    await flushPromises()
    expect(calls.show).not.toHaveBeenCalled()
    expect(shortcut(document, { key: 'Process' }).defaultPrevented).toBe(true)
    await flushPromises()
    expect(calls.show).toHaveBeenCalledTimes(1)
  })
})

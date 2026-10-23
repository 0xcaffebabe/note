import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

const { render, createSvgPanZoom } = vi.hoisted(() => ({
  render: vi.fn<(...args: string[]) => Promise<{ svg: string }>>(),
  createSvgPanZoom: vi.fn(() => ({
    zoomIn: vi.fn(), zoomOut: vi.fn(), reset: vi.fn(), destroy: vi.fn(),
  })),
}))
vi.mock('@/platform/web/util/MermaidUtils', () => ({ default: { render } }))
vi.mock('@/platform/web/pages/doc/mermaid-shower/SvgPanZoom', () => ({ createSvgPanZoom }))

import MermaidShower from '@/platform/web/pages/doc/mermaid-shower/MermaidShower.vue'

// el-dialog mounts its slot only when opened, which matters for the first nextTick in show().
const DialogStub = defineComponent({
  props: { modelValue: Boolean },
  emits: ['update:modelValue', 'close', 'closed'],
  setup: (props, { slots }) => () => props.modelValue ? h('section', slots.default?.()) : null,
})
const ButtonStub = defineComponent({
  props: { disabled: Boolean },
  setup: (props, { slots }) => () => h('button', { disabled: props.disabled }, slots.default?.()),
})
const wrappers = new Set<VueWrapper>()

function createViewer() {
  const store = reactive({ state: { isDarkMode: false } })
  const wrapper = mount(MermaidShower, {
    global: { mocks: { $store: store }, stubs: { 'el-dialog': DialogStub, 'el-button': ButtonStub } },
  })
  wrappers.add(wrapper)
  return { wrapper, store }
}

function unmount(wrapper: VueWrapper) {
  wrapper.unmount()
  wrappers.delete(wrapper)
}

function deferredRender() {
  let resolve!: (value: { svg: string }) => void
  let reject!: (error: Error) => void
  const promise = new Promise<{ svg: string }>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function svg(id: string) {
  return { svg: `<svg id="${id}" viewBox="0 0 100 100"><text>${id}</text></svg>` }
}

beforeEach(() => {
  render.mockReset()
  render.mockResolvedValue(svg('diagram'))
  createSvgPanZoom.mockClear()
})

afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount()
  wrappers.clear()
})

describe('Mermaid viewer lifecycle', () => {
  it.each(['success', 'failure'] as const)('ignores an older render %s after a newer diagram finishes', async outcome => {
    const oldRender = deferredRender()
    const newRender = deferredRender()
    render.mockReturnValueOnce(oldRender.promise).mockReturnValueOnce(newRender.promise)
    const { wrapper } = createViewer()
    const first = wrapper.vm.show('first diagram')
    await nextTick()
    const second = wrapper.vm.show('second diagram')
    await nextTick()

    newRender.resolve(svg('current-diagram'))
    await second
    const currentSvg = wrapper.get('svg').element
    if (outcome === 'success') oldRender.resolve(svg('obsolete-diagram'))
    else oldRender.reject(new Error('obsolete error'))
    await first

    expect(wrapper.get('svg').element).toBe(currentSvg)
    expect(wrapper.get('svg').attributes('id')).toBe('current-diagram')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(createSvgPanZoom).toHaveBeenCalledExactlyOnceWith(currentSvg)
  })

  it.each(['close', 'unmount'] as const)('ignores a render that resolves after %s', async action => {
    const pending = deferredRender()
    render.mockReturnValueOnce(pending.promise)
    const { wrapper } = createViewer()
    const showing = wrapper.vm.show('pending diagram')
    await nextTick()
    const container = wrapper.get('.mermaid-viewer-canvas').element

    if (action === 'close') {
      const dialog = wrapper.getComponent(DialogStub)
      dialog.vm.$emit('update:modelValue', false)
      dialog.vm.$emit('close')
      dialog.vm.$emit('closed')
      await nextTick()
      expect(wrapper.emitted('closed')).toHaveLength(1)
    } else {
      unmount(wrapper)
    }
    pending.resolve(svg('late-diagram'))
    await expect(showing).resolves.toBeUndefined()

    expect(container.querySelector('svg')).toBeNull()
    expect(createSvgPanZoom).not.toHaveBeenCalled()
  })

  it('destroys each controller when replacing its diagram, changing theme, and closing', async () => {
    const { wrapper, store } = createViewer()
    await wrapper.vm.show('first diagram')
    const firstController = createSvgPanZoom.mock.results[0].value

    await wrapper.vm.show('second diagram')
    const secondController = createSvgPanZoom.mock.results[1].value
    expect(firstController.destroy).toHaveBeenCalledTimes(1)
    expect(secondController.destroy).not.toHaveBeenCalled()

    store.state.isDarkMode = true
    await flushPromises()
    expect(render.mock.calls.map(call => call[1])).toEqual(['first diagram', 'second diagram', 'second diagram'])
    expect(secondController.destroy).toHaveBeenCalledTimes(1)
    const thirdController = createSvgPanZoom.mock.results[2].value

    const dialog = wrapper.getComponent(DialogStub)
    dialog.vm.$emit('update:modelValue', false)
    dialog.vm.$emit('close')
    await nextTick()
    expect(thirdController.destroy).toHaveBeenCalledTimes(1)
    unmount(wrapper)
    expect(thirdController.destroy).toHaveBeenCalledTimes(1)
  })

  it('shows rendering failures and can open a valid diagram afterwards', async () => {
    render.mockRejectedValueOnce(new Error('Invalid Mermaid syntax'))
    const { wrapper } = createViewer()
    await wrapper.vm.show('invalid diagram')
    expect(wrapper.get('[role="alert"]').text()).toContain('Invalid Mermaid syntax')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(createSvgPanZoom).not.toHaveBeenCalled()

    await wrapper.vm.show('valid diagram')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('svg').attributes('id')).toBe('diagram')
    expect(createSvgPanZoom).toHaveBeenCalledTimes(1)
  })

  it('does not render or reject when unmounted before the dialog slot is mounted', async () => {
    const { wrapper } = createViewer()
    const showing = wrapper.vm.show('diagram')
    unmount(wrapper)
    await expect(showing).resolves.toBeUndefined()
    expect(render).not.toHaveBeenCalled()
    expect(createSvgPanZoom).not.toHaveBeenCalled()
  })

  it('connects the accessible zoom controls to the active diagram', async () => {
    const { wrapper } = createViewer()
    await wrapper.vm.show('diagram')
    const controller = createSvgPanZoom.mock.results[0].value
    await wrapper.get('button[aria-label="放大图表"]').trigger('click')
    await wrapper.get('button[aria-label="缩小图表"]').trigger('click')
    await wrapper.get('button[aria-label="重置图表"]').trigger('click')
    expect(controller.zoomIn).toHaveBeenCalledTimes(1)
    expect(controller.zoomOut).toHaveBeenCalledTimes(1)
    expect(controller.reset).toHaveBeenCalledTimes(1)
  })
})

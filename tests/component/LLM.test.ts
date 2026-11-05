import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
vi.mock('@/platform/web/pages/doc/knowledge/DocumentQA.vue', () => ({ default: defineComponent({ template: '<div>聊天主界面</div>' }) }))
import LLM from '@/platform/web/pages/doc/knowledge/LLM.vue'
const DialogStub = defineComponent({ props: { modelValue: Boolean, title: String, closeOnClickModal: Boolean, destroyOnClose: Boolean }, emits: ['close', 'update:modelValue'], template: '<div v-if="modelValue" role="dialog" :aria-label="title"><slot /></div>' })

describe('知识助手弹窗', () => {
  it('按需显示聊天弹窗，彻底移除模板复制与抽屉', async () => {
    const wrapper = mount(LLM, { props: { doc: 'current' }, global: { stubs: { 'el-dialog': DialogStub } } })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    ;(wrapper.vm as unknown as { show(): void }).show()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[role="dialog"]').attributes('aria-label')).toBe('知识助手')
    expect(wrapper.text()).toContain('聊天主界面')
    expect(wrapper.text()).not.toContain('模板')
    expect(wrapper.find('el-drawer').exists()).toBe(false)
    expect(wrapper.getComponent(DialogStub).props('closeOnClickModal')).toBe(false)
    expect(wrapper.getComponent(DialogStub).props('destroyOnClose')).toBe(true)
    wrapper.unmount()
  })
})

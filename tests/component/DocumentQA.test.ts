import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { AiBridgeEvent, AiContextDocument } from '@/core/ports/AiBridgePort'

const mocks = vi.hoisted(() => ({ pair: vi.fn(), start: vi.fn(), cancel: vi.fn(), disconnect: vi.fn(), subscribe: vi.fn(), load: vi.fn(), build: vi.fn() }))
vi.mock('@/platform/web/app/useServices', () => ({ useServices: () => ({ createAiBridge: () => mocks, aiContextService: mocks }) }))
import DocumentQA from '@/platform/web/pages/doc/knowledge/DocumentQA.vue'

const doc: AiContextDocument = { docId: 'current', title: '当前文章', url: '/current.html', contentHash: 'test', metadata: {},
  headings: [{ id: 'real-heading', title: '章节' }], relatedLinks: [{ url: '/related.html', title: '/关联.md' }],
  sources: [{ sourceId: 'D1S1', headingId: 'real-heading', title: '章节', text: '正文' }], truncated: false }
let emit: (event: AiBridgeEvent) => void
const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.clearAllMocks()
  mocks.subscribe.mockImplementation(listener => { emit = listener; return vi.fn() })
  mocks.load.mockResolvedValue(doc)
  mocks.build.mockResolvedValue({ documents: [doc] })
  mocks.start.mockReturnValue('request-1')
  mocks.pair.mockImplementation(async () => {
    emit({ type: 'state', state: 'ready' })
    return [{ id: 'provider', name: '测试模型', protocol: 'responses', model: 'test' }]
  })
})
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))
async function setup() {
  const wrapper = mount(DocumentQA, { props: { doc: 'current' } })
  wrappers.push(wrapper)
  await flushPromises()
  await wrapper.get('input[aria-label="配对码"]').setValue('123456')
  await wrapper.findAll('form')[0].trigger('submit')
  await flushPromises()
  return wrapper
}
async function send(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('textarea').setValue('解释这段内容')
  await wrapper.findAll('form').at(-1)!.trigger('submit')
  await flushPromises()
}

describe('DocumentQA', () => {
  it('显式发送当前文档，显示安全纯文本回答和可核对来源', async () => {
    const wrapper = await setup()
    await send(wrapper)
    expect(mocks.build).toHaveBeenCalledWith([{ docId: 'current', headingIds: [] }])
    emit({ type: 'delta', requestId: 'request-1', delta: '<img src=x onerror=alert(1)> 结论 [D1S1] [D9S9]' })
    emit({ type: 'done', requestId: 'request-1', cancelled: false })
    await flushPromises()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>')
    expect(wrapper.findAll('nav a')).toHaveLength(1)
    expect(wrapper.get('nav a').attributes('href')).toBe('/current.html?headingId=real-heading')
  })

  it('切换文档时取消生成，忽略旧流；关闭会释放连接', async () => {
    const wrapper = await setup()
    await send(wrapper)
    await wrapper.setProps({ doc: 'next' })
    await flushPromises()
    emit({ type: 'delta', requestId: 'request-1', delta: '旧文档回答' })
    await flushPromises()
    expect(mocks.cancel).toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('旧文档回答')
    expect(wrapper.get('textarea').element.value).toBe('')
    wrapper.unmount()
    wrappers.pop()
    expect(mocks.disconnect).toHaveBeenCalledOnce()
  })

  it('文档切换使未完成的上下文读取失效，不发送旧问题', async () => {
    let finish: (value: { documents: AiContextDocument[] }) => void = () => {}
    mocks.build.mockReturnValue(new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    await send(wrapper)
    await wrapper.setProps({ doc: 'next' })
    finish({ documents: [doc] })
    await flushPromises()
    expect(mocks.start).not.toHaveBeenCalled()
  })

  it('断线显示反馈，不自动重发，用户显式勾选才增加关联文档', async () => {
    const wrapper = await setup()
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await send(wrapper)
    expect(mocks.build).toHaveBeenCalledWith([{ docId: 'current', headingIds: [] }, { docId: 'related' }])
    emit({ type: 'error', requestId: 'request-1', message: '连接断开' })
    emit({ type: 'state', state: 'disconnected', message: '请重新配对' })
    await flushPromises()
    expect(wrapper.text()).toContain('请重新配对')
    expect(mocks.start).toHaveBeenCalledOnce()
    expect(mocks.pair).toHaveBeenCalledOnce()
  })

  it('准备上下文期间断线并配对新服务商，旧准备结果失效，必须手动重新发送', async () => {
    let finish: (value: { documents: AiContextDocument[] }) => void = () => {}
    mocks.build.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    await send(wrapper)
    emit({ type: 'state', state: 'disconnected', message: '连接断开' })
    await flushPromises()
    mocks.pair.mockImplementationOnce(async () => {
      emit({ type: 'state', state: 'ready' })
      return [{ id: 'new-provider', name: '新服务商', protocol: 'responses', model: 'new-model' }]
    })
    await wrapper.get('input[aria-label="配对码"]').setValue('654321')
    await wrapper.findAll('form')[0].trigger('submit')
    await flushPromises()
    finish({ documents: [doc] })
    await flushPromises()
    expect(mocks.start).not.toHaveBeenCalled()
    expect(wrapper.get('textarea').element.value).toBe('解释这段内容')
    await wrapper.findAll('form').at(-1)!.trigger('submit')
    await flushPromises()
    expect(mocks.start).toHaveBeenCalledOnce()
    expect(mocks.start.mock.calls[0][0].providerId).toBe('new-provider')
  })

  it('历史回答与显示长度边界不会劈开 emoji，超长输出仍会停止', async () => {
    const wrapper = await setup()
    await send(wrapper)
    emit({ type: 'delta', requestId: 'request-1', delta: 'a'.repeat(3999) + '😀' })
    emit({ type: 'done', requestId: 'request-1', cancelled: false })
    await flushPromises()
    await send(wrapper)
    const input = mocks.start.mock.calls[1][0]
    expect(input.messages[1].content).toBe('a'.repeat(3999))
    const cancelledBefore = mocks.cancel.mock.calls.length
    emit({ type: 'delta', requestId: 'request-1', delta: 'b'.repeat(99999) + '😀' })
    await flushPromises()
    const answer = wrapper.findAll('.qa-text').at(-1)!.text()
    expect(answer).toHaveLength(99999)
    expect(answer.isWellFormed()).toBe(true)
    expect(wrapper.findAll('button').some(button => button.text() === '停止生成')).toBe(false)
    expect(mocks.cancel).toHaveBeenCalledTimes(cancelledBefore + 1)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { AiBridgeEvent, AiBridgeSnapshot, AiContextDocument } from '@/core/ports/AiBridgePort'

const mocks = vi.hoisted(() => ({ snapshot: vi.fn(), pair: vi.fn(), start: vi.fn(), cancel: vi.fn(), disconnect: vi.fn(), subscribe: vi.fn(), load: vi.fn(), build: vi.fn() }))
vi.mock('@/platform/web/app/useServices', () => ({ useServices: () => ({ aiBridge: mocks, aiContextService: mocks }) }))
import DocumentQA from '@/platform/web/pages/doc/knowledge/DocumentQA.vue'
import EventBus from '@/platform/web/components/EventBus'

const doc: AiContextDocument = { docId: 'current', title: '当前文章', url: '/current.html', contentHash: 'test', metadata: {},
  headings: [{ id: 'real-heading', title: '章节' }], relatedLinks: [{ url: '/related.html', title: '/关联.md' }],
  sources: [{ sourceId: 'D1S1', headingId: 'real-heading', title: '章节', text: '正文' }], truncated: false }
const listeners = new Set<(event: AiBridgeEvent) => void>()
let snapshot: AiBridgeSnapshot
function emit(event: AiBridgeEvent) {
  if (event.type === 'state') snapshot = { ...snapshot, state: event.state, message: event.message }
  listeners.forEach(listener => listener(event))
}
const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.clearAllMocks()
  listeners.clear()
  snapshot = { state: 'ready', providers: [{ id: 'provider', name: '测试模型', protocol: 'responses', model: 'test' }], remembered: true, port: 19661 }
  mocks.snapshot.mockImplementation(() => snapshot)
  mocks.subscribe.mockImplementation(listener => { listeners.add(listener); return () => listeners.delete(listener) })
  mocks.load.mockResolvedValue(doc)
  mocks.build.mockResolvedValue({ documents: [doc] })
  mocks.start.mockReturnValue('request-1')
})
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))
async function setup() {
  const wrapper = mount(DocumentQA, { props: { doc: 'current' } })
  wrappers.push(wrapper)
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

  it('切换文档时仅取消本面板生成，忽略旧流；关闭保留共享连接', async () => {
    const wrapper = await setup()
    await send(wrapper)
    await wrapper.setProps({ doc: 'next' })
    await flushPromises()
    emit({ type: 'delta', requestId: 'request-1', delta: '旧文档回答' })
    await flushPromises()
    expect(mocks.cancel).toHaveBeenCalledWith('request-1')
    expect(wrapper.text()).not.toContain('旧文档回答')
    expect(wrapper.get('textarea').element.value).toBe('')
    wrapper.unmount()
    wrappers.pop()
    expect(mocks.disconnect).not.toHaveBeenCalled()
    expect(mocks.cancel).toHaveBeenCalledOnce()
    expect(listeners.size).toBe(0)
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
    emit({ type: 'state', state: 'disconnected', message: '正在尝试恢复连接' })
    await flushPromises()
    expect(wrapper.text()).toContain('正在尝试恢复连接')
    expect(mocks.start).toHaveBeenCalledOnce()
    expect(mocks.pair).not.toHaveBeenCalled()
  })

  it('准备上下文期间断线并恢复新服务商，旧准备结果失效，必须手动重新发送', async () => {
    let finish: (value: { documents: AiContextDocument[] }) => void = () => {}
    mocks.build.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    await send(wrapper)
    emit({ type: 'state', state: 'disconnected', message: '连接断开' })
    await flushPromises()
    snapshot = { ...snapshot, providers: [{ id: 'new-provider', name: '新服务商', protocol: 'responses', model: 'new-model' }] }
    emit({ type: 'state', state: 'ready' })
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

  it('未连接时引导打开导航连接设置，空闲关闭不取消其他面板的请求', async () => {
    snapshot = { ...snapshot, state: 'disconnected', providers: [], remembered: false }
    const open = vi.fn()
    EventBus.on('show-note-bridge', open)
    const wrapper = await setup()
    expect(wrapper.find('input[aria-label="配对码"]').exists()).toBe(false)
    await wrapper.findAll('button').find(button => button.text() === '打开 Note Bridge 连接设置')!.trigger('click')
    expect(open).toHaveBeenCalledOnce()
    EventBus.off('show-note-bridge', open)
    wrapper.unmount()
    wrappers.pop()
    expect(mocks.cancel).not.toHaveBeenCalled()
    expect(mocks.disconnect).not.toHaveBeenCalled()
  })

  it('关闭有活动请求的面板只取消该请求', async () => {
    const wrapper = await setup()
    await send(wrapper)
    wrapper.unmount()
    wrappers.pop()
    expect(mocks.cancel).toHaveBeenCalledExactlyOnceWith('request-1')
    expect(mocks.disconnect).not.toHaveBeenCalled()
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

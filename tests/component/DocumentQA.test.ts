import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { AiBridgeEvent, AiBridgeSnapshot, AiContextDocument, AiProvider } from '@/core/ports/AiBridgePort'
import type { AiChatSession } from '@/core/service/AiChatHistoryService'

const mocks = vi.hoisted(() => ({ snapshot: vi.fn(), pair: vi.fn(), start: vi.fn(), cancel: vi.fn(), disconnect: vi.fn(), subscribe: vi.fn(), load: vi.fn(), build: vi.fn(), list: vi.fn(), save: vi.fn(), remove: vi.fn() }))
vi.mock('@/platform/web/app/useServices', () => ({ useServices: () => ({ aiBridge: mocks, aiContextService: mocks, aiChatHistory: mocks }) }))
import DocumentQA from '@/platform/web/pages/doc/knowledge/DocumentQA.vue'
import EventBus from '@/platform/web/components/EventBus'

const doc: AiContextDocument = { docId: 'current', title: '当前文章', url: '/current.html', contentHash: 'test', metadata: {},
  headings: [{ id: 'real-heading', title: '章节' }], relatedLinks: [{ url: '/related.html', title: '/关联.md' }],
  sources: [{ sourceId: 'D1S1', headingId: 'real-heading', title: '章节', text: '正文' }], truncated: false }
const listeners = new Set<(event: AiBridgeEvent) => void>()
let snapshot: AiBridgeSnapshot
let stored: AiChatSession[]
function emit(event: AiBridgeEvent) {
  if (event.type === 'state') snapshot = { ...snapshot, state: event.state, message: event.message }
  listeners.forEach(listener => listener(event))
}
const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.clearAllMocks(); listeners.clear(); stored = []
  snapshot = { state: 'ready', providers: [{ id: 'provider', name: '测试模型', protocol: 'responses', model: 'test', efforts: ['default', 'low', 'medium', 'high'] }], remembered: true, port: 19661 }
  mocks.snapshot.mockImplementation(() => snapshot)
  mocks.subscribe.mockImplementation(listener => { listeners.add(listener); return () => listeners.delete(listener) })
  mocks.load.mockImplementation(async (docId: string) => ({ ...doc, docId }))
  mocks.build.mockResolvedValue({ documents: [doc] })
  mocks.start.mockReturnValue('request-1')
  mocks.list.mockImplementation(() => JSON.parse(JSON.stringify(stored)))
  mocks.save.mockImplementation((session: AiChatSession) => { stored = [...stored.filter(item => item.id !== session.id), JSON.parse(JSON.stringify(session))] })
  mocks.remove.mockImplementation((id: string) => { stored = stored.filter(item => item.id !== id) })
})
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.useRealTimers() })
async function setup() {
  const wrapper = mount(DocumentQA, { props: { doc: 'current' } })
  wrappers.push(wrapper); await flushPromises(); return wrapper
}
async function send(wrapper: ReturnType<typeof mount>, question = '解释这段内容') {
  await wrapper.get('textarea').setValue(question)
  await wrapper.get('form').trigger('submit'); await flushPromises()
}
async function chooseSection(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('button[aria-controls="assistant-context"]').trigger('click')
  await wrapper.get('select[aria-label="选择当前文档章节"]').setValue(['real-heading'])
}
const modelKey = (providerId: string, model: string) => JSON.stringify([providerId, model])
function unmount(wrapper: ReturnType<typeof mount>) { wrapper.unmount(); wrappers.splice(wrappers.indexOf(wrapper), 1) }

describe('DocumentQA', () => {
  it('默认只发送目录和元信息，底部模型及强度控制请求参数，工具来源支持Markdown', async () => {
    const wrapper = await setup()
    await wrapper.get('select[aria-label="思考强度"]').setValue('high')
    await send(wrapper)
    expect(mocks.build).not.toHaveBeenCalled()
    expect(mocks.start.mock.calls[0][0]).toMatchObject({ providerId: 'provider', model: 'test', effort: 'high', context: { documents: [{ docId: 'current', sources: [], headings: doc.headings }] } })
    emit({ type: 'tool', requestId: 'request-1', callId: 'tool-1', name: 'get_document', status: 'running' })
    await flushPromises()
    expect(wrapper.text()).toContain('读取中…')
    emit({ type: 'tool', requestId: 'request-1', callId: 'tool-1', name: 'get_document', status: 'complete', sources: [{ sourceId: 'D1S1', title: '当前文章 · 章节', url: '/current.html?headingId=real-heading' }, { sourceId: 'D2S1', title: '不可信来源', url: 'javascript:alert(1)' }] })
    emit({ type: 'delta', requestId: 'request-1', delta: '## 结论\n\n**重点** [D1S1] [D9S9] [D2S1]\n\n<img src=x onerror=alert(1)>' })
    emit({ type: 'done', requestId: 'request-1', cancelled: false })
    await flushPromises()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('.qa-assistant-message h2').text()).toBe('结论')
    expect(wrapper.get('.qa-assistant-message strong').text()).toBe('重点')
    expect(wrapper.get('nav[aria-label="回答来源"] a').attributes('href')).toBe('/current.html?headingId=real-heading')
    expect(wrapper.findAll('nav[aria-label="回答来源"] a')).toHaveLength(1)
    expect(wrapper.text()).toContain('已读取')
    expect(wrapper.find('a[href^="javascript:"]').exists()).toBe(false)
    expect(stored[0].turns[0].sources).toHaveLength(1)
  })

  it('通过小入口显式选择章节和关联文档才附加正文', async () => {
    const wrapper = await setup()
    expect(wrapper.find('select[aria-label="选择当前文档章节"]').exists()).toBe(false)
    await chooseSection(wrapper)
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await send(wrapper)
    expect(mocks.build).toHaveBeenCalledWith([{ docId: 'current', headingIds: ['real-heading'] }, { docId: 'related', headingIds: [] }])
    expect(mocks.start.mock.calls[0][0].context.documents[0].sources).toEqual(doc.sources)
  })

  it('新聊天、切换聊天和刷新保留各自历史，取消只影响活动请求', async () => {
    const wrapper = await setup()
    await send(wrapper, '第一个问题')
    emit({ type: 'delta', requestId: 'request-1', delta: '第一个回答' })
    emit({ type: 'done', requestId: 'request-1', cancelled: false })
    await flushPromises()
    await wrapper.get('.qa-new-chat').trigger('click')
    expect(wrapper.find('.qa-user-message').exists()).toBe(false)
    await send(wrapper, '第二个问题')
    expect(stored).toHaveLength(2)
    await wrapper.findAll('.qa-session-select').find(item => item.text().includes('第一个问题'))!.trigger('click')
    expect(mocks.cancel).toHaveBeenCalledExactlyOnceWith('request-1')
    expect(wrapper.get('.qa-assistant-message').text()).toContain('第一个回答')
    expect(wrapper.findAll('.qa-user-message')).toHaveLength(1)
    unmount(wrapper)
    const restored = await setup()
    await restored.findAll('.qa-session-select').find(item => item.text().includes('第一个问题'))!.trigger('click')
    expect(restored.get('.qa-assistant-message').text()).toContain('第一个回答')
    expect(mocks.disconnect).not.toHaveBeenCalled()
  })

  it('切换文档取消本面板生成并忽略旧流，旧会话保留自己的文档上下文', async () => {
    const wrapper = await setup()
    await send(wrapper)
    await wrapper.setProps({ doc: 'next' }); await flushPromises()
    emit({ type: 'delta', requestId: 'request-1', delta: '旧文档回答' }); await flushPromises()
    expect(mocks.cancel).toHaveBeenCalledWith('request-1')
    expect(wrapper.text()).not.toContain('旧文档回答')
    expect(wrapper.get('textarea').element.value).toBe('')
    await wrapper.get('.qa-session-select').trigger('click'); await flushPromises()
    await send(wrapper, '继续追问')
    expect(mocks.start.mock.calls.at(-1)![0].context.documents[0].docId).toBe('current')
    unmount(wrapper)
    expect(mocks.disconnect).not.toHaveBeenCalled()
    expect(listeners.size).toBe(0)
  })

  it('准备上下文期间输入的下一条草稿不会被当前发送清空', async () => {
    let finish: (value: { documents: AiContextDocument[] }) => void = () => {}
    mocks.build.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    await chooseSection(wrapper); await send(wrapper, '正在发送的问题')
    await wrapper.get('textarea').setValue('下一条问题的草稿')
    finish({ documents: [doc] }); await flushPromises()
    expect(mocks.start.mock.calls[0][0].messages.at(-1)).toEqual({ role: 'user', content: '正在发送的问题' })
    expect(wrapper.get('textarea').element.value).toBe('下一条问题的草稿')
  })

  it('文档切换使未完成的上下文读取失效，不发送旧问题', async () => {
    let finish: (value: { documents: AiContextDocument[] }) => void = () => {}
    mocks.build.mockReturnValue(new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    await chooseSection(wrapper); await send(wrapper)
    await wrapper.setProps({ doc: 'next' })
    finish({ documents: [doc] }); await flushPromises()
    expect(mocks.start).not.toHaveBeenCalled()
  })

  it('准备上下文期间断线并恢复，旧准备结果失效，必须手动重新发送', async () => {
    let finish: (value: { documents: AiContextDocument[] }) => void = () => {}
    mocks.build.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    await chooseSection(wrapper); await send(wrapper)
    emit({ type: 'state', state: 'disconnected', message: '连接断开' }); await flushPromises()
    snapshot = { ...snapshot, providers: [{ id: 'new-provider', name: '新服务商', protocol: 'responses', model: 'new-model', efforts: ['default'] }] }
    emit({ type: 'state', state: 'ready' }); await flushPromises()
    finish({ documents: [doc] }); await flushPromises()
    expect(mocks.start).not.toHaveBeenCalled()
    expect(wrapper.get('textarea').element.value).toBe('解释这段内容')
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(mocks.start).toHaveBeenCalledOnce()
    expect(mocks.start.mock.calls[0][0].providerId).toBe('new-provider')
  })

  it.each(['model', 'effort'])('准备上下文时已提交的%s失效会保留问题并提示确认，不自动改用其他配置', async (changed) => {
    let finish: (value: { documents: AiContextDocument[] }) => void = () => {}
    mocks.build.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    await wrapper.get('select[aria-label="思考强度"]').setValue('high')
    await chooseSection(wrapper); await send(wrapper)
    snapshot = { ...snapshot, providers: changed === 'model'
      ? [{ id: 'other-provider', name: '另一服务商', protocol: 'responses', model: 'other-model', efforts: ['default'] }]
      : [{ ...snapshot.providers[0], efforts: ['default'] }] }
    emit({ type: 'providers' }); await flushPromises()
    finish({ documents: [doc] }); await flushPromises()
    expect(mocks.start).not.toHaveBeenCalled()
    expect(mocks.save).not.toHaveBeenCalled()
    expect(wrapper.get('textarea').element.value).toBe('解释这段内容')
    expect(wrapper.get('[role="alert"]').text()).toContain('所选模型或思考强度已更新')
    expect(wrapper.find('button[aria-label="停止生成"]').exists()).toBe(false)
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(mocks.start.mock.calls[0][0]).toMatchObject(changed === 'model'
      ? { providerId: 'other-provider', model: 'other-model', effort: 'default' }
      : { providerId: 'provider', model: 'test', effort: 'default' })
  })

  it('准备上下文时历史模型重新出现，当前提交仍使用点击发送时的有效模型', async () => {
    stored = [{ id: 'saved-session', docId: 'current', docTitle: '当前文章', title: '已保存聊天', providerId: 'saved-provider', model: 'saved-model', effort: 'high', turns: [], createdAt: 1, updatedAt: 1 }]
    let finish: (value: { documents: AiContextDocument[] }) => void = () => {}
    mocks.build.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    expect(wrapper.get('select[aria-label="模型"]').element.value).toBe(modelKey('provider', 'test'))
    await chooseSection(wrapper); await send(wrapper)
    snapshot = { ...snapshot, providers: [...snapshot.providers, { id: 'saved-provider', name: '历史模型', protocol: 'responses', model: 'saved-model', efforts: ['default', 'high'] }] }
    emit({ type: 'providers' }); await flushPromises()
    expect(wrapper.get('select[aria-label="模型"]').element.value).toBe(modelKey('saved-provider', 'saved-model'))
    finish({ documents: [doc] }); await flushPromises()
    expect(mocks.start.mock.calls[0][0]).toMatchObject({ providerId: 'provider', model: 'test', effort: 'high' })
    expect(stored[0]).toMatchObject({ providerId: 'provider', model: 'test', effort: 'high' })
    expect(wrapper.get('select[aria-label="模型"]').element.value).toBe(modelKey('provider', 'test'))
  })

  it('未连接时打开导航连接设置，空闲关闭不取消其他面板请求', async () => {
    snapshot = { ...snapshot, state: 'disconnected', providers: [], remembered: false }
    const open = vi.fn(); EventBus.on('show-note-bridge', open)
    const wrapper = await setup()
    expect(wrapper.find('input[aria-label="配对码"]').exists()).toBe(false)
    await wrapper.findAll('button').find(button => button.text() === '打开 Note Bridge 连接设置')!.trigger('click')
    expect(open).toHaveBeenCalledOnce()
    expect(wrapper.emitted('open-connection')).toHaveLength(1)
    EventBus.off('show-note-bridge', open); unmount(wrapper)
    expect(mocks.cancel).not.toHaveBeenCalled()
    expect(mocks.disconnect).not.toHaveBeenCalled()
  })

  it('关闭有活动请求的面板只取消该请求，并保存部分回答', async () => {
    const wrapper = await setup(); await send(wrapper)
    emit({ type: 'delta', requestId: 'request-1', delta: '部分回答' })
    unmount(wrapper)
    expect(mocks.cancel).toHaveBeenCalledExactlyOnceWith('request-1')
    expect(mocks.disconnect).not.toHaveBeenCalled()
    expect(stored[0].turns[0]).toMatchObject({ answer: '部分回答', cancelled: true, status: 'cancelled' })
  })

  it('历史回答与显示长度边界不会劈开emoji，超长输出仍会停止', async () => {
    const wrapper = await setup(); await send(wrapper)
    emit({ type: 'delta', requestId: 'request-1', delta: 'a'.repeat(3999) + '😀' })
    emit({ type: 'done', requestId: 'request-1', cancelled: false }); await flushPromises()
    await send(wrapper)
    expect(mocks.start.mock.calls[1][0].messages[1].content).toBe('a'.repeat(3999))
    const cancelledBefore = mocks.cancel.mock.calls.length
    emit({ type: 'delta', requestId: 'request-1', delta: 'b'.repeat(99999) + '😀' }); await flushPromises()
    const answer = stored[0].turns.at(-1)!.answer
    expect(answer).toHaveLength(99999); expect(answer.isWellFormed()).toBe(true)
    expect(wrapper.find('button[aria-label="停止生成"]').exists()).toBe(false)
    expect(mocks.cancel).toHaveBeenCalledTimes(cancelledBefore + 1)
  })

  it('存储失败仍可继续聊天并显示可理解的反馈，删除历史同步更新本地存储', async () => {
    const wrapper = await setup(); await send(wrapper)
    emit({ type: 'done', requestId: 'request-1', cancelled: false }); await flushPromises()
    await wrapper.get('.qa-delete-chat').trigger('click')
    expect(stored).toHaveLength(0); expect(wrapper.find('.qa-session').exists()).toBe(false)
    mocks.save.mockImplementation(() => { throw new Error('浏览器存储已满，本次聊天仍可继续。') })
    await send(wrapper)
    expect(wrapper.text()).toContain('浏览器存储已满')
    expect(wrapper.find('.qa-user-message').exists()).toBe(true)
  })

  it('刷新恢复的工具读取不显示为仍在执行，也不自动重发问题', async () => {
    const wrapper = await setup(); await send(wrapper)
    emit({ type: 'tool', requestId: 'request-1', callId: 'tool-1', name: 'get_toc', status: 'running' })
    const interrupted = JSON.parse(JSON.stringify(stored)) as AiChatSession[]
    interrupted[0].turns[0].answer = '尚未完成的回答'
    interrupted[0].turns[0].toolCalls = [{ callId: 'tool-1', name: 'get_toc', status: 'running' }]
    unmount(wrapper); stored = interrupted
    const restored = await setup()
    expect(restored.text()).toContain('读取已中断')
    expect(restored.text()).not.toContain('读取中…')
    expect(mocks.start).toHaveBeenCalledOnce()
    await send(restored, '刷新后的问题')
    expect(mocks.start.mock.calls.at(-1)![0].messages).toEqual([{ role: 'user', content: '刷新后的问题' }])
  })

  it('历史先于连接元数据加载时恢复保存的模型和思考强度，不自动覆盖偏好', async () => {
    stored = [{ id: 'saved-session', docId: 'current', docTitle: '当前文章', title: '已保存聊天', providerId: 'saved-provider', model: 'saved-model', effort: 'high', turns: [], createdAt: 1, updatedAt: 1 }]
    const firstProvider = snapshot.providers[0]
    snapshot = { ...snapshot, state: 'connecting', providers: [] }
    const wrapper = await setup()
    expect(mocks.save).not.toHaveBeenCalled()
    expect(stored[0]).toMatchObject({ providerId: 'saved-provider', effort: 'high' })
    snapshot = { ...snapshot, providers: [firstProvider, { id: 'saved-provider', name: '历史模型', protocol: 'responses', model: 'default-model', models: [{ id: 'default-model', name: '默认模型', efforts: ['default'] }, { id: 'saved-model', name: '保存的模型', efforts: ['default', 'low', 'medium', 'high'] }] }] }
    emit({ type: 'state', state: 'ready' }); await flushPromises()
    expect(wrapper.get('select[aria-label="模型"]').element.value).toBe(modelKey('saved-provider', 'saved-model'))
    expect(wrapper.get('select[aria-label="思考强度"]').element.value).toBe('high')
    expect(mocks.save).not.toHaveBeenCalled()
    await send(wrapper)
    expect(mocks.start.mock.calls.at(-1)![0]).toMatchObject({ providerId: 'saved-provider', model: 'saved-model', effort: 'high' })
  })

  it('重连时的临时fallback不覆盖历史偏好，显式选择后使用新偏好', async () => {
    stored = [{ id: 'saved-session', docId: 'current', docTitle: '当前文章', title: '已保存聊天', providerId: 'saved-provider', model: 'saved-model', effort: 'high', turns: [], createdAt: 1, updatedAt: 1 }]
    const firstProvider = snapshot.providers[0]
    const savedProvider = { ...firstProvider, id: 'saved-provider', name: '历史模型', model: 'saved-model' }
    const wrapper = await setup()
    expect(wrapper.get('select[aria-label="模型"]').element.value).toBe(modelKey('provider', 'test'))
    expect(mocks.save).not.toHaveBeenCalled()
    snapshot = { ...snapshot, providers: [firstProvider, savedProvider] }
    emit({ type: 'state', state: 'ready' }); await flushPromises()
    expect(wrapper.get('select[aria-label="模型"]').element.value).toBe(modelKey('saved-provider', 'saved-model'))
    expect(wrapper.get('select[aria-label="思考强度"]').element.value).toBe('high')
    await wrapper.get('select[aria-label="模型"]').setValue(modelKey('provider', 'test'))
    await wrapper.get('select[aria-label="思考强度"]').setValue('low')
    expect(stored[0]).toMatchObject({ providerId: 'provider', effort: 'low' })
    snapshot = { ...snapshot, providers: [] }
    emit({ type: 'state', state: 'connecting' }); await flushPromises()
    expect(stored[0]).toMatchObject({ providerId: 'provider', effort: 'low' })
    snapshot = { ...snapshot, providers: [savedProvider, firstProvider] }
    emit({ type: 'state', state: 'ready' }); await flushPromises()
    expect(wrapper.get('select[aria-label="模型"]').element.value).toBe(modelKey('provider', 'test'))
    expect(wrapper.get('select[aria-label="思考强度"]').element.value).toBe('low')
    await send(wrapper)
    expect(mocks.start.mock.calls.at(-1)![0]).toMatchObject({ providerId: 'provider', effort: 'low' })
  })

  it('同服务商的多个模型独立选择，实时更新修正思考强度且不会中断当前回答', async () => {
    const gateway: AiProvider = { id: 'gateway', name: '自定义网关', protocol: 'responses', model: 'default-model', models: [
      { id: 'default-model', name: '默认模型', efforts: ['default', 'low'] },
      { id: 'custom/reasoner', name: '自定义推理模型', efforts: ['default', 'high', 'xhigh'] },
    ] }
    snapshot = { ...snapshot, providers: [gateway, { ...gateway, id: 'other-gateway', name: '另一网关' }] }
    const wrapper = await setup()
    const models = wrapper.get('select[aria-label="模型"]')
    expect(models.findAll('optgroup').map(group => group.attributes('label'))).toEqual(['自定义网关', '另一网关'])
    expect(models.findAll('option')).toHaveLength(4)
    await models.setValue(modelKey('gateway', 'custom/reasoner'))
    await wrapper.get('select[aria-label="思考强度"]').setValue('xhigh')
    await send(wrapper)
    expect(mocks.start.mock.calls[0][0]).toMatchObject({ providerId: 'gateway', model: 'custom/reasoner', effort: 'xhigh' })
    snapshot = { ...snapshot, providers: [{ ...gateway, models: [gateway.models![0],
      { id: 'custom/reasoner', name: '推理模型（更新）', efforts: ['default', 'medium'], defaultEffort: 'medium' },
      { id: 'new-model', name: '新增模型', efforts: ['default'] },
    ] }] }
    emit({ type: 'providers' }); await flushPromises()
    expect(models.element.value).toBe(modelKey('gateway', 'custom/reasoner'))
    expect(models.text()).toContain('新增模型')
    expect(wrapper.get('select[aria-label="思考强度"]').element.value).toBe('medium')
    expect(wrapper.get('button[aria-label="停止生成"]').exists()).toBe(true)
    expect(mocks.cancel).not.toHaveBeenCalled()
    emit({ type: 'delta', requestId: 'request-1', delta: '列表更新后继续回答' })
    emit({ type: 'done', requestId: 'request-1', cancelled: false }); await flushPromises()
    expect(wrapper.get('.qa-assistant-message').text()).toContain('列表更新后继续回答')
    await send(wrapper, '使用更新后的强度')
    expect(mocks.start.mock.calls.at(-1)![0]).toMatchObject({ providerId: 'gateway', model: 'custom/reasoner', effort: 'medium' })
    emit({ type: 'done', requestId: 'request-1', cancelled: false }); await flushPromises()
    await models.setValue(modelKey('gateway', 'default-model'))
    expect(wrapper.get('select[aria-label="思考强度"]').element.value).toBe('default')
    expect(stored[0]).toMatchObject({ providerId: 'gateway', model: 'default-model', effort: 'default' })
  })

  it('Enter发送，Shift+Enter和中文输入法提交不触发发送', async () => {
    const wrapper = await setup()
    await wrapper.get('textarea').setValue('新的问题')
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter', shiftKey: true })
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter', isComposing: true })
    expect(mocks.start).not.toHaveBeenCalled()
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' }); await flushPromises()
    expect(mocks.start).toHaveBeenCalledOnce()
  })
})

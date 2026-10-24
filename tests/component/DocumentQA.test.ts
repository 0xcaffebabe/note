import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { AiBridgeEvent, AiBridgeSnapshot, AiDocumentMetadata, AiSessionSummary, AiSessionTurn, AiMessageInput } from '@/core/ports/AiBridgePort'

const mocks = vi.hoisted(() => ({ snapshot: vi.fn(), subscribe: vi.fn(), listSessions: vi.fn(), createSession: vi.fn(), getSession: vi.fn(), archiveSession: vi.fn(), subscribeSession: vi.fn(), unsubscribeSession: vi.fn(), sendMessage: vi.fn(), cancelRun: vi.fn(), document: vi.fn() }))
vi.mock('@/platform/web/app/useServices', () => ({ useServices: () => ({ aiBridge: mocks }) }))
import DocumentQA from '@/platform/web/pages/doc/knowledge/DocumentQA.vue'
import EventBus from '@/platform/web/components/EventBus'

const doc: AiDocumentMetadata = { docId: 'current', title: '当前文章', url: '/current.html', contentHash: 'revision-hash', headings: [{ id: 'real-heading', title: '章节' }] }
const listeners = new Set<(event: AiBridgeEvent) => void>()
let snapshot: AiBridgeSnapshot
let server: { session: AiSessionSummary; turns: AiSessionTurn[] }[]
let sequence = 0
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
function emit(event: AiBridgeEvent) {
  if (event.type === 'state') snapshot = { ...snapshot, state: event.state, message: event.message }
  listeners.forEach(listener => listener(event))
}
function createStored(id = 'session-old', title = '已有聊天', status: AiSessionSummary['status'] = 'idle') {
  return { session: { id, title, providerId: 'provider', model: 'test', effort: 'default' as const, status, createdAt: 1, updatedAt: 1, revision: 1 }, turns: [] as AiSessionTurn[] }
}
function publish(index = 0, patch: Partial<AiSessionTurn> = {}) {
  const entry = server[index]
  const turn = entry.turns.at(-1)!
  Object.assign(turn, patch)
  entry.session.revision++
  entry.session.status = turn.status === 'running' ? 'running' : 'idle'
  emit({ type: 'session.updated', sessionId: entry.session.id, revision: entry.session.revision, session: clone(entry.session), turn: clone(turn) })
}
const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.clearAllMocks(); listeners.clear(); server = []; sequence = 0
  snapshot = { state: 'ready', providers: [{ id: 'provider', name: '测试模型', protocol: 'responses', model: 'test', efforts: ['default', 'low', 'medium', 'high'] }], remembered: true, port: 19661 }
  mocks.snapshot.mockImplementation(() => clone(snapshot))
  mocks.subscribe.mockImplementation(listener => { listeners.add(listener); return () => listeners.delete(listener) })
  mocks.document.mockImplementation(async (docId: string) => ({ ...doc, docId }))
  mocks.listSessions.mockImplementation(async () => ({ sessions: clone(server.map(entry => entry.session)) }))
  mocks.createSession.mockImplementation(async selection => {
    const entry = createStored(`session-${++sequence}`, '新聊天')
    Object.assign(entry.session, selection); server.unshift(entry); return clone(entry.session)
  })
  mocks.getSession.mockImplementation(async id => clone(server.find(entry => entry.session.id === id)!))
  mocks.subscribeSession.mockResolvedValue(undefined)
  mocks.unsubscribeSession.mockResolvedValue(undefined)
  mocks.archiveSession.mockImplementation(async id => { server = server.filter(entry => entry.session.id !== id) })
  mocks.sendMessage.mockImplementation(async (input: AiMessageInput) => {
    const entry = server.find(entry => entry.session.id === input.sessionId)!
    Object.assign(entry.session, { title: input.text.slice(0, 80), providerId: input.providerId, model: input.model, effort: input.effort, status: 'running', updatedAt: Date.now() })
    const turn: AiSessionTurn = { id: `turn-${++sequence}`, question: input.text, answer: '', sources: [], toolCalls: [], status: 'running', createdAt: sequence }
    entry.turns.push(turn); publish(server.indexOf(entry))
    return { runId: 'run-1', turnId: turn.id }
  })
  mocks.cancelRun.mockImplementation(async id => { const index = server.findIndex(entry => entry.session.id === id); publish(index, { status: 'cancelled' }) })
})
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.useRealTimers() })
async function setup(props: { doc?: string } = { doc: 'current' }) { const wrapper = mount(DocumentQA, { props }); wrappers.push(wrapper); await flushPromises(); return wrapper }
async function send(wrapper: ReturnType<typeof mount>, question = '解释知识库中的概念') { await wrapper.get('textarea').setValue(question); await wrapper.get('form').trigger('submit'); await flushPromises() }
function unmount(wrapper: ReturnType<typeof mount>) { wrapper.unmount(); wrappers.splice(wrappers.indexOf(wrapper), 1) }
const modelKey = (providerId: string, model: string) => JSON.stringify([providerId, model])

describe('DocumentQA persistent thin client', () => {
  it('sends a global question and model choices without loading website documents or composing model history', async () => {
    const wrapper = await setup()
    await wrapper.get('select[aria-label="思考强度"]').setValue('high')
    await send(wrapper)
    expect(mocks.document).not.toHaveBeenCalled()
    expect(mocks.createSession).toHaveBeenCalledWith({ providerId: 'provider', model: 'test', effort: 'high' })
    expect(mocks.sendMessage).toHaveBeenCalledWith({ sessionId: 'session-1', clientRequestId: expect.any(String), providerId: 'provider', model: 'test', effort: 'high', text: '解释知识库中的概念' })
    expect(wrapper.text()).toContain('聊天记录保存在本机 Note Bridge')
    expect(wrapper.text()).toContain('关闭窗口或切换聊天后，回答会在 Note Bridge 中继续')
    expect(mocks.subscribeSession.mock.invocationCallOrder[0]).toBeLessThan(mocks.getSession.mock.invocationCallOrder[0])
    expect(wrapper.get('textarea').element.value).toBe('')
  })

  it('ignores old browser chat data without importing it into bridge sessions', async () => {
    const legacy = JSON.stringify([{ id: 'legacy', title: '旧浏览器聊天', turns: [{ question: '历史问题', answer: '旧答案' }] }])
    localStorage.setItem('note:ai-chat-history:v1', legacy)
    try {
      const wrapper = await setup()
      expect(wrapper.text()).not.toContain('旧浏览器聊天')
      expect(wrapper.text()).not.toContain('旧答案')
      expect(mocks.createSession).not.toHaveBeenCalled()
      expect(mocks.sendMessage).not.toHaveBeenCalled()
      expect(localStorage.getItem('note:ai-chat-history:v1')).toBe(legacy)
    } finally { localStorage.removeItem('note:ai-chat-history:v1') }
  })

  it('renders persisted Markdown, safe citations and expandable tool summaries', async () => {
    const wrapper = await setup()
    await send(wrapper)
    publish(0, { status: 'complete', answer: '## 结论\n\n**重点** [D1S1]\n\n<img src=x onerror=alert(1)>', sources: [{ sourceId: 'D1S1', title: '当前文章 · 章节', url: '/current.html#real-heading' }, { sourceId: 'D2S1', title: '恶意链接', url: 'javascript:alert(1)' }], toolCalls: [{ callId: 'tool-1', name: 'get_document', status: 'complete', overview: { input: [{ label: '文档', value: '<img src=x onerror=alert(1)>' }], summary: '已读取章节', items: ['重要概念'], note: '使用站点版本 release-1' } }] })
    await flushPromises()
    expect(wrapper.get('.qa-assistant-message h2').text()).toBe('结论')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.findAll('nav[aria-label="回答来源"] a')).toHaveLength(1)
    expect(wrapper.get('.qa-tool-call summary').text()).toContain('读取文档')
    expect(wrapper.get('.qa-tool-call').attributes('open')).toBeUndefined()
    expect(wrapper.get('.qa-tool-overview').text()).toContain('已读取章节')
    expect(wrapper.get('.qa-tool-overview').text()).toContain('<img src=x onerror=alert(1)>')
    unmount(wrapper)
    const restored = await setup()
    expect(restored.get('.qa-tool-overview').text()).toContain('使用站点版本 release-1')
    expect(restored.get('.qa-assistant-message h2').text()).toBe('结论')
  })

  it('unmount, switching sessions, new chat and document navigation never cancel active runs', async () => {
    const wrapper = await setup()
    await send(wrapper)
    await wrapper.setProps({ doc: 'another' })
    expect(wrapper.get('button[aria-label="停止生成"]').exists()).toBe(true)
    await wrapper.get('.qa-new-chat').trigger('click'); await flushPromises()
    expect(mocks.unsubscribeSession).toHaveBeenCalledWith('session-1')
    await wrapper.get('.qa-session-select').trigger('click'); await flushPromises()
    expect(wrapper.text()).toContain('正在思考')
    unmount(wrapper)
    expect(mocks.cancelRun).not.toHaveBeenCalled()
    expect(mocks.unsubscribeSession).toHaveBeenCalledTimes(2)
    publish(0, { status: 'complete', answer: '后台完成的答案' })
    const reopened = await setup()
    expect(reopened.text()).toContain('后台完成的答案')
  })

  it('only the stop button invokes durable cancellation and shows the server result', async () => {
    const wrapper = await setup()
    await send(wrapper)
    await wrapper.get('button[aria-label="停止生成"]').trigger('click'); await flushPromises()
    expect(mocks.cancelRun).toHaveBeenCalledExactlyOnceWith('session-1')
    expect(wrapper.text()).toContain('回答已停止')
    expect(wrapper.find('button[aria-label="停止生成"]').exists()).toBe(false)
  })

  it('disconnect retains running projection; reconnect subscribes and reloads without resending', async () => {
    const wrapper = await setup()
    await send(wrapper)
    publish(0, { answer: '已保存片段' })
    emit({ type: 'state', state: 'disconnected', message: '断线' }); await flushPromises()
    expect(wrapper.text()).toContain('回答仍在 Note Bridge 中继续')
    expect(wrapper.text()).toContain('已保存片段')
    Object.assign(server[0].turns[0], { status: 'complete', answer: '离线期间完成的答案' }); server[0].session.status = 'idle'; server[0].session.revision++
    emit({ type: 'state', state: 'ready' }); await flushPromises()
    expect(wrapper.text()).toContain('离线期间完成的答案')
    expect(mocks.sendMessage).toHaveBeenCalledTimes(1)
    expect(mocks.subscribeSession).toHaveBeenCalledTimes(2)
    expect(mocks.cancelRun).not.toHaveBeenCalled()
  })

  it('uses bridge-approved document metadata and sends attachment references only', async () => {
    const wrapper = await setup()
    await wrapper.get('button[aria-controls="assistant-context"]').trigger('click'); await flushPromises()
    expect(mocks.document).toHaveBeenCalledExactlyOnceWith('current')
    await wrapper.get('input[aria-label="附加当前文档目录"]').setValue(true)
    await wrapper.get('select[aria-label="选择当前文档章节"]').setValue(['real-heading'])
    await send(wrapper)
    expect(mocks.sendMessage.mock.calls[0][0].attachments).toEqual([{ docId: 'current', headingIds: ['real-heading'], contentHash: 'revision-hash' }])
    expect(mocks.sendMessage.mock.calls[0][0]).not.toHaveProperty('context')
    expect(mocks.sendMessage.mock.calls[0][0]).not.toHaveProperty('messages')
    expect(mocks.sendMessage.mock.calls[0][0]).not.toHaveProperty('tools')
  })

  it('supports live custom model catalogs and per-model effort choices', async () => {
    snapshot.providers[0].models = [{ id: 'test', name: '默认', efforts: ['default', 'low'] }, { id: 'custom/model', name: '自定义', efforts: ['default', 'xhigh'], defaultEffort: 'xhigh', contextWindowTokens: 128000, maxOutputTokens: 8192 }]
    const wrapper = await setup()
    await wrapper.get('select[aria-label="模型"]').setValue(modelKey('provider', 'custom/model'))
    await wrapper.get('select[aria-label="思考强度"]').setValue('xhigh')
    await send(wrapper)
    expect(mocks.sendMessage.mock.calls[0][0]).toMatchObject({ model: 'custom/model', effort: 'xhigh' })
    publish(0, { status: 'complete', answer: '完成' }); await flushPromises()
    snapshot.providers[0].models.push({ id: 'new', name: '新增', efforts: ['default', 'ultra'] })
    emit({ type: 'providers' }); await flushPromises()
    expect(wrapper.findAll('select[aria-label="模型"] option').map(option => option.attributes('value'))).toContain(modelKey('provider', 'new'))
  })

  it('paginates sessions and older complete turns without requesting full history', async () => {
    server.push(createStored())
    server[0].turns = [{ id: 'new-turn', question: '最新问题', answer: '最新回答', createdAt: 2, status: 'complete', sources: [], toolCalls: [] }]
    mocks.listSessions.mockImplementation(async cursor => cursor ? { sessions: [createStored('older-session', '更早聊天').session] } : { sessions: [server[0].session], nextCursor: 'session-page-2' })
    mocks.getSession.mockImplementation(async (_id, cursor) => ({ session: server[0].session, turns: cursor ? [{ ...server[0].turns[0], id: 'old-turn', question: '更早问题', createdAt: 1 }] : server[0].turns, ...(cursor ? {} : { nextCursor: 'turn-page-2' }) }))
    const wrapper = await setup()
    await wrapper.findAll('.qa-load-more').find(button => button.text() === '加载更多聊天')!.trigger('click'); await flushPromises()
    expect(mocks.listSessions).toHaveBeenLastCalledWith('session-page-2')
    await wrapper.findAll('.qa-load-more').find(button => button.text() === '加载更早的消息')!.trigger('click'); await flushPromises()
    expect(mocks.getSession).toHaveBeenLastCalledWith('session-old', 'turn-page-2')
    expect(wrapper.findAll('.qa-user-message').map(item => item.text())).toEqual(['你：更早问题', '你：最新问题'])
    expect(wrapper.findAll('.qa-session-select')).toHaveLength(2)
  })

  it('a stale get response cannot overwrite a newer committed update', async () => {
    server.push(createStored('race'))
    const older: AiSessionTurn = { id: 'turn', question: '问题', answer: '旧快照', status: 'running', sources: [], toolCalls: [], createdAt: 1 }
    let finish!: (value: unknown) => void
    mocks.getSession.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    const newer = { ...server[0].session, revision: 3, status: 'idle' as const }
    emit({ type: 'session.updated', sessionId: 'race', revision: 3, session: newer, turn: { ...older, status: 'complete', answer: '新快照' } })
    finish({ session: server[0].session, turns: [older] }); await flushPromises()
    expect(wrapper.text()).toContain('新快照')
    expect(wrapper.text()).not.toContain('旧快照')
    expect(wrapper.find('button[aria-label="停止生成"]').exists()).toBe(false)
  })

  it('late results from a previously selected conversation do not replace current history', async () => {
    server.push(createStored('first', '第一聊天'), createStored('second', '第二聊天'))
    let finish!: (value: unknown) => void
    mocks.getSession.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const wrapper = await setup()
    await wrapper.findAll('.qa-session-select').find(button => button.text().includes('第二聊天'))!.trigger('click'); await flushPromises()
    finish({ session: server[0].session, turns: [{ id: 'late', question: '旧问题', answer: '迟到答案', createdAt: 1, status: 'complete', sources: [], toolCalls: [] }] }); await flushPromises()
    expect(wrapper.text()).not.toContain('迟到答案')
    expect(wrapper.get('.qa-session.active').text()).toContain('第二聊天')
    expect(mocks.cancelRun).not.toHaveBeenCalled()
  })

  it('archives on bridge, does not remove local browser history, and rejects archiving running chats', async () => {
    const wrapper = await setup()
    await send(wrapper)
    expect(wrapper.get('button[aria-label^="归档聊天"]').attributes('disabled')).toBeDefined()
    publish(0, { status: 'complete', answer: '完成' }); await flushPromises()
    await wrapper.get('button[aria-label^="归档聊天"]').trigger('click'); await flushPromises()
    expect(mocks.archiveSession).toHaveBeenCalledExactlyOnceWith('session-1')
    expect(wrapper.findAll('.qa-session-select')).toHaveLength(0)
    expect(mocks.cancelRun).not.toHaveBeenCalled()
  })

  it('retries an unacknowledged identical message with the same idempotency key', async () => {
    mocks.sendMessage.mockRejectedValue(new Error('确认超时'))
    const wrapper = await setup()
    await send(wrapper, '不要重复生成')
    expect(wrapper.text()).toContain('确认超时')
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(mocks.sendMessage).toHaveBeenCalledTimes(2)
    expect(mocks.sendMessage.mock.calls[0][0].clientRequestId).toBe(mocks.sendMessage.mock.calls[1][0].clientRequestId)
    expect(mocks.createSession).toHaveBeenCalledTimes(1)
  })

  it('opens shared connection settings when disconnected and allows an empty global entry point', async () => {
    snapshot.state = 'disconnected'; snapshot.providers = []
    const handler = vi.fn(); EventBus.on('show-note-bridge', handler)
    const wrapper = await setup({})
    expect(wrapper.get('button[aria-label="发送问题"]').attributes('disabled')).toBeDefined()
    await wrapper.get('.qa-connection-prompt button').trigger('click')
    expect(handler).toHaveBeenCalled(); expect(wrapper.emitted('open-connection')).toHaveLength(1)
    EventBus.off('show-note-bridge', handler)
  })
})

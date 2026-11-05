import { afterEach, describe, expect, it, vi } from 'vitest'
import { AI_BRIDGE_STORAGE_KEY, BrowserAiBridge } from '@/adapters/browser/BrowserAiBridge'
import type { AiBridgeEvent, AiMessageInput, AiProvider } from '@/core/ports/AiBridgePort'
import type { StoragePort } from '@/core/ports/StoragePort'

class MemoryStorage implements StoragePort {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

class Socket {
  readyState = 0
  sent: Record<string, unknown>[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  send(data: string) { this.sent.push(JSON.parse(data)) }
  close() { this.readyState = 3 }
  open() { this.readyState = 1; this.onopen?.() }
  receive(frame: object) { this.onmessage?.({ data: JSON.stringify({ v: 2, ...frame }) }) }
}

const input: AiMessageInput = { sessionId: 'session-1', clientRequestId: 'submission-1', providerId: 'local', model: 'test', text: '问题' }
const provider: AiProvider = { id: 'local', name: 'Local', protocol: 'responses', model: 'test', efforts: ['default', 'low', 'medium', 'high'] }
const clients: BrowserAiBridge[] = []
function setup(storage: StoragePort = new MemoryStorage(), lifecycle?: EventTarget) {
  const sockets: Socket[] = []
  const urls: string[] = []
  let next = 0
  const bridge = new BrowserAiBridge(url => {
    urls.push(url)
    const socket = new Socket()
    sockets.push(socket)
    return socket as unknown as WebSocket
  }, () => `request-${++next}`, storage, lifecycle)
  clients.push(bridge)
  const events: AiBridgeEvent[] = []
  bridge.subscribe(event => events.push(event))
  return { bridge, sockets, events, urls, storage }
}
async function authenticate(bridge: BrowserAiBridge, sockets: Socket[]) {
  const pair = bridge.pair('123456')
  const socket = sockets[sockets.length - 1]
  socket.open()
  socket.receive({ type: 'auth.ok', capabilities: ['persistent_sessions', 'knowledge_tools'], token: 'memory-only-token', providers: [provider], connectionId: 'c' })
  await pair
  return socket
}
afterEach(() => { clients.splice(0).forEach(client => client.dispose()); vi.useRealTimers() })

describe('BrowserAiBridge persistent session protocol', () => {
  it('配对只保存桥接凭证和端口，刷新时幂等自动认证，绿色状态须等认证成功', async () => {
    const first = setup()
    await authenticate(first.bridge, first.sockets)
    expect(JSON.parse(first.storage.getItem(AI_BRIDGE_STORAGE_KEY)!)).toEqual({ version: 1, port: 19661, token: 'memory-only-token' })
    first.bridge.dispose()
    const refreshed = setup(first.storage)
    refreshed.bridge.initialize()
    refreshed.bridge.initialize()
    expect(refreshed.sockets).toHaveLength(1)
    expect(refreshed.bridge.snapshot()).toMatchObject({ state: 'connecting', remembered: true, providers: [] })
    refreshed.sockets[0].open()
    expect(refreshed.sockets[0].sent).toEqual([{ v: 2, type: 'auth', token: 'memory-only-token' }])
    refreshed.sockets[0].receive({ type: 'auth.ok', capabilities: ['persistent_sessions', 'knowledge_tools'], token: 'memory-only-token', providers: [provider], connectionId: 'new' })
    expect(refreshed.bridge.snapshot()).toMatchObject({ state: 'ready', remembered: true, providers: [provider] })
    expect(JSON.stringify(refreshed.bridge.snapshot())).not.toContain('memory-only-token')
  })

  it('撤销凭证后清除本地记忆并停止自动尝试', async () => {
    vi.useFakeTimers()
    const lifecycle = new EventTarget()
    const { bridge, sockets, storage } = setup(new MemoryStorage(), lifecycle)
    const socket = await authenticate(bridge, sockets)
    socket.onclose?.()
    vi.advanceTimersByTime(1000)
    sockets[1].open()
    sockets[1].receive({ type: 'error', code: 'auth_failed', message: '授权已撤销，请重新配对' })
    expect(storage.getItem(AI_BRIDGE_STORAGE_KEY)).toBeNull()
    expect(bridge.snapshot()).toMatchObject({ state: 'disconnected', remembered: false })
    lifecycle.dispatchEvent(new Event('online'))
    vi.advanceTimersByTime(120000)
    expect(sockets).toHaveLength(2)
  })

  it.each(['agent_unavailable', 'authorization_unavailable'])('%s 后按退避恢复认证，保留凭证且不重发业务请求', async code => {
    vi.useFakeTimers()
    const { bridge, sockets, storage } = setup()
    const first = await authenticate(bridge, sockets)
    const saved = storage.getItem(AI_BRIDGE_STORAGE_KEY)
    const sending = bridge.sendMessage(input)
    const rejected = expect(sending).rejects.toMatchObject({ code: 'disconnected' })
    first.onclose?.()
    await rejected
    vi.advanceTimersByTime(1000)

    sockets[1].open()
    sockets[1].receive({ type: 'error', code, message: '服务暂时不可用' })
    expect(bridge.snapshot()).toMatchObject({ state: 'disconnected', remembered: true, message: '服务暂时不可用' })
    expect(storage.getItem(AI_BRIDGE_STORAGE_KEY)).toBe(saved)
    vi.advanceTimersByTime(1999)
    expect(sockets).toHaveLength(2)
    vi.advanceTimersByTime(1)

    sockets[2].open()
    sockets[2].receive({ type: 'error', code, message: '服务暂时不可用' })
    vi.advanceTimersByTime(3999)
    expect(sockets).toHaveLength(3)
    vi.advanceTimersByTime(1)
    const recovered = sockets[3]
    recovered.open()
    recovered.receive({ type: 'auth.ok', token: 'memory-only-token', providers: [provider], capabilities: ['persistent_sessions', 'knowledge_tools'] })
    expect(bridge.snapshot()).toMatchObject({ state: 'ready', remembered: true, providers: [provider] })
    expect(storage.getItem(AI_BRIDGE_STORAGE_KEY)).toBe(saved)
    expect(sockets.slice(1).map(socket => socket.sent)).toEqual(Array.from({ length: 3 }, () => [{ v: 2, type: 'auth', token: 'memory-only-token' }]))
    expect(sockets.flatMap(socket => socket.sent).filter(frame => frame.method === 'messages.send')).toHaveLength(1)
  })

  it.each(['agent_unavailable', 'authorization_unavailable'])('%s 后手动断开会取消重试，网络恢复也不重新连接', async code => {
    vi.useFakeTimers()
    const lifecycle = new EventTarget()
    const { bridge, sockets } = setup(new MemoryStorage(), lifecycle)
    const first = await authenticate(bridge, sockets)
    first.onclose?.()
    vi.advanceTimersByTime(1000)
    sockets[1].open()
    sockets[1].receive({ type: 'error', code, message: '服务暂时不可用' })

    bridge.disconnect()
    lifecycle.dispatchEvent(new Event('online'))
    vi.advanceTimersByTime(120000)
    expect(sockets).toHaveLength(2)
    expect(bridge.snapshot()).toMatchObject({ state: 'disconnected', remembered: true })
  })

  it('协议不兼容时保留凭证但停止自动重试', async () => {
    vi.useFakeTimers()
    const lifecycle = new EventTarget()
    const { bridge, sockets } = setup(new MemoryStorage(), lifecycle)
    const first = await authenticate(bridge, sockets)
    first.onclose?.()
    vi.advanceTimersByTime(1000)
    sockets[1].open()
    sockets[1].receive({ type: 'error', code: 'unsupported_version', message: '协议版本不兼容' })

    lifecycle.dispatchEvent(new Event('online'))
    vi.advanceTimersByTime(120000)
    expect(sockets).toHaveLength(2)
    expect(bridge.snapshot()).toMatchObject({ state: 'disconnected', remembered: true })
  })

  it('断开保留记忆且本页暂停；忘记撤销当前授权并阻止刷新恢复', async () => {
    vi.useFakeTimers()
    const { bridge, sockets, storage } = setup()
    await authenticate(bridge, sockets)
    bridge.disconnect()
    expect(bridge.snapshot()).toMatchObject({ state: 'disconnected', remembered: true })
    vi.advanceTimersByTime(120000)
    expect(sockets).toHaveLength(1)
    const reconnect = bridge.reconnect()
    sockets[1].open()
    sockets[1].receive({ type: 'auth.ok', capabilities: ['persistent_sessions', 'knowledge_tools'], token: 'memory-only-token', providers: [provider] })
    await reconnect
    bridge.forget()
    expect(sockets[1].sent).toContainEqual({ v: 2, type: 'auth.forget' })
    expect(storage.getItem(AI_BRIDGE_STORAGE_KEY)).toBeNull()
    const refreshed = setup(storage)
    refreshed.bridge.initialize()
    expect(refreshed.sockets).toHaveLength(0)
  })

  it('存储失败可继续当前连接但明确提示无法记住；损坏凭证不发起连接', async () => {
    const failed: StoragePort = { getItem: () => null, setItem: () => { throw new Error('quota') }, removeItem: () => {} }
    const client = setup(failed)
    await authenticate(client.bridge, client.sockets)
    expect(client.bridge.snapshot()).toMatchObject({ state: 'ready', remembered: false, message: expect.stringContaining('无法保存') })
    for (const raw of ['bad json', JSON.stringify({ version: 1, port: 80, token: 'memory-only-token' }), JSON.stringify({ version: 1, url: 'ws://remote.test', token: 'memory-only-token' })]) {
      const storage = new MemoryStorage()
      storage.setItem(AI_BRIDGE_STORAGE_KEY, raw)
      const invalid = setup(storage)
      invalid.bridge.initialize()
      expect(invalid.sockets).toHaveLength(0)
      expect(invalid.bridge.snapshot().remembered).toBe(false)
    }
  })

  it('延迟到达的旧认证成功不能恢复另一标签页已忘记的凭证', async () => {
    vi.useFakeTimers()
    const first = setup()
    await authenticate(first.bridge, first.sockets)
    const other = setup(first.storage)
    other.bridge.initialize()
    other.sockets[0].open()
    first.bridge.disconnect()
    first.bridge.forget()
    // Deliver auth.ok before the browser dispatches its queued storage event.
    other.sockets[0].receive({ type: 'auth.ok', capabilities: ['persistent_sessions', 'knowledge_tools'], token: 'memory-only-token', providers: [provider] })
    expect(first.storage.getItem(AI_BRIDGE_STORAGE_KEY)).toBeNull()
    expect(other.bridge.snapshot()).toMatchObject({ state: 'disconnected', remembered: false })
    vi.advanceTimersByTime(120000)
    expect(other.sockets).toHaveLength(1)
  })

  it('旧认证失败不能删除另一标签页刚配对的新凭证', async () => {
    const first = setup()
    await authenticate(first.bridge, first.sockets)
    const other = setup(first.storage)
    other.bridge.initialize()
    other.sockets[0].open()
    const pair = first.bridge.pair('654321')
    first.sockets[1].open()
    first.sockets[1].receive({ type: 'auth.ok', capabilities: ['persistent_sessions', 'knowledge_tools'], token: 'new-remembered-token', providers: [provider] })
    await pair
    other.sockets[0].receive({ type: 'error', code: 'auth_failed', message: 'old token revoked' })
    expect(JSON.parse(first.storage.getItem(AI_BRIDGE_STORAGE_KEY)!).token).toBe('new-remembered-token')
    expect(other.sockets).toHaveLength(2)
    other.sockets[1].open()
    expect(other.sockets[1].sent).toEqual([{ v: 2, type: 'auth', token: 'new-remembered-token' }])
    other.sockets[1].receive({ type: 'auth.ok', capabilities: ['persistent_sessions', 'knowledge_tools'], token: 'new-remembered-token', providers: [provider] })
    expect(other.bridge.snapshot().state).toBe('ready')
    expect(first.bridge.snapshot().state).toBe('ready')
  })


})

const session = { id: 'session-1', title: '知识库问题', providerId: 'local', model: 'test', effort: 'default', status: 'running', createdAt: 1, updatedAt: 2, revision: 2 }
const turn = { id: 'turn-1', question: '问题', answer: '回答', status: 'running', createdAt: 2, sources: [], toolCalls: [] }
function respond(socket: Socket, result: unknown) { socket.receive({ type: 'response', id: socket.sent.at(-1)!.id, result }) }

describe('persistent session RPC', () => {
  it('only sends question, model and document references; no transcript, tool definitions or browser context', async () => {
    const { bridge, sockets, urls } = setup()
    await expect(bridge.sendMessage(input)).rejects.toThrow('连接')
    const socket = await authenticate(bridge, sockets)
    const promise = bridge.sendMessage({ ...input, effort: 'high', attachments: [{ docId: 'doc', headingIds: ['section'], contentHash: 'hash' }] })
    expect(urls).toEqual(['ws://127.0.0.1:19661/ws'])
    expect(socket.sent[0]).toEqual({ v: 2, type: 'pair', code: '123456' })
    expect(socket.sent[1]).toEqual({ v: 2, type: 'request', id: 'request-1', method: 'messages.send', params: { ...input, effort: 'high', attachments: [{ docId: 'doc', headingIds: ['section'], contentHash: 'hash' }] } })
    respond(socket, { runId: 'run-1', turnId: 'turn-1', secret: 'must-not-copy' })
    await expect(promise).resolves.toEqual({ runId: 'run-1', turnId: 'turn-1' })
    expect(JSON.stringify(socket.sent)).not.toMatch(/memory-only-token|tool.result|"messages"|"context"/)
  })

  it('correlates concurrent paginated requests and surfaces RPC errors without losing the connection', async () => {
    const { bridge, sockets } = setup()
    const socket = await authenticate(bridge, sockets)
    const list = bridge.listSessions('next')
    const page = bridge.getSession('session-1', 'earlier')
    expect(socket.sent.slice(1)).toMatchObject([
      { method: 'sessions.list', params: { cursor: 'next' } },
      { method: 'sessions.get', params: { sessionId: 'session-1', cursor: 'earlier' } },
    ])
    socket.receive({ type: 'response', id: 'request-2', result: { session, turns: [turn], nextCursor: 'older' } })
    socket.receive({ type: 'response', id: 'request-1', result: { sessions: [session] } })
    await expect(page).resolves.toMatchObject({ session, turns: [turn], nextCursor: 'older' })
    await expect(list).resolves.toMatchObject({ sessions: [session] })
    const archive = bridge.archiveSession(session.id)
    socket.receive({ type: 'response', id: 'request-3', error: { code: 'busy', message: '聊天正在生成' } })
    await expect(archive).rejects.toMatchObject({ code: 'busy', message: '聊天正在生成' })
    expect(bridge.snapshot().state).toBe('ready')
  })

  it('accepts bounded complete turn projections with tool overviews and citations', async () => {
    const { bridge, sockets, events } = setup()
    const socket = await authenticate(bridge, sockets)
    const current = { ...turn, sources: [{ sourceId: 'D1S1', title: '章节', url: '/doc.html#heading', contentHash: 'hash', revision: 'release-1' }], toolCalls: [{ callId: 'call_123|fc_456', name: 'get_document', status: 'complete', overview: { input: [{ label: '文档', value: 'doc' }], summary: '读取 100 个字符' } }] }
    socket.receive({ type: 'session.updated', sessionId: session.id, revision: 2, session, turn: current })
    socket.receive({ type: 'sessions.changed' })
    expect(events).toContainEqual({ type: 'session.updated', sessionId: session.id, revision: 2, session, turn: current })
    expect(events).toContainEqual({ type: 'sessions.changed' })
    expect(socket.sent).toHaveLength(1)
  })

  it('closing the socket rejects pending acknowledgements without cancelling or resubmitting work', async () => {
    vi.useFakeTimers()
    const { bridge, sockets } = setup()
    const first = await authenticate(bridge, sockets)
    const sending = bridge.sendMessage(input)
    const rejected = expect(sending).rejects.toMatchObject({ code: 'disconnected' })
    first.onclose?.()
    await rejected
    vi.advanceTimersByTime(1000)
    const next = sockets[1]
    next.open()
    next.receive({ type: 'auth.ok', token: 'memory-only-token', providers: [provider], capabilities: ['persistent_sessions', 'knowledge_tools'] })
    expect(next.sent).toEqual([{ v: 2, type: 'auth', token: 'memory-only-token' }])
    expect(sockets.flatMap(item => item.sent).filter(frame => frame.method === 'messages.send')).toHaveLength(1)
    expect(sockets.flatMap(item => item.sent).some(frame => frame.method === 'runs.cancel')).toBe(false)
  })

  it('unsubscribe and manual disconnect never cancel; only explicit cancel sends runs.cancel', async () => {
    const { bridge, sockets } = setup()
    const socket = await authenticate(bridge, sockets)
    const subscribe = bridge.subscribeSession(session.id); respond(socket, { ok: true }); await subscribe
    const unsubscribe = bridge.unsubscribeSession(session.id); respond(socket, { ok: true }); await unsubscribe
    expect(socket.sent.map(frame => frame.method).filter(Boolean)).toEqual(['session.subscribe', 'session.unsubscribe'])
    const cancel = bridge.cancelRun(session.id); respond(socket, { ok: true }); await cancel
    bridge.disconnect()
    expect(socket.sent.filter(frame => frame.method === 'runs.cancel')).toHaveLength(1)
  })

  it('an acknowledgement timeout does not cancel generation or replay a submission', async () => {
    vi.useFakeTimers()
    const { bridge, sockets } = setup()
    const socket = await authenticate(bridge, sockets)
    const pending = bridge.sendMessage(input)
    const rejected = expect(pending).rejects.toMatchObject({ code: 'timeout' })
    vi.advanceTimersByTime(25000); socket.receive({ type: 'pong' }); vi.advanceTimersByTime(5001)
    await rejected
    socket.receive({ type: 'response', id: 'request-1', result: { runId: 'r', turnId: 't' } })
    expect(bridge.snapshot().state).toBe('ready')
    expect(socket.sent.some(frame => frame.method === 'runs.cancel')).toBe(false)
  })

  it('rejects old bridge versions with an explicit desktop upgrade message', async () => {
    const { bridge, sockets } = setup()
    const pending = bridge.pair('123456')
    sockets[0].open(); sockets[0].receive({ v: 1, type: 'error', code: 'bad_version', message: 'unsupported protocol' })
    await expect(pending).rejects.toThrow('升级桌面端')
    expect(bridge.snapshot().state).toBe('disconnected')
  })

  it('requires persistent session and knowledge capabilities before reporting ready', async () => {
    const { bridge, sockets } = setup()
    const pending = bridge.pair('123456')
    sockets[0].open(); sockets[0].receive({ type: 'auth.ok', token: 'memory-only-token', providers: [provider], capabilities: [] })
    await expect(pending).rejects.toThrow('升级桌面端')
  })

  it('rejects unsafe citations, oversized pages and mismatched session responses', async () => {
    const { bridge, sockets } = setup()
    const socket = await authenticate(bridge, sockets)
    const wrong = bridge.getSession('other'); respond(socket, { session, turns: [] }); await expect(wrong).rejects.toThrow('其他聊天')
    const unsafe = bridge.getSession(session.id); respond(socket, { session, turns: [{ ...turn, sources: [{ sourceId: 'D1S1', title: 'bad', url: 'javascript:alert(1)' }] }] }); await expect(unsafe).rejects.toThrow('无效')
    const large = bridge.listSessions(); respond(socket, { sessions: Array.from({ length: 51 }, (_, index) => ({ ...session, id: String(index) })) }); await expect(large).rejects.toThrow('无效')
  })

  it('model catalog updates preserve capabilities and reject invalid budgets', async () => {
    const { bridge, sockets, events } = setup()
    const socket = await authenticate(bridge, sockets)
    socket.receive({ type: 'providers.updated', providers: [{ ...provider, models: [{ id: 'custom', name: '自定义', efforts: ['default', 'xhigh', 'xhigh', 'invalid'], defaultEffort: 'xhigh', contextWindowTokens: 32768, maxOutputTokens: 4096 }] }] })
    const snapshot = bridge.snapshot()
    expect(snapshot.providers[0].models![0]).toMatchObject({ efforts: ['default', 'xhigh'], contextWindowTokens: 32768, maxOutputTokens: 4096 })
    snapshot.providers[0].models![0].efforts.push('ultra')
    expect(bridge.snapshot().providers[0].models![0].efforts).not.toContain('ultra')
    expect(events).toContainEqual({ type: 'providers' })
    socket.receive({ type: 'providers.updated', providers: [{ ...provider, models: [{ id: 'bad', name: 'bad', efforts: ['default'], contextWindowTokens: 32768, maxOutputTokens: 65536 }] }] })
    expect(bridge.snapshot().state).toBe('disconnected')
  })
})


describe('bridge lifecycle boundaries', () => {
  it('ignores late events from a replaced socket and reconnects only after heartbeat failure', async () => {
    vi.useFakeTimers()
    const { bridge, sockets } = setup()
    const first = await authenticate(bridge, sockets)
    const lateMessage = first.onmessage!
    const lateClose = first.onclose!
    const reconnecting = bridge.reconnect()
    const active = sockets[1]
    active.open()
    active.receive({
      type: 'auth.ok',
      token: 'memory-only-token',
      providers: [provider],
      capabilities: ['persistent_sessions', 'knowledge_tools'],
    })
    await reconnecting

    lateMessage({ data: 'invalid JSON' })
    lateClose()
    expect(bridge.snapshot().state).toBe('ready')

    vi.advanceTimersByTime(25000)
    expect(active.sent.at(-1)).toEqual({ v: 2, type: 'ping' })
    vi.advanceTimersByTime(25000)
    expect(bridge.snapshot()).toMatchObject({
      state: 'disconnected',
      message: expect.stringContaining('心跳超时'),
    })
    vi.advanceTimersByTime(1000)
    expect(sockets).toHaveLength(3)
    sockets[2].open()
    expect(sockets[2].sent).toEqual([{ v: 2, type: 'auth', token: 'memory-only-token' }])
  })

  it('adopts a credential changed by another page and removes lifecycle listeners on disposal', async () => {
    const lifecycle = new EventTarget()
    const { bridge, sockets, storage } = setup(new MemoryStorage(), lifecycle)
    await authenticate(bridge, sockets)
    storage.setItem(AI_BRIDGE_STORAGE_KEY, JSON.stringify({
      version: 1,
      port: 19662,
      token: 'new-remembered-token',
    }))
    lifecycle.dispatchEvent(Object.assign(new Event('storage'), { key: AI_BRIDGE_STORAGE_KEY }))
    expect(sockets).toHaveLength(2)
    sockets[1].open()
    expect(sockets[1].sent).toEqual([{ v: 2, type: 'auth', token: 'new-remembered-token' }])
    sockets[1].receive({
      type: 'auth.ok',
      token: 'new-remembered-token',
      providers: [provider],
      capabilities: ['persistent_sessions', 'knowledge_tools'],
    })
    expect(bridge.snapshot()).toMatchObject({ state: 'ready', port: 19662, remembered: true })

    bridge.dispose()
    storage.removeItem(AI_BRIDGE_STORAGE_KEY)
    lifecycle.dispatchEvent(Object.assign(new Event('storage'), { key: AI_BRIDGE_STORAGE_KEY }))
    lifecycle.dispatchEvent(new Event('online'))
    expect(sockets).toHaveLength(2)
    expect(bridge.snapshot().message).toBeUndefined()
  })

  it('rejects unsafe tool overview text without treating it as a committed session update', async () => {
    const { bridge, sockets, events } = setup()
    const socket = await authenticate(bridge, sockets)
    socket.receive({
      type: 'session.updated',
      sessionId: session.id,
      revision: session.revision,
      session,
      turn: {
        ...turn,
        toolCalls: [{
          callId: 'tool-1',
          name: 'get_document',
          status: 'complete',
          overview: { input: [{ label: '文档', value: 'hidden\u202esuffix' }] },
        }],
      },
    })
    expect(bridge.snapshot().state).toBe('disconnected')
    expect(events.some(event => event.type === 'session.updated')).toBe(false)
  })
})

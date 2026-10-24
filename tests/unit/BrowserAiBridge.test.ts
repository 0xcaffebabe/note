import { afterEach, describe, expect, it, vi } from 'vitest'
import { AI_BRIDGE_STORAGE_KEY, BrowserAiBridge } from '@/adapters/browser/BrowserAiBridge'
import type { AiBridgeEvent, AiChatInput, AiProvider, AiToolDefinition } from '@/core/ports/AiBridgePort'
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
  receive(frame: object) { this.onmessage?.({ data: JSON.stringify({ v: 1, ...frame }) }) }
}

const input: AiChatInput = { providerId: 'local', model: 'test', messages: [{ role: 'user', content: '问题' }], context: { documents: [] } }
const provider: AiProvider = { id: 'local', name: 'Local', protocol: 'responses', model: 'test', efforts: ['default', 'low', 'medium', 'high'] }
const documentTool: AiToolDefinition = { name: 'get_toc', description: 'Read a document table of contents', inputSchema: { type: 'object', properties: { docId: { type: 'string' } }, required: ['docId'], additionalProperties: false } }
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
  socket.receive({ type: 'auth.ok', token: 'memory-only-token', providers: [provider], connectionId: 'c' })
  await pair
  return socket
}
afterEach(() => { clients.splice(0).forEach(client => client.dispose()); vi.useRealTimers() })

describe('BrowserAiBridge', () => {
  it('只连接 loopback，配对码认证成功后发送，所有帧带协议版本', async () => {
    const { bridge, sockets, urls, events } = setup()
    await expect(bridge.pair('123456', 80)).rejects.toThrow('端口')
    expect(() => bridge.start(input)).toThrow('连接')
    const socket = await authenticate(bridge, sockets)
    expect(urls).toEqual(['ws://127.0.0.1:19661/ws'])
    expect(socket.sent[0]).toEqual({ v: 1, type: 'pair', code: '123456' })
    expect(events).toContainEqual({ type: 'state', state: 'ready' })
    bridge.start(input)
    expect(socket.sent[1]).toMatchObject({ v: 1, type: 'chat.start', requestId: 'request-1' })
    expect(JSON.stringify(socket.sent)).not.toContain('memory-only-token')
  })

  it('过滤乱序、重复和终态之后的帧，限制单连接请求', async () => {
    const { bridge, sockets, events } = setup()
    const socket = await authenticate(bridge, sockets)
    const requestId = bridge.start(input)
    expect(() => bridge.start(input)).toThrow('等待')
    socket.receive({ type: 'chat.delta', requestId, seq: 1, delta: 'first' })
    socket.receive({ type: 'chat.delta', requestId, seq: 1, delta: 'duplicate' })
    socket.receive({ type: 'chat.delta', requestId: 'unknown', seq: 2, delta: 'wrong' })
    socket.receive({ type: 'chat.done', requestId, seq: 2, finishReason: 'stop' })
    socket.receive({ type: 'chat.delta', requestId, seq: 3, delta: 'late' })
    expect(events.filter(event => event.type === 'delta')).toEqual([{ type: 'delta', requestId, delta: 'first' }])
    expect(events.filter(event => event.type === 'done')).toHaveLength(1)
  })

  it('取消立即停止 UI 流，旧请求不能污染新请求', async () => {
    const { bridge, sockets, events } = setup()
    const socket = await authenticate(bridge, sockets)
    const previous = bridge.start(input)
    bridge.cancel()
    const next = bridge.start(input)
    socket.receive({ type: 'chat.delta', requestId: previous, seq: 100, delta: 'stale' })
    socket.receive({ type: 'chat.delta', requestId: next, seq: 0, delta: 'new' })
    expect(socket.sent).toContainEqual({ v: 1, type: 'chat.cancel', requestId: previous })
    expect(events.filter(event => event.type === 'delta')).toEqual([{ type: 'delta', requestId: next, delta: 'new' }])
  })

  it('断线结束请求；手动配对替代重试，旧连接回调不会影响新连接', async () => {
    const { bridge, sockets, events } = setup()
    const socket = await authenticate(bridge, sockets)
    const stale = socket.onmessage!
    const requestId = bridge.start(input)
    socket.onclose?.()
    expect(events).toContainEqual(expect.objectContaining({ type: 'error', requestId }))
    expect(sockets).toHaveLength(1)
    expect(() => bridge.start(input)).toThrow('连接')
    await authenticate(bridge, sockets)
    stale({ data: JSON.stringify({ v: 1, type: 'error', message: 'old connection' }) })
    expect(() => bridge.start(input)).not.toThrow()
  })

  it('配对和生成都有超时，不会无限等待', async () => {
    vi.useFakeTimers()
    const { bridge, sockets, events } = setup()
    const rejected = expect(bridge.pair('123456')).rejects.toThrow('超时')
    vi.advanceTimersByTime(15001)
    await rejected
    const socket = await authenticate(bridge, sockets)
    const requestId = bridge.start(input)
    for (let i = 0; i < 4; i++) { vi.advanceTimersByTime(24000); socket.receive({ type: 'pong' }) }
    expect(socket.sent).toContainEqual({ v: 1, type: 'chat.cancel', requestId })
    expect(events).toContainEqual(expect.objectContaining({ type: 'error', requestId, message: expect.stringContaining('超时') }))
  })

  it('拒绝协议版本不匹配和过大输入', async () => {
    const { bridge, sockets } = setup()
    const rejected = expect(bridge.pair('123456')).rejects.toThrow('无效数据')
    sockets[0].receive({ v: 2, type: 'auth.ok' })
    await rejected
    await authenticate(bridge, sockets)
    expect(() => bridge.start({ ...input, messages: [{ role: 'user', content: 'x'.repeat(100001) }] })).toThrow('过长')
  })

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
    expect(refreshed.sockets[0].sent).toEqual([{ v: 1, type: 'auth', token: 'memory-only-token' }])
    refreshed.sockets[0].receive({ type: 'auth.ok', token: 'memory-only-token', providers: [provider], connectionId: 'new' })
    expect(refreshed.bridge.snapshot()).toMatchObject({ state: 'ready', remembered: true, providers: [provider] })
    expect(JSON.stringify(refreshed.bridge.snapshot())).not.toContain('memory-only-token')
  })

  it('断线按退避只重连认证，不重发任何生成请求', async () => {
    vi.useFakeTimers()
    const { bridge, sockets, events } = setup()
    const first = await authenticate(bridge, sockets)
    const requestId = bridge.start(input)
    first.onclose?.()
    expect(bridge.snapshot().state).toBe('disconnected')
    expect(events).toContainEqual(expect.objectContaining({ type: 'error', requestId }))
    vi.advanceTimersByTime(999)
    expect(sockets).toHaveLength(1)
    vi.advanceTimersByTime(1)
    sockets[1].open()
    expect(sockets[1].sent).toEqual([{ v: 1, type: 'auth', token: 'memory-only-token' }])
    sockets[1].onclose?.()
    vi.advanceTimersByTime(1999)
    expect(sockets).toHaveLength(2)
    vi.advanceTimersByTime(1)
    sockets[2].open()
    sockets[2].receive({ type: 'auth.ok', token: 'memory-only-token', providers: [provider] })
    expect(bridge.snapshot().state).toBe('ready')
    expect(sockets.flatMap(socket => socket.sent).filter(frame => frame.type === 'chat.start')).toHaveLength(1)
  })

  it('撤销凭证后清除本地记忆并停止自动尝试', async () => {
    vi.useFakeTimers()
    const { bridge, sockets, storage } = setup()
    const socket = await authenticate(bridge, sockets)
    socket.onclose?.()
    vi.advanceTimersByTime(1000)
    sockets[1].open()
    sockets[1].receive({ type: 'error', code: 'auth_failed', message: '授权已撤销，请重新配对' })
    expect(storage.getItem(AI_BRIDGE_STORAGE_KEY)).toBeNull()
    expect(bridge.snapshot()).toMatchObject({ state: 'disconnected', remembered: false })
    vi.advanceTimersByTime(120000)
    expect(sockets).toHaveLength(2)
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
    sockets[1].receive({ type: 'auth.ok', token: 'memory-only-token', providers: [provider] })
    await reconnect
    bridge.forget()
    expect(sockets[1].sent).toContainEqual({ v: 1, type: 'auth.forget' })
    expect(storage.getItem(AI_BRIDGE_STORAGE_KEY)).toBeNull()
    const refreshed = setup(storage)
    refreshed.bridge.initialize()
    expect(refreshed.sockets).toHaveLength(0)
  })

  it('组件只能取消自己拥有的请求，卸载订阅不会断开共享连接', async () => {
    const { bridge, sockets, events } = setup()
    const socket = await authenticate(bridge, sockets)
    const requestId = bridge.start(input)
    const unsubscribe = bridge.subscribe(() => {})
    unsubscribe()
    bridge.cancel('another-panel-request')
    bridge.cancel('')
    expect(socket.sent.filter(frame => frame.type === 'chat.cancel')).toHaveLength(0)
    expect(bridge.snapshot().state).toBe('ready')
    bridge.cancel(requestId)
    expect(events).toContainEqual({ type: 'done', requestId, cancelled: true })
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

  it('其他标签页删除记忆时取消当前请求且不再重连', async () => {
    vi.useFakeTimers()
    const lifecycle = new EventTarget()
    const { bridge, sockets, storage } = setup(new MemoryStorage(), lifecycle)
    await authenticate(bridge, sockets)
    bridge.start(input)
    storage.removeItem(AI_BRIDGE_STORAGE_KEY)
    const event = new Event('storage')
    Object.defineProperty(event, 'key', { value: AI_BRIDGE_STORAGE_KEY })
    lifecycle.dispatchEvent(event)
    expect(bridge.snapshot()).toMatchObject({ state: 'disconnected', remembered: false })
    vi.advanceTimersByTime(120000)
    expect(sockets).toHaveLength(1)
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
    other.sockets[0].receive({ type: 'auth.ok', token: 'memory-only-token', providers: [provider] })
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
    first.sockets[1].receive({ type: 'auth.ok', token: 'new-remembered-token', providers: [provider] })
    await pair
    other.sockets[0].receive({ type: 'error', code: 'auth_failed', message: 'old token revoked' })
    expect(JSON.parse(first.storage.getItem(AI_BRIDGE_STORAGE_KEY)!).token).toBe('new-remembered-token')
    expect(other.sockets).toHaveLength(2)
    other.sockets[1].open()
    expect(other.sockets[1].sent).toEqual([{ v: 1, type: 'auth', token: 'new-remembered-token' }])
    other.sockets[1].receive({ type: 'auth.ok', token: 'new-remembered-token', providers: [provider] })
    expect(other.bridge.snapshot().state).toBe('ready')
    expect(first.bridge.snapshot().state).toBe('ready')
  })

  it('传递effort与函数定义，执行已注册文档工具并回传结果和来源', async () => {
    const { bridge, sockets, events } = setup()
    const result = { data: { headings: ['章节'] }, sources: [{ sourceId: 'D123S1', title: '来源', url: '/doc.html?headingId=one' }] }
    const execute = vi.fn(async () => result)
    bridge.configureTools([documentTool], execute)
    const socket = await authenticate(bridge, sockets)
    const requestId = bridge.start({ ...input, effort: 'high' })
    expect(socket.sent[1]).toMatchObject({ tools: [documentTool], effort: 'high' })
    socket.receive({ type: 'tool.call', requestId, seq: 1, callId: 'call-1', name: 'get_toc', arguments: { docId: 'doc' } })
    await vi.waitFor(() => expect(socket.sent).toContainEqual({ v: 1, type: 'tool.result', requestId, callId: 'call-1', result, isError: false }))
    expect(execute).toHaveBeenCalledWith('get_toc', { docId: 'doc' }, expect.any(AbortSignal))
    expect(events).toContainEqual({ type: 'tool', requestId, callId: 'call-1', name: 'get_toc', status: 'complete', sources: result.sources })
    socket.receive({ type: 'chat.delta', requestId, seq: 2, delta: '基于文档的回答' })
    socket.receive({ type: 'chat.done', requestId, seq: 3, finishReason: 'stop' })
    expect(events).toContainEqual({ type: 'delta', requestId, delta: '基于文档的回答' })
  })

  it('工具只响应当前请求且不重复执行；未知函数不能调用本地执行器', async () => {
    const { bridge, sockets } = setup()
    const execute = vi.fn(async () => ({ data: 'ok' }))
    bridge.configureTools([documentTool], execute)
    const socket = await authenticate(bridge, sockets)
    const requestId = bridge.start(input)
    socket.receive({ type: 'tool.call', requestId: 'another', seq: 1, callId: 'bad', name: 'get_toc', arguments: {} })
    const call = { type: 'tool.call', requestId, seq: 1, callId: 'call-1', name: 'get_toc', arguments: { docId: 'doc' } }
    socket.receive(call)
    socket.receive(call)
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(1))
    socket.receive({ type: 'tool.call', requestId, seq: 2, callId: 'call-2', name: 'run_shell', arguments: {} })
    await vi.waitFor(() => expect(socket.sent).toContainEqual(expect.objectContaining({ type: 'tool.result', callId: 'call-2', isError: true })))
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('取消/断线中止工具，迟到的工具结果不能进入新问题', async () => {
    const { bridge, sockets } = setup()
    let signal: AbortSignal | undefined
    let finish!: (value: { data: string }) => void
    bridge.configureTools([documentTool], async (_name, _args, abort) => { signal = abort; return new Promise(resolve => { finish = resolve }) })
    const socket = await authenticate(bridge, sockets)
    const requestId = bridge.start(input)
    socket.receive({ type: 'tool.call', requestId, seq: 1, callId: 'call-1', name: 'get_toc', arguments: { docId: 'doc' } })
    bridge.cancel(requestId)
    expect(signal?.aborted).toBe(true)
    bridge.start(input)
    finish({ data: 'late private document' })
    await Promise.resolve(); await Promise.resolve()
    expect(socket.sent.filter(frame => frame.type === 'tool.result')).toHaveLength(0)
  })

  it('工具等待超时和过大结果安全返回错误而不是无限等待或发送超大正文', async () => {
    vi.useFakeTimers()
    const { bridge, sockets, events } = setup()
    bridge.configureTools([documentTool], async () => new Promise(() => {}))
    const socket = await authenticate(bridge, sockets)
    const requestId = bridge.start(input)
    socket.receive({ type: 'tool.call', requestId, seq: 1, callId: 'timeout', name: 'get_toc', arguments: {} })
    await vi.advanceTimersByTimeAsync(25001)
    expect(socket.sent).toContainEqual(expect.objectContaining({ type: 'tool.result', callId: 'timeout', isError: true }))
    expect(events).toContainEqual(expect.objectContaining({ type: 'tool', status: 'error', message: expect.stringContaining('超时') }))
    bridge.cancel()
    bridge.configureTools([documentTool], async () => ({ data: '字'.repeat(65000) }))
    const secondId = bridge.start(input)
    socket.receive({ type: 'tool.call', requestId: secondId, seq: 1, callId: 'large', name: 'get_toc', arguments: {} })
    await vi.advanceTimersByTimeAsync(0)
    expect(socket.sent).toContainEqual(expect.objectContaining({ type: 'tool.result', callId: 'large', isError: true }))
    expect(JSON.stringify(socket.sent)).not.toContain('字'.repeat(100))
  })
})

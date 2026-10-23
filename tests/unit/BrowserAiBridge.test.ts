import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrowserAiBridge } from '@/adapters/browser/BrowserAiBridge'
import type { AiBridgeEvent, AiChatInput } from '@/core/ports/AiBridgePort'

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
const provider = { id: 'local', name: 'Local', protocol: 'responses', model: 'test' }
const clients: BrowserAiBridge[] = []
function setup() {
  const sockets: Socket[] = []
  const urls: string[] = []
  let next = 0
  const bridge = new BrowserAiBridge(url => {
    urls.push(url)
    const socket = new Socket()
    sockets.push(socket)
    return socket as unknown as WebSocket
  }, () => `request-${++next}`)
  clients.push(bridge)
  const events: AiBridgeEvent[] = []
  bridge.subscribe(event => events.push(event))
  return { bridge, sockets, events, urls }
}
async function authenticate(bridge: BrowserAiBridge, sockets: Socket[]) {
  const pair = bridge.pair('123456')
  const socket = sockets[sockets.length - 1]
  socket.open()
  socket.receive({ type: 'pair.pending', pairingId: 'p' })
  socket.receive({ type: 'auth.ok', token: 'memory-only-token', providers: [provider], connectionId: 'c' })
  await pair
  return socket
}
afterEach(() => { clients.splice(0).forEach(client => client.disconnect()); vi.useRealTimers() })

describe('BrowserAiBridge', () => {
  it('只连接 loopback，必须经配对确认后发送，所有帧带协议版本', async () => {
    const { bridge, sockets, urls, events } = setup()
    await expect(bridge.pair('123456', 80)).rejects.toThrow('端口')
    expect(() => bridge.start(input)).toThrow('连接')
    const socket = await authenticate(bridge, sockets)
    expect(urls).toEqual(['ws://127.0.0.1:19661/ws'])
    expect(socket.sent[0]).toEqual({ v: 1, type: 'pair', code: '123456' })
    expect(events).toContainEqual({ type: 'state', state: 'pending' })
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

  it('断线结束请求且不重连、不重发；旧连接回调不会影响新连接', async () => {
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
    vi.advanceTimersByTime(60001)
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
})

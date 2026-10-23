import type { AiBridgeEvent, AiBridgePort, AiChatInput, AiProvider } from '@/core/ports/AiBridgePort'

type SocketFactory = (url: string) => WebSocket

/** Loopback-only v1 client. No storage, background reconnect, or implicit request retries. */
export class BrowserAiBridge implements AiBridgePort {
  private socket?: WebSocket
  private listeners = new Set<(event: AiBridgeEvent) => void>()
  private ready = false
  private token = ''
  private active?: { id: string; seq: number }
  private pendingReject?: (error: Error) => void
  private pairTimer?: ReturnType<typeof setTimeout>
  private responseTimer?: ReturnType<typeof setTimeout>
  private heartbeat?: ReturnType<typeof setInterval>
  private awaitingPong = false

  constructor(private readonly createSocket: SocketFactory = url => new WebSocket(url),
    private readonly requestId: () => string = () => crypto.randomUUID()) {}

  subscribe(listener: (event: AiBridgeEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: AiBridgeEvent) { this.listeners.forEach(listener => listener(event)) }

  pair(code: string, port = 19661): Promise<AiProvider[]> {
    if (!Number.isInteger(port) || port < 1024 || port > 65535) return Promise.reject(new Error('端口须为 1024–65535'))
    if (!/^\d{6}$/.test(code)) return Promise.reject(new Error('请输入桌面端显示的 6 位配对码'))
    this.disconnect()
    this.emit({ type: 'state', state: 'connecting' })
    return new Promise((resolve, reject) => {
      this.pendingReject = reject
      let socket: WebSocket
      try {
        socket = this.createSocket(`ws://127.0.0.1:${port}/ws`)
      } catch {
        this.failConnection('浏览器无法访问本地桥接，请检查本地网络权限与桌面端状态')
        return
      }
      this.socket = socket
      const current = () => this.socket === socket
      this.pairTimer = setTimeout(() => this.failConnection('配对超时，请重新获取配对码并在桌面端确认'), 60000)
      socket.onopen = () => {
        if (!current()) return
        try { this.send({ type: 'pair', code }) }
        catch { this.failConnection('连接已断开，请重新配对') }
      }
      socket.onerror = () => { if (current()) this.failConnection('连接失败，请启动 Note Bridge 并检查本地网络权限、端口或浏览器限制') }
      socket.onclose = () => { if (current()) this.failConnection('连接已断开；请重新配对，问题不会自动重发') }
      socket.onmessage = event => {
        if (!current()) return
        try {
          if (typeof event.data !== 'string' || event.data.length > 1000000) throw new Error('invalid frame')
          const frame: Record<string, unknown> = JSON.parse(event.data)
          if (frame.v !== 1 || typeof frame.type !== 'string') throw new Error('invalid protocol')
          if (frame.type === 'pair.pending' && !this.ready) this.emit({ type: 'state', state: 'pending' })
          else if (frame.type === 'auth.ok' && !this.ready) {
            if (typeof frame.token !== 'string' || !frame.token || !Array.isArray(frame.providers)
              || !frame.providers.every(provider => provider && ['id', 'name', 'protocol', 'model'].every(key => typeof provider[key] === 'string'))) {
              throw new Error('invalid auth')
            }
            clearTimeout(this.pairTimer)
            this.pendingReject = undefined
            this.token = frame.token
            this.ready = true
            this.heartbeat = setInterval(() => {
              if (this.awaitingPong) { this.failConnection('连接心跳超时，请重新配对'); return }
              this.awaitingPong = true
              try { this.send({ type: 'ping' }) }
              catch { this.failConnection('连接已断开，请重新配对') }
            }, 25000)
            this.emit({ type: 'state', state: 'ready' })
            resolve(frame.providers as AiProvider[])
          } else if (frame.type === 'pong') this.awaitingPong = false
          else if (frame.type === 'error') this.failConnection(typeof frame.message === 'string' ? frame.message : '桥接请求失败')
          else if (frame.type.startsWith('chat.')) this.receiveChat(frame)
        } catch {
          this.failConnection('桥接返回了无效数据，请检查客户端版本')
        }
      }
    })
  }

  private receiveChat(frame: Record<string, unknown>) {
    const active = this.active
    if (!active || frame.requestId !== active.id) return
    if (!Number.isInteger(frame.seq) || (frame.seq as number) <= active.seq) return
    active.seq = frame.seq as number
    if (frame.type === 'chat.delta' && typeof frame.delta === 'string') {
      this.armResponseTimeout()
      this.emit({ type: 'delta', requestId: active.id, delta: frame.delta })
    } else if (frame.type === 'chat.done' && (frame.finishReason === 'stop' || frame.finishReason === 'cancelled')) {
      this.active = undefined
      clearTimeout(this.responseTimer)
      this.emit({ type: 'done', requestId: active.id, cancelled: frame.finishReason === 'cancelled' })
    } else if (frame.type === 'chat.error' && typeof frame.message === 'string') {
      this.active = undefined
      clearTimeout(this.responseTimer)
      this.emit({ type: 'error', requestId: active.id, message: frame.message })
    } else throw new Error('invalid stream')
  }

  start(input: AiChatInput): string {
    if (!this.ready || !this.token) throw new Error('请先连接 Note Bridge')
    if (this.active) throw new Error('请等待当前回答结束或停止生成')
    if (JSON.stringify({ messages: input.messages, context: input.context }).length > 100000) throw new Error('问题与上下文过长，请减少内容')
    const requestId = this.requestId()
    this.active = { id: requestId, seq: -1 }
    try { this.send({ type: 'chat.start', requestId, ...input }) }
    catch (error) { this.active = undefined; throw error }
    this.armResponseTimeout()
    return requestId
  }

  private armResponseTimeout() {
    clearTimeout(this.responseTimer)
    this.responseTimer = setTimeout(() => {
      const id = this.active?.id
      this.active = undefined
      if (id && this.socket?.readyState === 1) {
        try { this.send({ type: 'chat.cancel', requestId: id }) }
        catch { this.failConnection('连接已断开，请重新配对') }
      }
      if (id) this.emit({ type: 'error', requestId: id, message: '回答超时，已停止；你可以手动重新发送' })
    }, 90000)
  }

  cancel() {
    const active = this.active
    this.active = undefined
    clearTimeout(this.responseTimer)
    if (active && this.socket?.readyState === 1) {
      try { this.send({ type: 'chat.cancel', requestId: active.id }) }
      catch { this.failConnection('连接已断开，请重新配对') }
    }
    if (active) this.emit({ type: 'done', requestId: active.id, cancelled: true })
  }

  private send(frame: Record<string, unknown>) {
    if (this.socket?.readyState !== 1) throw new Error('连接已断开，请重新配对')
    this.socket.send(JSON.stringify({ v: 1, ...frame }))
  }

  private failConnection(message: string) {
    const id = this.active?.id
    this.pendingReject?.(new Error(message))
    this.pendingReject = undefined
    this.teardown()
    if (id) this.emit({ type: 'error', requestId: id, message })
    this.emit({ type: 'state', state: 'disconnected', message })
  }

  private teardown() {
    clearTimeout(this.pairTimer)
    clearTimeout(this.responseTimer)
    clearInterval(this.heartbeat)
    const socket = this.socket
    this.socket = undefined
    this.active = undefined
    this.ready = false
    this.token = ''
    this.awaitingPong = false
    if (socket) { socket.onclose = null; socket.onerror = null; socket.onmessage = null; socket.onopen = null; socket.close() }
  }

  disconnect() {
    this.cancel()
    this.pendingReject?.(new Error('配对已取消'))
    this.pendingReject = undefined
    this.teardown()
    this.emit({ type: 'state', state: 'disconnected' })
  }
}

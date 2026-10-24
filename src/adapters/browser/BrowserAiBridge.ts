import type { AiBridgeEvent, AiBridgePort, AiBridgeSnapshot, AiBridgeState, AiChatInput, AiProvider } from '@/core/ports/AiBridgePort'
import type { StoragePort } from '@/core/ports/StoragePort'
import { browserStorage } from './LocalStorageAdapter'

type SocketFactory = (url: string) => WebSocket
interface SavedConnection { version: 1; port: number; token: string }
export const AI_BRIDGE_STORAGE_KEY = 'note:ai-bridge:v1'

/** One socket per page; reconnect only authenticates, never replays a generation. */
export class BrowserAiBridge implements AiBridgePort {
  private socket?: WebSocket
  private listeners = new Set<(event: AiBridgeEvent) => void>()
  private state: AiBridgeState = 'disconnected'
  private providers: AiProvider[] = []
  private message?: string
  private port = 19661
  private credential?: SavedConnection
  private remembered = false
  private initialized = false
  private paused = false
  private retryEnabled = false
  private retryAttempt = 0
  private active?: { id: string; seq: number }
  private pendingReject?: (error: Error) => void
  private pairTimer?: ReturnType<typeof setTimeout>
  private responseTimer?: ReturnType<typeof setTimeout>
  private heartbeat?: ReturnType<typeof setInterval>
  private retryTimer?: ReturnType<typeof setTimeout>
  private awaitingPong = false

  constructor(private readonly createSocket: SocketFactory = url => new WebSocket(url),
    private readonly requestId: () => string = () => crypto.randomUUID(),
    private readonly storage: StoragePort = browserStorage,
    private readonly lifecycle: Pick<Window, 'addEventListener' | 'removeEventListener'> | undefined = typeof window === 'undefined' ? undefined : window) {}

  snapshot(): AiBridgeSnapshot {
    return { state: this.state, providers: this.providers.map(provider => ({ ...provider })),
      remembered: this.remembered, port: this.port, ...(this.message ? { message: this.message } : {}) }
  }

  subscribe(listener: (event: AiBridgeEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: AiBridgeEvent) { this.listeners.forEach(listener => listener(event)) }

  private setState(state: AiBridgeState, message?: string) {
    this.state = state
    this.message = message
    this.emit({ type: 'state', state, ...(message ? { message } : {}) })
  }

  private attachLifecycle() {
    if (this.initialized) return false
    this.initialized = true
    this.lifecycle?.addEventListener('storage', this.onStorage)
    this.lifecycle?.addEventListener('online', this.onOnline)
    return true
  }

  initialize() {
    if (!this.attachLifecycle()) return
    this.credential = this.readSaved()
    this.remembered = !!this.credential
    if (this.credential) {
      this.port = this.credential.port
      void this.reconnect().catch(() => {})
    }
  }

  private readonly onOnline = () => {
    if (!this.paused && this.retryEnabled && this.credential && this.state === 'disconnected') void this.reconnect().catch(() => {})
  }

  private readonly onStorage = (event: Event) => {
    const key = (event as StorageEvent).key
    if (key !== AI_BRIDGE_STORAGE_KEY && key !== null) return
    const saved = this.readSaved()
    if (saved?.token === this.credential?.token && saved?.port === this.credential?.port) return
    this.adoptSaved(saved)
  }

  private sameCredential(left: SavedConnection | undefined, right: SavedConnection | undefined) {
    return left?.token === right?.token && left?.port === right?.port
  }

  private adoptSaved(saved: SavedConnection | undefined) {
    this.disconnect()
    this.credential = saved
    this.remembered = !!saved
    if (saved) {
      this.port = saved.port
      void this.reconnect().catch(() => {})
    } else this.setState('disconnected', '已在其他页面忘记连接')
  }

  private readSaved(): SavedConnection | undefined {
    try {
      const raw = this.storage.getItem(AI_BRIDGE_STORAGE_KEY)
      if (!raw) return
      if (raw.length > 2048) throw new Error('oversized credential')
      const saved = JSON.parse(raw)
      if (saved?.version === 1 && Number.isInteger(saved.port) && saved.port >= 1024 && saved.port <= 65535 && this.validToken(saved.token)) {
        return { version: 1, port: saved.port, token: saved.token }
      }
      this.storage.removeItem(AI_BRIDGE_STORAGE_KEY)
    } catch { /* Corrupt/unavailable storage must never select an arbitrary destination. */ }
  }

  private validToken(token: unknown): token is string {
    return typeof token === 'string' && token.length >= 16 && token.length <= 512 && /^[A-Za-z0-9._~-]+$/.test(token)
  }

  private saveCredential(token: string): boolean {
    this.credential = { version: 1, port: this.port, token }
    try {
      const serialized = JSON.stringify(this.credential)
      this.storage.setItem(AI_BRIDGE_STORAGE_KEY, serialized)
      this.remembered = this.storage.getItem(AI_BRIDGE_STORAGE_KEY) === serialized
    } catch { this.remembered = false }
    return this.remembered
  }

  private clearCredential(expected?: SavedConnection) {
    this.credential = undefined
    this.remembered = false
    // An older authentication response must not erase a newer pairing from another tab.
    try {
      if (!expected || this.sameCredential(this.readSaved(), expected)) this.storage.removeItem(AI_BRIDGE_STORAGE_KEY)
    } catch { /* Revoked grants remain invalid even if browser storage cannot be cleared. */ }
  }

  pair(code: string, port = 19661): Promise<AiProvider[]> {
    if (!Number.isInteger(port) || port < 1024 || port > 65535) return Promise.reject(new Error('端口须为 1024–65535'))
    if (!/^\d{6}$/.test(code)) return Promise.reject(new Error('请输入桌面端显示的 6 位配对码'))
    this.attachLifecycle()
    this.paused = false
    this.retryEnabled = false
    this.retryAttempt = 0
    this.port = port
    return this.connect({ type: 'pair', code })
  }

  reconnect(): Promise<AiProvider[]> {
    this.attachLifecycle()
    this.credential ??= this.readSaved()
    if (!this.credential) return Promise.reject(new Error('尚未保存连接，请先配对 Note Bridge'))
    this.paused = false
    this.retryEnabled = true
    this.port = this.credential.port
    return this.connect({ type: 'auth', token: this.credential.token })
  }

  private connect(firstFrame: Record<string, unknown>): Promise<AiProvider[]> {
    const authenticating: SavedConnection | undefined = firstFrame.type === 'auth'
      ? { version: 1, port: this.port, token: firstFrame.token as string } : undefined
    const wasRemembered = this.remembered
    clearTimeout(this.retryTimer)
    this.retryTimer = undefined
    this.cancel()
    this.pendingReject?.(new Error('连接已替换'))
    this.pendingReject = undefined
    this.teardownSocket()
    // Context preparation in an open question panel must also be invalidated.
    this.setState('disconnected')
    this.setState('connecting')
    return new Promise((resolve, reject) => {
      this.pendingReject = reject
      let socket: WebSocket
      try { socket = this.createSocket(`ws://127.0.0.1:${this.port}/ws`) }
      catch { this.failConnection('浏览器无法访问本地桥接，请检查本地网络权限与桌面端状态'); return }
      this.socket = socket
      const current = () => this.socket === socket
      this.pairTimer = setTimeout(() => this.failConnection(firstFrame.type === 'pair'
        ? '配对超时，请检查配对码和桌面端状态' : '连接认证超时，稍后自动重试'), firstFrame.type === 'pair' ? 15000 : 12000)
      socket.onopen = () => {
        if (!current()) return
        try { this.send(firstFrame) }
        catch { this.failConnection('连接已断开，稍后自动重试') }
      }
      socket.onerror = () => { if (current()) this.failConnection('连接失败，请检查 Note Bridge、端口或本地网络权限') }
      socket.onclose = () => { if (current()) this.failConnection('连接已断开，稍后自动重连；问题不会自动重发') }
      socket.onmessage = event => {
        if (!current()) return
        try {
          if (typeof event.data !== 'string' || event.data.length > 1000000) throw new Error('invalid frame')
          const frame: Record<string, unknown> = JSON.parse(event.data)
          if (frame.v !== 1 || typeof frame.type !== 'string') throw new Error('invalid protocol')
          if (frame.type === 'auth.ok' && this.state !== 'ready') {
            if (!this.validToken(frame.token) || !Array.isArray(frame.providers) || frame.providers.length > 200
              || !frame.providers.every(provider => provider && ['id', 'name', 'protocol', 'model'].every(key => typeof provider[key] === 'string'))) throw new Error('invalid auth')
            if (authenticating) {
              if (frame.token !== authenticating.token) throw new Error('unexpected token rotation')
              const saved = this.readSaved()
              // storage events are asynchronous; observe deletion/replacement before
              // accepting an in-flight response, without resurrecting an old grant.
              if ((wasRemembered || saved) && !this.sameCredential(saved, authenticating)) {
                this.adoptSaved(saved)
                return
              }
              this.credential = authenticating
              this.remembered = this.sameCredential(saved, authenticating)
            }
            clearTimeout(this.pairTimer)
            this.pendingReject = undefined
            this.providers = frame.providers as AiProvider[]
            const saved = authenticating ? this.remembered : this.saveCredential(frame.token)
            this.retryAttempt = 0
            this.retryEnabled = true
            this.heartbeat = setInterval(() => {
              if (this.awaitingPong) { this.failConnection('连接心跳超时，稍后自动重连'); return }
              this.awaitingPong = true
              try { this.send({ type: 'ping' }) }
              catch { this.failConnection('连接已断开，稍后自动重连') }
            }, 25000)
            this.setState('ready', saved ? undefined : '已连接，但浏览器无法保存凭证；刷新后需要重新配对')
            resolve(this.providers.map(provider => ({ ...provider })))
          } else if (frame.type === 'pong') this.awaitingPong = false
          else if (frame.type === 'error') {
            if (frame.code === 'auth_failed' && authenticating) {
              const saved = this.readSaved()
              if (saved && !this.sameCredential(saved, authenticating)) {
                this.adoptSaved(saved)
                return
              }
              this.clearCredential(authenticating)
            }
            this.retryEnabled = false
            this.failConnection(typeof frame.message === 'string' ? frame.message : '桥接请求失败')
          } else if (frame.type.startsWith('chat.')) this.receiveChat(frame)
        } catch {
          this.retryEnabled = false
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
    if (this.state !== 'ready' || !this.credential) throw new Error('请先连接 Note Bridge')
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
        catch { this.failConnection('连接已断开，稍后自动重连') }
      }
      if (id) this.emit({ type: 'error', requestId: id, message: '回答超时，已停止；你可以手动重新发送' })
    }, 90000)
  }

  cancel(requestId?: string) {
    const active = this.active
    if (requestId !== undefined && requestId !== active?.id) return
    this.active = undefined
    clearTimeout(this.responseTimer)
    if (active && this.socket?.readyState === 1) {
      try { this.send({ type: 'chat.cancel', requestId: active.id }) }
      catch { this.failConnection('连接已断开，稍后自动重连') }
    }
    if (active) this.emit({ type: 'done', requestId: active.id, cancelled: true })
  }

  private send(frame: Record<string, unknown>) {
    if (this.socket?.readyState !== 1) throw new Error('连接已断开')
    this.socket.send(JSON.stringify({ v: 1, ...frame }))
  }

  private failConnection(message: string) {
    const id = this.active?.id
    this.pendingReject?.(new Error(message))
    this.pendingReject = undefined
    this.teardownSocket()
    if (id) this.emit({ type: 'error', requestId: id, message })
    this.setState('disconnected', message)
    if (!this.paused && this.retryEnabled && this.credential && !this.retryTimer) {
      const delay = Math.min(30000, 1000 * 2 ** Math.min(this.retryAttempt++, 5))
      this.retryTimer = setTimeout(() => { this.retryTimer = undefined; void this.reconnect().catch(() => {}) }, delay)
    }
  }

  private teardownSocket() {
    clearTimeout(this.pairTimer)
    clearTimeout(this.responseTimer)
    clearInterval(this.heartbeat)
    const socket = this.socket
    this.socket = undefined
    this.active = undefined
    this.providers = []
    this.awaitingPong = false
    if (socket) { socket.onclose = null; socket.onerror = null; socket.onmessage = null; socket.onopen = null; socket.close() }
  }

  disconnect() {
    this.paused = true
    this.retryEnabled = false
    clearTimeout(this.retryTimer)
    this.retryTimer = undefined
    this.cancel()
    this.pendingReject?.(new Error('连接已取消'))
    this.pendingReject = undefined
    this.teardownSocket()
    this.setState('disconnected')
  }

  forget() {
    this.cancel()
    if (this.state === 'ready') {
      try { this.send({ type: 'auth.forget' }) } catch { /* Offline grants remain revocable in the desktop app. */ }
    }
    this.disconnect()
    this.clearCredential()
    const remains = this.readSaved()
    this.setState('disconnected', remains ? '浏览器未能删除连接凭证，请清理网站存储' : '已忘记此浏览器的连接')
  }

  /** Test/host cleanup; normal component unmounts keep the shared connection alive. */
  dispose() {
    this.disconnect()
    this.lifecycle?.removeEventListener('storage', this.onStorage)
    this.lifecycle?.removeEventListener('online', this.onOnline)
    this.initialized = false
    this.listeners.clear()
  }
}

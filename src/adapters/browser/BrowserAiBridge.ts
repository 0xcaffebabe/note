import { AI_EFFORTS } from '@/core/ports/AiBridgePort'
import { AI_MAX_FRAME_BYTES, AI_MAX_QUESTION_CHARS, resolveAiModelLimits } from '@/core/domain/AiLimits'
import type { AiBridgeEvent, AiBridgePort, AiBridgeSnapshot, AiBridgeState, AiProvider, AiEffort, AiSessionSummary, AiSessionPage, AiTurnPage, AiModelSelection, AiMessageInput, AiDocumentMetadata } from '@/core/ports/AiBridgePort'
import { readSession, readTurn, readSessionPage, readTurnPage, readDocumentMetadata, isRecord } from './AiBridgeProtocol'
import type { StoragePort } from '@/core/ports/StoragePort'
import { browserStorage } from './LocalStorageAdapter'

type SocketFactory = (url: string) => WebSocket
interface SavedConnection { version: 1; port: number; token: string }
export const AI_BRIDGE_STORAGE_KEY = 'note:ai-bridge:v1'
interface PendingRpc {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export class AiBridgeRpcError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'AiBridgeRpcError' }
}

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
  private pending = new Map<string, PendingRpc>()
  private pendingReject?: (error: Error) => void
  private pairTimer?: ReturnType<typeof setTimeout>
  private heartbeat?: ReturnType<typeof setInterval>
  private retryTimer?: ReturnType<typeof setTimeout>
  private awaitingPong = false

  constructor(private readonly createSocket: SocketFactory = url => new WebSocket(url),
    private readonly requestId: () => string = () => crypto.randomUUID(),
    private readonly storage: StoragePort = browserStorage,
    private readonly lifecycle: Pick<Window, 'addEventListener' | 'removeEventListener'> | undefined = typeof window === 'undefined' ? undefined : window) {}

  snapshot(): AiBridgeSnapshot {
    return { state: this.state, providers: this.copyProviders(),
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
    this.pendingReject?.(new Error('连接已替换'))
    this.pendingReject = undefined
    this.teardownSocket()
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
          if (typeof event.data !== 'string' || event.data.length > AI_MAX_FRAME_BYTES || new TextEncoder().encode(event.data).length > AI_MAX_FRAME_BYTES) throw new Error('invalid frame')
          const frame: Record<string, unknown> = JSON.parse(event.data)
          if (frame.v === 1) {
            this.retryEnabled = false
            this.failConnection('Note Bridge 版本过旧，请升级桌面端以使用持久化知识助手')
            return
          }
          if (frame.v !== 2 || typeof frame.type !== 'string') throw new Error('invalid protocol')
          if (frame.type === 'auth.ok' && this.state !== 'ready') {
            if (!this.validToken(frame.token)) throw new Error('invalid auth')
            if (!Array.isArray(frame.capabilities) || !frame.capabilities.includes('persistent_sessions') || !frame.capabilities.includes('knowledge_tools')) {
              this.retryEnabled = false
              this.failConnection('Note Bridge 不支持持久化知识助手，请升级桌面端')
              return
            }
            const providers = this.readProviders(frame.providers)
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
            this.providers = providers
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
            resolve(this.copyProviders())
          } else if (frame.type === 'providers.updated') {
            if (this.state !== 'ready') throw new Error('unauthenticated providers')
            this.providers = this.readProviders(frame.providers)
            this.emit({ type: 'providers' })
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
          } else if (frame.type === 'response') this.receiveResponse(frame)
          else if (frame.type === 'sessions.changed') {
            if (this.state !== 'ready') throw new Error('unauthenticated update')
            this.emit({ type: 'sessions.changed' })
          } else if (frame.type === 'session.updated') {
            if (this.state !== 'ready') throw new Error('unauthenticated update')
            const session = readSession(frame.session)
            if (frame.sessionId !== session.id || frame.revision !== session.revision) throw new Error('invalid revision')
            const turn = frame.turn === undefined ? undefined : readTurn(frame.turn)
            this.emit({ type: 'session.updated', sessionId: session.id, revision: session.revision, session, ...(turn ? { turn } : {}) })
          } else throw new Error('unknown frame')
        } catch {
          this.retryEnabled = false
          this.failConnection('桥接返回了无效数据，请检查客户端版本')
        }
      }
    })
  }

  private copyProviders(): AiProvider[] {
    return this.providers.map(provider => ({ ...provider,
      ...(provider.efforts ? { efforts: [...provider.efforts] } : {}),
      ...(provider.models ? { models: provider.models.map(model => ({ ...model, efforts: [...model.efforts] })) } : {}),
    }))
  }

  private readProviders(value: unknown): AiProvider[] {
    const object = (item: unknown): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item)
    const text = (item: unknown, max: number): item is string => typeof item === 'string' && item.length > 0 && item.length <= max && !/[\u0000-\u001f\u007f]/.test(item)
    const efforts = (item: unknown): AiEffort[] => {
      const allowed = Array.isArray(item) ? [...new Set(item.filter((effort): effort is AiEffort => AI_EFFORTS.includes(effort)))] : []
      return allowed.length ? allowed : ['default']
    }
    if (!Array.isArray(value) || value.length > 200) throw new Error('invalid providers')
    const ids = new Set<string>()
    let modelCount = 0
    return value.map(provider => {
      if (!object(provider) || !text(provider.id, 128) || !text(provider.name, 256) || !text(provider.protocol, 80)
        || !text(provider.model, 256) || ids.has(provider.id)) throw new Error('invalid provider')
      ids.add(provider.id)
      const result: AiProvider = { id: provider.id, name: provider.name, protocol: provider.protocol, model: provider.model, efforts: efforts(provider.efforts) }
      if (provider.models !== undefined) {
        if (!Array.isArray(provider.models) || provider.models.length > 200) throw new Error('invalid models')
        modelCount += provider.models.length
        if (modelCount > 400) throw new Error('too many models')
        const modelIds = new Set<string>()
        result.models = provider.models.map(model => {
          if (!object(model) || !text(model.id, 256) || !text(model.name, 256) || modelIds.has(model.id)) throw new Error('invalid model')
          modelIds.add(model.id)
          const supported = efforts(model.efforts)
          const defaultEffort = model.defaultEffort as AiEffort
          if ((model.contextWindowTokens !== undefined && typeof model.contextWindowTokens !== 'number')
            || (model.maxOutputTokens !== undefined && typeof model.maxOutputTokens !== 'number')) throw new Error('invalid model limits')
          const limits = resolveAiModelLimits({ contextWindowTokens: model.contextWindowTokens as number | undefined, maxOutputTokens: model.maxOutputTokens as number | undefined })
          return { id: model.id, name: model.name, efforts: supported,
            ...(supported.includes(defaultEffort) ? { defaultEffort } : {}),
            ...(model.contextWindowTokens !== undefined ? { contextWindowTokens: limits.contextWindowTokens } : {}),
            ...(model.maxOutputTokens !== undefined ? { maxOutputTokens: limits.maxOutputTokens } : {}) }
        })
      }
      return result
    })
  }

  private rpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (this.state !== 'ready') return Promise.reject(new Error('请先连接 Note Bridge'))
    if (this.pending.size >= 32) return Promise.reject(new Error('请求过多，请稍后重试'))
    const id = this.requestId()
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new AiBridgeRpcError('timeout', '请求确认超时；请重新载入聊天确认结果，问题不会自动重发'))
      }, 30000)
      this.pending.set(id, { resolve, reject, timer })
      try { this.send({ type: 'request', id, method, params }) }
      catch (cause) { clearTimeout(timer); this.pending.delete(id); reject(cause) }
    })
  }

  private receiveResponse(frame: Record<string, unknown>) {
    if (this.state !== 'ready' || typeof frame.id !== 'string') throw new Error('invalid response')
    const pending = this.pending.get(frame.id)
    if (!pending) return // A timed-out request may still have been committed; never resubmit it.
    if (frame.error !== undefined && (!isRecord(frame.error) || typeof frame.error.code !== 'string' || typeof frame.error.message !== 'string')) throw new Error('invalid error')
    this.pending.delete(frame.id)
    clearTimeout(pending.timer)
    if (isRecord(frame.error)) pending.reject(new AiBridgeRpcError(String(frame.error.code), String(frame.error.message)))
    else if ('result' in frame) pending.resolve(frame.result)
    else pending.reject(new Error('桥接响应缺少结果'))
  }

  async listSessions(cursor?: string): Promise<AiSessionPage> {
    return readSessionPage(await this.rpc('sessions.list', { ...(cursor ? { cursor } : {}) }))
  }
  async createSession(model: AiModelSelection): Promise<AiSessionSummary> {
    return readSession(await this.rpc('sessions.create', { ...model }))
  }
  async getSession(sessionId: string, cursor?: string): Promise<AiTurnPage> {
    const page = readTurnPage(await this.rpc('sessions.get', { sessionId, ...(cursor ? { cursor } : {}) }))
    if (page.session.id !== sessionId) throw new Error('桥接返回了其他聊天的记录')
    return page
  }
  async archiveSession(sessionId: string): Promise<void> { await this.ok('sessions.archive', { sessionId }) }
  async subscribeSession(sessionId: string): Promise<void> { await this.ok('session.subscribe', { sessionId }) }
  async unsubscribeSession(sessionId: string): Promise<void> {
    if (this.state === 'ready') await this.ok('session.unsubscribe', { sessionId })
  }
  async cancelRun(sessionId: string): Promise<void> { await this.ok('runs.cancel', { sessionId }) }
  async document(docId: string): Promise<AiDocumentMetadata> {
    const result = readDocumentMetadata(await this.rpc('knowledge.document', { docId }))
    if (result.docId !== docId) throw new Error('桥接返回了其他文档的目录')
    return result
  }
  async sendMessage(input: AiMessageInput): Promise<{ runId: string; turnId: string }> {
    if (!input.text.trim() || input.text.length > AI_MAX_QUESTION_CHARS) throw new Error('问题须为 1 至 20,000 个字符')
    if ((input.attachments?.length || 0) > 3) throw new Error('最多附加 3 篇文档')
    const result = await this.rpc('messages.send', { ...input })
    if (!isRecord(result) || typeof result.runId !== 'string' || typeof result.turnId !== 'string') throw new Error('桥接返回了无效的提交结果')
    return { runId: result.runId, turnId: result.turnId }
  }
  private async ok(method: string, params: Record<string, unknown>): Promise<void> {
    const result = await this.rpc(method, params)
    if (!isRecord(result) || result.ok !== true) throw new Error('桥接未确认操作成功')
  }

  private send(frame: Record<string, unknown>) {
    if (this.socket?.readyState !== 1) throw new Error('连接已断开')
    const encoded = JSON.stringify({ v: 2, ...frame })
    if (new TextEncoder().encode(encoded).length > AI_MAX_FRAME_BYTES) throw new Error('桥接请求过大，请减少上下文')
    this.socket.send(encoded)
  }

  private failConnection(message: string) {
    this.pendingReject?.(new Error(message))
    this.pendingReject = undefined
    this.teardownSocket()
    this.setState('disconnected', message)
    if (!this.paused && this.retryEnabled && this.credential && !this.retryTimer) {
      const delay = Math.min(30000, 1000 * 2 ** Math.min(this.retryAttempt++, 5))
      this.retryTimer = setTimeout(() => { this.retryTimer = undefined; void this.reconnect().catch(() => {}) }, delay)
    }
  }

  private teardownSocket() {
    clearTimeout(this.pairTimer)
    clearInterval(this.heartbeat)
    const socket = this.socket
    this.socket = undefined
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(new AiBridgeRpcError('disconnected', '连接已断开；Note Bridge 中的回答会继续，重连后将重新载入'))
    }
    this.pending.clear()
    this.providers = []
    this.awaitingPong = false
    if (socket) { socket.onclose = null; socket.onerror = null; socket.onmessage = null; socket.onopen = null; socket.close() }
  }

  disconnect() {
    this.paused = true
    this.retryEnabled = false
    clearTimeout(this.retryTimer)
    this.retryTimer = undefined
    this.pendingReject?.(new Error('连接已取消'))
    this.pendingReject = undefined
    this.teardownSocket()
    this.setState('disconnected')
  }

  forget() {
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

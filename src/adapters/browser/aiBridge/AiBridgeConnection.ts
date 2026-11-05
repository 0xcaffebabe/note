import type { AiBridgeEvent, AiBridgeSnapshot, AiBridgeState } from '@/core/domain/ai/AiBridge'
import type { AiProvider } from '@/core/domain/ai/AiModel'
import type { StoragePort } from '@/core/ports/StoragePort'
import {
  AI_BRIDGE_STORAGE_KEY,
  AiBridgeCredentials,
  sameCredential,
  validConnectionToken,
} from './AiBridgeCredentials'
import type {
  AuthenticationAttempt,
  BrowserLifecycle,
  SavedConnection,
  SocketFactory,
} from './AiBridgeConnectionTypes'
import { AiBridgeReconnect } from './AiBridgeReconnect'
import { AiBridgeRpc } from './AiBridgeRpc'
import { AiBridgeSocket } from './AiBridgeSocket'
import { copyProviders, readProviders } from './protocol/ProviderCatalogReader'
import { readSession, readTurn } from './protocol/SessionProjectionReader'

/**
 * 协调单页连接状态与认证，不执行 Agent 或保存聊天。
 * 配对存储、网络传输、重连退避和 RPC 等待分别委托独立组件；
 * 此处只决定何时转入 ready，以及何种失败需要终止自动重连。
 */
export class AiBridgeConnection {
  private readonly socket: AiBridgeSocket
  private readonly credentials: AiBridgeCredentials
  private readonly retry: AiBridgeReconnect
  private readonly rpc: AiBridgeRpc
  private readonly listeners = new Set<(event: AiBridgeEvent) => void>()
  private state: AiBridgeState = 'disconnected'
  private providers: AiProvider[] = []
  private message?: string
  private port = 19661
  private initialized = false
  private pendingReject?: (error: Error) => void

  constructor(
    createSocket: SocketFactory,
    requestId: () => string,
    storage: StoragePort,
    private readonly lifecycle?: BrowserLifecycle,
  ) {
    this.socket = new AiBridgeSocket(createSocket)
    this.credentials = new AiBridgeCredentials(storage)
    this.retry = new AiBridgeReconnect(() => this.reconnect())
    this.rpc = new AiBridgeRpc(requestId, frame => this.socket.send(frame))
  }

  get ready(): boolean {
    return this.state === 'ready'
  }

  snapshot(): AiBridgeSnapshot {
    return {
      state: this.state,
      providers: copyProviders(this.providers),
      remembered: this.credentials.remembered,
      port: this.port,
      ...(this.message ? { message: this.message } : {}),
    }
  }

  subscribe(listener: (event: AiBridgeEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  initialize(): void {
    if (!this.attachLifecycle()) {
      return
    }
    this.credentials.adopt(this.credentials.read())
    if (this.credentials.current) {
      this.port = this.credentials.current.port
      void this.reconnect().catch(() => {})
    }
  }

  pair(code: string, port = 19661): Promise<AiProvider[]> {
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
      return Promise.reject(new Error('端口须为 1024–65535'))
    }
    if (!/^\d{6}$/.test(code)) {
      return Promise.reject(new Error('请输入桌面端显示的 6 位配对码'))
    }
    this.attachLifecycle()
    this.retry.beginPairing()
    this.port = port
    return this.connect({ type: 'pair', code })
  }

  reconnect(): Promise<AiProvider[]> {
    this.attachLifecycle()
    this.credentials.current ??= this.credentials.read()
    if (!this.credentials.current) {
      return Promise.reject(new Error('尚未保存连接，请先配对 Note Bridge'))
    }
    this.retry.beginAuthentication()
    this.port = this.credentials.current.port
    return this.connect({ type: 'auth', token: this.credentials.current.token })
  }

  request(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.ready) {
      return Promise.reject(new Error('请先连接 Note Bridge'))
    }
    return this.rpc.request(method, params)
  }

  disconnect(): void {
    this.retry.pause()
    this.pendingReject?.(new Error('连接已取消'))
    this.pendingReject = undefined
    this.teardown()
    this.setState('disconnected')
  }

  forget(): void {
    if (this.ready) {
      try {
        this.socket.send({ type: 'auth.forget' })
      } catch {
        // 离线授权仍可在桌面端撤销。
      }
    }
    this.disconnect()
    this.credentials.clear()
    const remains = this.credentials.read()
    this.setState('disconnected', remains ? '浏览器未能删除连接凭证，请清理网站存储' : '已忘记此浏览器的连接')
  }

  /** 宿主或测试释放共享连接；普通组件卸载不应调用。 */
  dispose(): void {
    this.disconnect()
    this.lifecycle?.removeEventListener('storage', this.onStorage)
    this.lifecycle?.removeEventListener('online', this.onOnline)
    this.initialized = false
    this.listeners.clear()
  }

  private emit(event: AiBridgeEvent): void {
    this.listeners.forEach(listener => listener(event))
  }

  private setState(state: AiBridgeState, message?: string): void {
    this.state = state
    this.message = message
    this.emit({ type: 'state', state, ...(message ? { message } : {}) })
  }

  private attachLifecycle(): boolean {
    if (this.initialized) {
      return false
    }
    this.initialized = true
    this.lifecycle?.addEventListener('storage', this.onStorage)
    this.lifecycle?.addEventListener('online', this.onOnline)
    return true
  }

  private readonly onOnline = (): void => {
    if (this.retry.allowed && this.credentials.current && this.state === 'disconnected') {
      void this.reconnect().catch(() => {})
    }
  }

  private readonly onStorage = (event: Event): void => {
    const key = (event as StorageEvent).key
    if (key !== AI_BRIDGE_STORAGE_KEY && key !== null) {
      return
    }
    const saved = this.credentials.read()
    if (!sameCredential(saved, this.credentials.current)) {
      this.adoptSaved(saved)
    }
  }

  private adoptSaved(saved: SavedConnection | undefined): void {
    this.disconnect()
    this.credentials.adopt(saved)
    if (saved) {
      this.port = saved.port
      void this.reconnect().catch(() => {})
    } else {
      this.setState('disconnected', '已在其他页面忘记连接')
    }
  }

  private connect(firstFrame: Record<string, unknown>): Promise<AiProvider[]> {
    const credential: SavedConnection | undefined = firstFrame.type === 'auth'
      ? { version: 1, port: this.port, token: firstFrame.token as string }
      : undefined
    const wasRemembered = this.credentials.remembered
    this.retry.clearTimer()
    this.pendingReject?.(new Error('连接已替换'))
    this.pendingReject = undefined
    this.teardown()
    this.setState('disconnected')
    this.setState('connecting')
    return new Promise((resolve, reject) => {
      this.pendingReject = reject
      const attempt: AuthenticationAttempt = { credential, wasRemembered, resolve }
      this.socket.open(this.port, firstFrame, {
        onFrame: frame => this.receive(frame, attempt),
        onFailure: message => this.failConnection(message),
        onInvalidFrame: () => {
          this.retry.disable()
          this.failConnection('桥接返回了无效数据，请检查客户端版本')
        },
      })
    })
  }

  private receive(frame: Record<string, unknown>, attempt: AuthenticationAttempt): void {
    if (frame.v === 1) {
      this.retry.disable()
      this.failConnection('Note Bridge 版本过旧，请升级桌面端以使用持久化知识助手')
      return
    }
    if (frame.v !== 2 || typeof frame.type !== 'string') {
      throw new Error('invalid protocol')
    }
    switch (frame.type) {
      case 'auth.ok':
        if (this.ready) {
          throw new Error('unknown frame')
        }
        this.authenticate(frame, attempt)
        return
      case 'pong':
        this.socket.pong()
        return
      case 'error':
        this.rejectAuthentication(frame, attempt.credential)
        return
    }
    this.requireReady()
    switch (frame.type) {
      case 'providers.updated':
        this.providers = readProviders(frame.providers)
        this.emit({ type: 'providers' })
        return
      case 'response':
        this.rpc.receive(frame)
        return
      case 'sessions.changed':
        this.emit({ type: 'sessions.changed' })
        return
      case 'session.updated': {
        const session = readSession(frame.session)
        if (frame.sessionId !== session.id || frame.revision !== session.revision) {
          throw new Error('invalid revision')
        }
        const turn = frame.turn === undefined ? undefined : readTurn(frame.turn)
        this.emit({
          type: 'session.updated',
          sessionId: session.id,
          revision: session.revision,
          session,
          ...(turn ? { turn } : {}),
        })
        return
      }
      default:
        throw new Error('unknown frame')
    }
  }

  private requireReady(): void {
    if (!this.ready) {
      throw new Error('unauthenticated update')
    }
  }

  private authenticate(frame: Record<string, unknown>, attempt: AuthenticationAttempt): void {
    if (!validConnectionToken(frame.token)) {
      throw new Error('invalid auth')
    }
    if (
      !Array.isArray(frame.capabilities)
      || !frame.capabilities.includes('persistent_sessions')
      || !frame.capabilities.includes('knowledge_tools')
    ) {
      this.retry.disable()
      this.failConnection('Note Bridge 不支持持久化知识助手，请升级桌面端')
      return
    }
    const providers = readProviders(frame.providers)
    if (attempt.credential) {
      if (frame.token !== attempt.credential.token) {
        throw new Error('unexpected token rotation')
      }
      const saved = this.credentials.read()
      // storage 事件可能尚未派发；接受认证前再次检查，不能复活已删除的旧授权。
      if ((attempt.wasRemembered || saved) && !sameCredential(saved, attempt.credential)) {
        this.adoptSaved(saved)
        return
      }
      this.credentials.current = attempt.credential
      this.credentials.remembered = sameCredential(saved, attempt.credential)
    }
    this.pendingReject = undefined
    this.providers = providers
    const saved = attempt.credential
      ? this.credentials.remembered
      : this.credentials.save(this.port, frame.token)
    this.retry.authenticated()
    this.socket.authenticated(message => this.failConnection(message))
    this.setState('ready', saved ? undefined : '已连接，但浏览器无法保存凭证；刷新后需要重新配对')
    attempt.resolve(copyProviders(this.providers))
  }

  private rejectAuthentication(frame: Record<string, unknown>, authenticating?: SavedConnection): void {
    if (frame.code === 'auth_failed' && authenticating) {
      const saved = this.credentials.read()
      if (saved && !sameCredential(saved, authenticating)) {
        this.adoptSaved(saved)
        return
      }
      this.credentials.clear(authenticating)
    }
    // worker 恢复和授权存储暂时不可用不会使凭证失效，继续按既有退避认证。
    if (frame.code !== 'agent_unavailable' && frame.code !== 'authorization_unavailable') {
      this.retry.disable()
    }
    this.failConnection(typeof frame.message === 'string' ? frame.message : '桥接请求失败')
  }

  private failConnection(message: string): void {
    this.pendingReject?.(new Error(message))
    this.pendingReject = undefined
    this.teardown()
    this.setState('disconnected', message)
    if (this.credentials.current) {
      this.retry.schedule()
    }
  }

  private teardown(): void {
    this.rpc.disconnect()
    this.providers = []
    this.socket.close()
  }
}

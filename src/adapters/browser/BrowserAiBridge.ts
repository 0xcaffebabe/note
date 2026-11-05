import type { AiBridgePort } from '@/core/ports/AiBridgePort'
import type { AiBridgeEvent, AiBridgeSnapshot } from '@/core/domain/ai/AiBridge'
import type { AiDocumentMetadata } from '@/core/domain/ai/AiDocument'
import type { AiModelSelection, AiProvider } from '@/core/domain/ai/AiModel'
import type {
  AiMessageInput,
  AiMessageReceipt,
  AiSessionPage,
  AiSessionSummary,
  AiTurnPage,
} from '@/core/domain/ai/AiSession'
import { AI_MAX_QUESTION_CHARS } from '@/core/domain/AiLimits'
import type { StoragePort } from '@/core/ports/StoragePort'
import { browserStorage } from './LocalStorageAdapter'
import { AiBridgeConnection } from './aiBridge/AiBridgeConnection'
import type { BrowserLifecycle, SocketFactory } from './aiBridge/AiBridgeConnectionTypes'
import { readDocumentMetadata } from './aiBridge/protocol/DocumentProjectionReader'
import { isRecord } from './aiBridge/protocol/ProtocolValueReader'
import { readSession, readSessionPage, readTurnPage } from './aiBridge/protocol/SessionProjectionReader'

export { AI_BRIDGE_STORAGE_KEY } from './aiBridge/AiBridgeCredentials'
export { AiBridgeRpcError } from './aiBridge/AiBridgeRpcError'

/**
 * 浏览器知识助手端口的门面实现。
 * 将领域操作映射为 RPC，并校验响应归属；认证、存储和网络生命周期
 * 由 AiBridgeConnection 管理。任何重连都不会重发用户问题。
 */
export class BrowserAiBridge implements AiBridgePort {
  private readonly connection: AiBridgeConnection

  constructor(
    createSocket: SocketFactory = url => new WebSocket(url),
    requestId: () => string = () => crypto.randomUUID(),
    storage: StoragePort = browserStorage,
    lifecycle: BrowserLifecycle | undefined = typeof window === 'undefined' ? undefined : window,
  ) {
    this.connection = new AiBridgeConnection(createSocket, requestId, storage, lifecycle)
  }

  initialize(): void {
    this.connection.initialize()
  }

  snapshot(): AiBridgeSnapshot {
    return this.connection.snapshot()
  }

  subscribe(listener: (event: AiBridgeEvent) => void): () => void {
    return this.connection.subscribe(listener)
  }

  pair(code: string, port = 19661): Promise<AiProvider[]> {
    return this.connection.pair(code, port)
  }

  reconnect(): Promise<AiProvider[]> {
    return this.connection.reconnect()
  }

  async listSessions(cursor?: string): Promise<AiSessionPage> {
    const result = await this.connection.request('sessions.list', { ...(cursor ? { cursor } : {}) })
    return readSessionPage(result)
  }

  async createSession(model: AiModelSelection): Promise<AiSessionSummary> {
    return readSession(await this.connection.request('sessions.create', { ...model }))
  }

  async getSession(sessionId: string, cursor?: string): Promise<AiTurnPage> {
    const result = await this.connection.request('sessions.get', {
      sessionId,
      ...(cursor ? { cursor } : {}),
    })
    const page = readTurnPage(result)
    if (page.session.id !== sessionId) {
      throw new Error('桥接返回了其他聊天的记录')
    }
    return page
  }

  async archiveSession(sessionId: string): Promise<void> {
    await this.confirm('sessions.archive', { sessionId })
  }

  async subscribeSession(sessionId: string): Promise<void> {
    await this.confirm('session.subscribe', { sessionId })
  }

  async unsubscribeSession(sessionId: string): Promise<void> {
    if (this.connection.ready) {
      await this.confirm('session.unsubscribe', { sessionId })
    }
  }

  async cancelRun(sessionId: string): Promise<void> {
    await this.confirm('runs.cancel', { sessionId })
  }

  async document(docId: string): Promise<AiDocumentMetadata> {
    const result = readDocumentMetadata(await this.connection.request('knowledge.document', { docId }))
    if (result.docId !== docId) {
      throw new Error('桥接返回了其他文档的目录')
    }
    return result
  }

  /** 校验本地输入后提交；只返回执行标识，不复制桌面端的额外字段。 */
  async sendMessage(input: AiMessageInput): Promise<AiMessageReceipt> {
    if (!input.text.trim() || input.text.length > AI_MAX_QUESTION_CHARS) {
      throw new Error('问题须为 1 至 20,000 个字符')
    }
    if ((input.attachments?.length || 0) > 3) {
      throw new Error('最多附加 3 篇文档')
    }
    const result = await this.connection.request('messages.send', { ...input })
    if (!isRecord(result) || typeof result.runId !== 'string' || typeof result.turnId !== 'string') {
      throw new Error('桥接返回了无效的提交结果')
    }
    return { runId: result.runId, turnId: result.turnId }
  }

  disconnect(): void {
    this.connection.disconnect()
  }

  forget(): void {
    this.connection.forget()
  }

  /** 宿主或测试释放共享连接；普通组件卸载只应解除订阅。 */
  dispose(): void {
    this.connection.dispose()
  }

  private async confirm(method: string, params: Record<string, unknown>): Promise<void> {
    const result = await this.connection.request(method, params)
    if (!isRecord(result) || result.ok !== true) {
      throw new Error('桥接未确认操作成功')
    }
  }
}

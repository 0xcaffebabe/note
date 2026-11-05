import type { AiBridgeEvent, AiBridgeSnapshot } from '../domain/ai/AiBridge'
import type { AiDocumentMetadata } from '../domain/ai/AiDocument'
import type { AiModelSelection, AiProvider } from '../domain/ai/AiModel'
import type {
  AiMessageInput,
  AiMessageReceipt,
  AiSessionPage,
  AiSessionSummary,
  AiTurnPage,
} from '../domain/ai/AiSession'

// 保留原导入入口；数据契约统一由领域模块维护。
export { AI_EFFORTS } from '../domain/ai/AiModel'
export type { AiEffort, AiModel, AiModelSelection, AiProvider } from '../domain/ai/AiModel'
export type { AiBridgeEvent, AiBridgeSnapshot, AiBridgeState } from '../domain/ai/AiBridge'
export type { AiDocumentMetadata } from '../domain/ai/AiDocument'
export type {
  AiMessageInput,
  AiMessageReceipt,
  AiSessionPage,
  AiSessionSummary,
  AiSessionTurn,
  AiToolCallRecord,
  AiTurnPage,
} from '../domain/ai/AiSession'

/**
 * 知识助手的客户端端口。
 *
 * 站点只提交用户意图和显示已提交投影；Agent 执行、聊天持久化和
 * 文档工具均由 Note Bridge 负责。断开连接不等于停止后台回答。
 */
export interface AiBridgePort {
  /** 幂等注册浏览器生命周期，并尝试恢复已保存的连接。 */
  initialize(): void

  /** 返回不含凭证的当前状态，调用方可以安全修改其中的模型数组。 */
  snapshot(): AiBridgeSnapshot

  /** 用桌面端的六位配对码授权，并尽力保存凭证以便刷新恢复。 */
  pair(code: string, port?: number): Promise<AiProvider[]>

  /** 使用已有凭证重新认证，不重发此前的问题。 */
  reconnect(): Promise<AiProvider[]>

  /** 加载一页聊天；游标由桌面端生成，客户端不解释其内容。 */
  listSessions(cursor?: string): Promise<AiSessionPage>

  /** 在桌面端创建采用指定模型的聊天。 */
  createSession(model: AiModelSelection): Promise<AiSessionSummary>

  /** 加载聊天快照或更早的问答，并校验返回的聊天归属。 */
  getSession(sessionId: string, cursor?: string): Promise<AiTurnPage>

  /** 归档聊天；桌面端可能拒绝归档正在生成的聊天。 */
  archiveSession(sessionId: string): Promise<void>

  /** 订阅聊天的后续完整投影。 */
  subscribeSession(sessionId: string): Promise<void>

  /** 取消展示订阅，不取消执行；已断开时无需发出请求。 */
  unsubscribeSession(sessionId: string): Promise<void>

  /** 提交一次问题，等待接受确认；超时不能推断为未执行。 */
  sendMessage(input: AiMessageInput): Promise<AiMessageReceipt>

  /** 显式停止指定聊天的后台执行。 */
  cancelRun(sessionId: string): Promise<void>

  /** 获取附件目录，并校验返回的文档归属。 */
  document(docId: string): Promise<AiDocumentMetadata>

  /** 暂停本页自动重连，保留已保存的凭证和桌面端执行。 */
  disconnect(): void

  /** 清除本地凭证；在线时同时请求桌面端撤销当前授权。 */
  forget(): void

  /** 注册状态监听器，返回取消监听函数。 */
  subscribe(listener: (event: AiBridgeEvent) => void): () => void
}

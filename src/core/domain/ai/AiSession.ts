import type { AiCitation, AiToolCallOverview } from '../AiDocumentTools'
import type { AiDocumentAttachment } from './AiDocument'
import type { AiEffort, AiModelSelection } from './AiModel'

/** 桌面端持久化聊天的列表投影，revision 用于识别过期更新。 */
export interface AiSessionSummary {
  id: string
  title: string
  providerId: string
  model: string
  effort: AiEffort
  createdAt: number
  updatedAt: number
  status: 'idle' | 'running' | 'error'
  revision: number
}

/** 工具调用的展示记录，不含原始工具结果或模型凭证。 */
export interface AiToolCallRecord {
  callId: string
  name: string
  status: 'running' | 'complete' | 'error'
  message?: string
  overview?: AiToolCallOverview
}

/** 一轮问答的完整已提交投影，客户端按标识和 revision 替换展示。 */
export interface AiSessionTurn {
  id: string
  question: string
  answer: string
  status: 'running' | 'complete' | 'cancelled' | 'error'
  sources: AiCitation[]
  toolCalls: AiToolCallRecord[]
  error?: string
  contextNotice?: string
  createdAt: number
}

/** 使用不透明游标分页的聊天列表。 */
export interface AiSessionPage {
  sessions: AiSessionSummary[]
  nextCursor?: string
}

/** 聊天详情及一页问答，旧记录通过 nextCursor 按需加载。 */
export interface AiTurnPage {
  session: AiSessionSummary
  turns: AiSessionTurn[]
  nextCursor?: string
}

/** 提问命令；clientRequestId 标识一次用户提交，重连不能自动重发。 */
export interface AiMessageInput extends AiModelSelection {
  sessionId: string
  clientRequestId: string
  text: string
  attachments?: AiDocumentAttachment[]
}

/** 桌面端接受提问后的执行标识，不代表模型已经完成回答。 */
export interface AiMessageReceipt {
  runId: string
  turnId: string
}

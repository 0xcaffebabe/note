import type { AiProvider } from './AiModel'
import type { AiSessionSummary, AiSessionTurn } from './AiSession'

export type AiBridgeState = 'disconnected' | 'connecting' | 'ready'

/** 可公开给界面的连接状态；永不暴露配对凭证。 */
export interface AiBridgeSnapshot {
  state: AiBridgeState
  providers: AiProvider[]
  remembered: boolean
  port: number
  message?: string
}

/** 桌面端状态变化或已提交聊天投影的通知。 */
export type AiBridgeEvent =
  | {
    type: 'state'
    state: AiBridgeState
    message?: string
  }
  | { type: 'providers' }
  | { type: 'sessions.changed' }
  | {
    type: 'session.updated'
    sessionId: string
    revision: number
    session: AiSessionSummary
    turn?: AiSessionTurn
  }

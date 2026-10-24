import type { AiCitation, AiToolCallOverview } from '../domain/AiDocumentTools'

export const AI_EFFORTS = ['default', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'] as const
export type AiEffort = typeof AI_EFFORTS[number]

export interface AiModel {
  id: string
  name: string
  efforts: AiEffort[]
  defaultEffort?: AiEffort
  contextWindowTokens?: number
  maxOutputTokens?: number
}

export interface AiProvider {
  id: string
  name: string
  protocol: string
  model: string
  efforts?: AiEffort[]
  models?: AiModel[]
}

export type AiBridgeState = 'disconnected' | 'connecting' | 'ready'

export interface AiBridgeSnapshot {
  state: AiBridgeState
  providers: AiProvider[]
  remembered: boolean
  port: number
  message?: string
}

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
export interface AiToolCallRecord {
  callId: string
  name: string
  status: 'running' | 'complete' | 'error'
  message?: string
  overview?: AiToolCallOverview
}
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
export interface AiSessionPage { sessions: AiSessionSummary[]; nextCursor?: string }
export interface AiTurnPage { session: AiSessionSummary; turns: AiSessionTurn[]; nextCursor?: string }
export interface AiDocumentMetadata {
  docId: string
  title: string
  url: string
  contentHash: string
  headings: { id: string; title: string }[]
}
export interface AiModelSelection { providerId: string; model: string; effort?: AiEffort }
export interface AiMessageInput extends AiModelSelection {
  sessionId: string
  clientRequestId: string
  text: string
  attachments?: { docId: string; headingIds?: string[]; contentHash?: string }[]
}
export type AiBridgeEvent =
  | { type: 'state'; state: AiBridgeState; message?: string }
  | { type: 'providers' }
  | { type: 'sessions.changed' }
  | { type: 'session.updated'; sessionId: string; revision: number; session: AiSessionSummary; turn?: AiSessionTurn }

/** The browser displays committed projections; agent execution and all chat data belong to Note Bridge. */
export interface AiBridgePort {
  initialize(): void
  snapshot(): AiBridgeSnapshot
  pair(code: string, port?: number): Promise<AiProvider[]>
  reconnect(): Promise<AiProvider[]>
  listSessions(cursor?: string): Promise<AiSessionPage>
  createSession(model: AiModelSelection): Promise<AiSessionSummary>
  getSession(sessionId: string, cursor?: string): Promise<AiTurnPage>
  archiveSession(sessionId: string): Promise<void>
  subscribeSession(sessionId: string): Promise<void>
  unsubscribeSession(sessionId: string): Promise<void>
  sendMessage(input: AiMessageInput): Promise<{ runId: string; turnId: string }>
  cancelRun(sessionId: string): Promise<void>
  document(docId: string): Promise<AiDocumentMetadata>
  disconnect(): void
  forget(): void
  subscribe(listener: (event: AiBridgeEvent) => void): () => void
}

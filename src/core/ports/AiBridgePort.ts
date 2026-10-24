import type { AiCitation, AiDocumentToolDefinition, AiDocumentToolResult } from '../domain/AiDocumentTools'

export type AiEffort = 'default' | 'low' | 'medium' | 'high'
export type AiToolDefinition = AiDocumentToolDefinition
export type AiToolExecutor = (name: string, argumentsValue: unknown, signal: AbortSignal) => Promise<AiDocumentToolResult>

export interface AiProvider {
  id: string
  name: string
  protocol: string
  model: string
  efforts?: AiEffort[]
}

export interface AiSource {
  sourceId: string
  headingId: string
  title: string
  text: string
}

export interface AiContextDocument {
  docId: string
  title: string
  url: string
  contentHash: string
  metadata: unknown
  headings: { id: string; title: string }[]
  relatedLinks: { url: string; title: string }[]
  sources: AiSource[]
  truncated: boolean
}

export interface AiContext {
  documents: AiContextDocument[]
}

export interface AiChatInput {
  providerId: string
  model: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  context: AiContext
  maxOutputTokens?: number
  effort?: AiEffort
  tools?: AiToolDefinition[]
}

export type AiBridgeState = 'disconnected' | 'connecting' | 'ready'

export interface AiBridgeSnapshot {
  state: AiBridgeState
  providers: AiProvider[]
  remembered: boolean
  port: number
  message?: string
}

export type AiBridgeEvent =
  | { type: 'state'; state: AiBridgeState; message?: string }
  | { type: 'delta'; requestId: string; delta: string }
  | { type: 'done'; requestId: string; cancelled: boolean }
  | { type: 'error'; requestId: string; message: string }
  | { type: 'tool'; requestId: string; callId: string; name: string; status: 'running' | 'complete' | 'error'; message?: string; sources?: AiCitation[] }

/** Shared website connection. Only the origin-bound bridge grant is persisted, never an AI API key. */
export interface AiBridgePort {
  configureTools(definitions: AiToolDefinition[], execute: AiToolExecutor): void
  initialize(): void
  snapshot(): AiBridgeSnapshot
  pair(code: string, port?: number): Promise<AiProvider[]>
  reconnect(): Promise<AiProvider[]>
  start(input: AiChatInput): string
  cancel(requestId?: string): void
  disconnect(): void
  forget(): void
  subscribe(listener: (event: AiBridgeEvent) => void): () => void
}

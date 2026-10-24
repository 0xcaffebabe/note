export interface AiProvider {
  id: string
  name: string
  protocol: string
  model: string
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

/** Shared website connection. Only the origin-bound bridge grant is persisted, never an AI API key. */
export interface AiBridgePort {
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

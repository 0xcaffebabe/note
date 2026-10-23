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

export type AiBridgeEvent =
  | { type: 'state'; state: 'disconnected' | 'connecting' | 'pending' | 'ready'; message?: string }
  | { type: 'delta'; requestId: string; delta: string }
  | { type: 'done'; requestId: string; cancelled: boolean }
  | { type: 'error'; requestId: string; message: string }

/** One connection belongs to one assistant panel; credentials never enter persistence ports. */
export interface AiBridgePort {
  pair(code: string, port?: number): Promise<AiProvider[]>
  start(input: AiChatInput): string
  cancel(): void
  disconnect(): void
  subscribe(listener: (event: AiBridgeEvent) => void): () => void
}

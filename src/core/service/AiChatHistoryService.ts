import type { StoragePort } from '../ports/StoragePort'
import { AI_EFFORTS, type AiContext, type AiEffort } from '../ports/AiBridgePort'
import type { AiCitation } from '../domain/AiDocumentTools'

export interface AiToolCallRecord {
  callId: string
  name: string
  status: 'running' | 'complete' | 'error'
  message?: string
}

export interface AiChatTurn {
  id: string
  question: string
  answer: string
  context: AiContext
  sources: AiCitation[]
  toolCalls: AiToolCallRecord[]
  status?: 'running' | 'complete' | 'cancelled' | 'error'
  cancelled?: boolean
  error?: string
}

export interface AiChatSession {
  id: string
  docId: string
  docTitle: string
  title: string
  providerId: string
  model: string
  effort: AiEffort
  turns: AiChatTurn[]
  createdAt: number
  updatedAt: number
}

export const AI_CHAT_HISTORY_KEY = 'note:ai-chat-history:v1'
const MAX_HISTORY_BYTES = 4 * 1024 * 1024
type JsonObject = Record<string, unknown>

function object(value: unknown): value is JsonObject { return !!value && typeof value === 'object' && !Array.isArray(value) }
function text(value: unknown, max: number): value is string { return typeof value === 'string' && value.length <= max }
function identifier(value: unknown): value is string { return typeof value === 'string' && /^[a-zA-Z0-9_.:-]{1,128}$/.test(value) }
function siteUrl(value: unknown): value is string {
  return text(value, 8192) && value.startsWith('/') && !value.startsWith('//') && !/[\u0000-\u0020\u007f\\]/.test(value) && /^[^?#]*\.html(?:[?#]|$)/.test(value)
}

function validContext(value: unknown): value is AiContext {
  if (!object(value) || !Array.isArray(value.documents) || value.documents.length > 3) return false
  return value.documents.every(doc => object(doc) && text(doc.docId, 512) && text(doc.title, 2000) && siteUrl(doc.url)
    && text(doc.contentHash, 256) && Array.isArray(doc.sources) && doc.sources.length <= 256
    && Array.isArray(doc.headings) && doc.headings.length <= 100 && Array.isArray(doc.relatedLinks) && doc.relatedLinks.length <= 30
    && doc.sources.every(source => object(source) && identifier(source.sourceId) && text(source.headingId, 2000) && text(source.title, 2000) && text(source.text, 100000)))
}

function validTurn(value: unknown): value is AiChatTurn {
  return object(value) && identifier(value.id) && text(value.question, 4000) && text(value.answer, 100000) && validContext(value.context)
    && Array.isArray(value.sources) && value.sources.length <= 1600
    && value.sources.every(source => object(source) && identifier(source.sourceId) && text(source.title, 2000) && siteUrl(source.url))
    && Array.isArray(value.toolCalls) && value.toolCalls.length <= 16
    && value.toolCalls.every(call => object(call) && identifier(call.callId) && text(call.name, 80) && ['running', 'complete', 'error'].includes(String(call.status)) && (call.message === undefined || text(call.message, 2000)))
    && (value.error === undefined || text(value.error, 2000)) && (value.cancelled === undefined || typeof value.cancelled === 'boolean')
    && (value.status === undefined || ['running', 'complete', 'cancelled', 'error'].includes(String(value.status)))
}

function validSession(value: unknown): value is AiChatSession {
  return object(value) && identifier(value.id) && text(value.docId, 512) && !!value.docId
    && text(value.docTitle, 2000) && text(value.title, 200) && text(value.providerId, 128) && text(value.model, 256)
    && AI_EFFORTS.includes(value.effort as AiEffort) && Number.isFinite(value.createdAt) && Number.isFinite(value.updatedAt)
    && Array.isArray(value.turns) && value.turns.length <= 40 && value.turns.every(validTurn)
}

/** Browser-local conversation history. No bridge tokens or provider credentials belong here. */
export class AiChatHistoryService {
  constructor(private readonly storage: StoragePort) {}

  list(docId?: string): AiChatSession[] {
    const sessions = this.read()
    return sessions.filter(session => docId === undefined || session.docId === docId).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  save(session: AiChatSession): void {
    if (session.turns.length > 40) throw new Error('此聊天已达到 40 轮记录上限，请新建聊天；当前内容仍保留在本页。')
    if (!validSession(session)) throw new Error('聊天记录格式无效，当前内容仍保留在本页。')
    const sessions = this.read().filter(item => item.id !== session.id)
    if (sessions.length >= 50) throw new Error('已保存 50 个聊天，请删除不再需要的记录后重试。')
    // Copy only declared fields; runtime state, executors, and accidental secrets are never serialized.
    sessions.unshift({
      id: session.id, docId: session.docId, docTitle: session.docTitle, title: session.title,
      providerId: session.providerId, model: session.model, effort: session.effort, createdAt: session.createdAt, updatedAt: session.updatedAt,
      turns: session.turns.map(turn => ({ id: turn.id, question: turn.question, answer: turn.answer, context: turn.context,
        sources: turn.sources.map(source => ({ sourceId: source.sourceId, title: source.title, url: source.url })),
        toolCalls: turn.toolCalls.map(call => ({ callId: call.callId, name: call.name, status: call.status, ...(call.message ? { message: call.message } : {}) })),
        ...(turn.status ? { status: turn.status } : {}), ...(turn.cancelled ? { cancelled: true } : {}), ...(turn.error ? { error: turn.error } : {}) })),
    })
    this.write(sessions)
  }

  remove(id: string): void { this.write(this.read().filter(session => session.id !== id)) }

  private read(): AiChatSession[] {
    const raw = this.storage.getItem(AI_CHAT_HISTORY_KEY)
    if (!raw) return []
    if (raw.length > MAX_HISTORY_BYTES) throw new Error('已保存的聊天记录过大，暂时无法读取。')
    let saved: unknown
    try { saved = JSON.parse(raw) } catch { throw new Error('聊天记录格式损坏，请保留浏览器数据后处理。') }
    if (!object(saved) || saved.version !== 1 || !Array.isArray(saved.sessions) || saved.sessions.length > 50) throw new Error('聊天记录版本或格式不受支持。')
    // Invalid records cannot inject links into the transcript. Leave the saved file intact until the user saves/deletes a valid record.
    return saved.sessions.filter(validSession).map(session => ({ ...session, turns: session.turns.map(turn => {
      if (turn.status !== 'running') return turn
      return { ...turn, status: 'cancelled' as const, cancelled: true, toolCalls: turn.toolCalls.map(call => call.status === 'running'
        ? { ...call, status: 'error' as const, message: '上次读取已中断' } : call) }
    }) }))
  }

  private write(sessions: AiChatSession[]): void {
    const serialized = JSON.stringify({ version: 1, sessions })
    if (new TextEncoder().encode(serialized).length > MAX_HISTORY_BYTES) throw new Error('聊天记录空间已满，请删除部分旧聊天；当前内容仍保留在本页。')
    try {
      this.storage.setItem(AI_CHAT_HISTORY_KEY, serialized)
      if (this.storage.getItem(AI_CHAT_HISTORY_KEY) !== serialized) throw new Error('storage unavailable')
    } catch { throw new Error('浏览器无法保存聊天记录，当前内容仍保留在本页。') }
  }
}

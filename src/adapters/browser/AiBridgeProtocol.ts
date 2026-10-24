import { AI_EFFORTS, type AiEffort, type AiSessionSummary, type AiSessionTurn, type AiSessionPage, type AiTurnPage, type AiDocumentMetadata } from '@/core/ports/AiBridgePort'
import type { AiCitation, AiToolCallOverview } from '@/core/domain/AiDocumentTools'

export function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function invalid(): never { throw new Error('Note Bridge 返回了无效的聊天数据，请检查桌面端版本') }
function string(value: unknown, max: number, nonempty = false): string {
  if (typeof value !== 'string' || value.length > max || (nonempty && !value.length)) invalid()
  return value
}
function id(value: unknown): string {
  const result = string(value, 128, true)
  if (!/^[a-zA-Z0-9_.:-]+$/.test(result)) invalid()
  return result
}
function number(value: unknown): number { if (!Number.isSafeInteger(value) || (value as number) < 0) invalid(); return value as number }
function optional(value: unknown, max: number): string | undefined { return value === undefined ? undefined : string(value, max) }
function array(value: unknown, max: number): unknown[] { if (!Array.isArray(value) || value.length > max) invalid(); return value }
function unique<T>(items: T[], key: (item: T) => string): T[] { if (new Set(items.map(key)).size !== items.length) invalid(); return items }
function siteUrl(value: unknown): string {
  const url = string(value, 8192, true)
  if (!url.startsWith('/') || url.startsWith('//') || /[\u0000-\u0020\u007f\\]/.test(url) || !/^[^?#]*\.html(?:[?#]|$)/.test(url)) invalid()
  return url
}
export function readSession(value: unknown): AiSessionSummary {
  if (!isRecord(value) || !['idle', 'running', 'error'].includes(String(value.status)) || !AI_EFFORTS.includes(value.effort as AiEffort)) invalid()
  return { id: id(value.id), title: string(value.title, 2000), providerId: string(value.providerId, 128, true), model: string(value.model, 256, true), effort: value.effort as AiEffort,
    status: value.status as AiSessionSummary['status'], createdAt: number(value.createdAt), updatedAt: number(value.updatedAt), revision: number(value.revision) }
}
function readCitation(value: unknown): AiCitation {
  if (!isRecord(value)) invalid()
  const sourceId = string(value.sourceId, 128, true)
  if (!/^D\d+S\d+$/.test(sourceId)) invalid()
  return { sourceId, title: string(value.title, 2000), url: siteUrl(value.url),
    ...(value.contentHash !== undefined ? { contentHash: string(value.contentHash, 256) } : {}),
    ...(value.revision !== undefined ? { revision: string(value.revision, 256) } : {}) }
}
function readOverview(value: unknown): AiToolCallOverview {
  if (!isRecord(value)) invalid()
  const label = (value: unknown, max: number) => {
    const result = string(value, max, true)
    if (/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(result)) invalid()
    return result
  }
  return { input: array(value.input, 8).map(field => {
    if (!isRecord(field)) invalid()
    return { label: label(field.label, 32), value: label(field.value, 256) }
  }),
  ...(value.summary !== undefined ? { summary: label(value.summary, 320) } : {}),
  ...(value.items !== undefined ? { items: array(value.items, 8).map(item => label(item, 200)) } : {}),
  ...(value.note !== undefined ? { note: label(value.note, 400) } : {}) }
}
export function readTurn(value: unknown): AiSessionTurn {
  if (!isRecord(value) || !['running', 'complete', 'cancelled', 'error'].includes(String(value.status))) invalid()
  const toolCalls = unique(array(value.toolCalls, 128).map(call => {
    if (!isRecord(call) || !['running', 'complete', 'error'].includes(String(call.status))) invalid()
    const overview = call.overview === undefined ? undefined : readOverview(call.overview)
    const callId = string(call.callId, 512, true)
    if (/[\u0000-\u001f\u007f]/.test(callId)) invalid()
    return { callId, name: string(call.name, 80, true), status: call.status as 'running' | 'complete' | 'error',
      ...(call.message !== undefined ? { message: string(call.message, 4000) } : {}), ...(overview ? { overview } : {}) }
  }), call => call.callId)
  return { id: id(value.id), question: string(value.question, 20000), answer: string(value.answer, 2 * 1024 * 1024),
    status: value.status as AiSessionTurn['status'], createdAt: number(value.createdAt), sources: array(value.sources, 4096).map(readCitation), toolCalls,
    ...(value.error !== undefined ? { error: string(value.error, 4000) } : {}),
    ...(value.contextNotice !== undefined ? { contextNotice: string(value.contextNotice, 4000) } : {}) }
}
export function readSessionPage(value: unknown): AiSessionPage {
  if (!isRecord(value)) invalid()
  return { sessions: unique(array(value.sessions, 50).map(readSession), session => session.id), nextCursor: optional(value.nextCursor, 4096) }
}
export function readTurnPage(value: unknown): AiTurnPage {
  if (!isRecord(value)) invalid()
  return { session: readSession(value.session), turns: unique(array(value.turns, 50).map(readTurn), turn => turn.id), nextCursor: optional(value.nextCursor, 4096) }
}
export function readDocumentMetadata(value: unknown): AiDocumentMetadata {
  if (!isRecord(value)) invalid()
  return { docId: string(value.docId, 1024, true), title: string(value.title, 2000), url: siteUrl(value.url), contentHash: string(value.contentHash, 256, true),
    headings: unique(array(value.headings, 5000).map(heading => {
      if (!isRecord(heading)) invalid()
      return { id: string(heading.id, 2000), title: string(heading.title, 2000) }
    }), heading => heading.id) }
}

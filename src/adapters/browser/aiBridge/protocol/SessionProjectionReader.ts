import { AI_EFFORTS, type AiEffort } from '@/core/domain/ai/AiModel'
import type { AiSessionSummary, AiSessionTurn, AiSessionPage, AiTurnPage } from '@/core/domain/ai/AiSession'
import {
  invalidProjection,
  isRecord,
  readArray,
  readId,
  readNonnegativeInteger,
  readOptionalString,
  readString,
  requireUnique,
} from './ProtocolValueReader'
import { readCitation, readToolCall } from './ToolProjectionReader'

/** 将不可信的聊天摘要转换为完整领域投影，拒绝未知状态和推理强度。 */
export function readSession(value: unknown): AiSessionSummary {
  if (
    !isRecord(value)
    || !['idle', 'running', 'error'].includes(String(value.status))
    || !AI_EFFORTS.includes(value.effort as AiEffort)
  ) {
    invalidProjection()
  }
  return {
    id: readId(value.id),
    title: readString(value.title, 2000),
    providerId: readString(value.providerId, 128, true),
    model: readString(value.model, 256, true),
    effort: value.effort as AiEffort,
    status: value.status as AiSessionSummary['status'],
    createdAt: readNonnegativeInteger(value.createdAt),
    updatedAt: readNonnegativeInteger(value.updatedAt),
    revision: readNonnegativeInteger(value.revision),
  }
}

/** 校验完整问答，包括引用、工具记录和协议大小限制。 */
export function readTurn(value: unknown): AiSessionTurn {
  if (!isRecord(value) || !['running', 'complete', 'cancelled', 'error'].includes(String(value.status))) {
    invalidProjection()
  }
  const toolCalls = requireUnique(readArray(value.toolCalls, 128).map(readToolCall), call => call.callId)
  return {
    id: readId(value.id),
    question: readString(value.question, 20000),
    answer: readString(value.answer, 2 * 1024 * 1024),
    status: value.status as AiSessionTurn['status'],
    createdAt: readNonnegativeInteger(value.createdAt),
    sources: readArray(value.sources, 4096).map(readCitation),
    toolCalls,
    ...(value.error !== undefined ? { error: readString(value.error, 4000) } : {}),
    ...(value.contextNotice !== undefined ? { contextNotice: readString(value.contextNotice, 4000) } : {}),
  }
}

/** 校验聊天列表页，拒绝重复标识和超出协议上限的条目。 */
export function readSessionPage(value: unknown): AiSessionPage {
  if (!isRecord(value)) {
    invalidProjection()
  }
  return {
    sessions: requireUnique(readArray(value.sessions, 50).map(readSession), session => session.id),
    nextCursor: readOptionalString(value.nextCursor, 4096),
  }
}

/** 校验聊天详情页，游标作为不透明字符串传递。 */
export function readTurnPage(value: unknown): AiTurnPage {
  if (!isRecord(value)) {
    invalidProjection()
  }
  return {
    session: readSession(value.session),
    turns: requireUnique(readArray(value.turns, 50).map(readTurn), turn => turn.id),
    nextCursor: readOptionalString(value.nextCursor, 4096),
  }
}

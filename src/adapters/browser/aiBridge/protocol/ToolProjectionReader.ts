import type { AiCitation, AiToolCallOverview } from '@/core/domain/AiDocumentTools'
import type { AiToolCallRecord } from '@/core/domain/ai/AiSession'
import { invalidProjection, isRecord, readArray, readSiteUrl, readString } from './ProtocolValueReader'

/** 校验引用标识和站内地址，只保留界面需要的证据字段。 */
export function readCitation(value: unknown): AiCitation {
  if (!isRecord(value)) {
    invalidProjection()
  }
  const sourceId = readString(value.sourceId, 128, true)
  if (!/^D\d+S\d+$/.test(sourceId)) {
    invalidProjection()
  }
  return {
    sourceId,
    title: readString(value.title, 2000),
    url: readSiteUrl(value.url),
    ...(value.contentHash !== undefined ? { contentHash: readString(value.contentHash, 256) } : {}),
    ...(value.revision !== undefined ? { revision: readString(value.revision, 256) } : {}),
  }
}

function readOverviewLabel(value: unknown, max: number): string {
  const result = readString(value, max, true)
  if (/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(result)) {
    invalidProjection()
  }
  return result
}

function readOverview(value: unknown): AiToolCallOverview {
  if (!isRecord(value)) {
    invalidProjection()
  }
  const input = readArray(value.input, 8).map(field => {
    if (!isRecord(field)) {
      invalidProjection()
    }
    return {
      label: readOverviewLabel(field.label, 32),
      value: readOverviewLabel(field.value, 256),
    }
  })
  return {
    input,
    ...(value.summary !== undefined ? { summary: readOverviewLabel(value.summary, 320) } : {}),
    ...(value.items !== undefined ? { items: readArray(value.items, 8).map(item => readOverviewLabel(item, 200)) } : {}),
    ...(value.note !== undefined ? { note: readOverviewLabel(value.note, 400) } : {}),
  }
}

/** 校验工具状态与有界概览，不接受原始工具载荷作为展示内容。 */
export function readToolCall(value: unknown): AiToolCallRecord {
  if (!isRecord(value) || !['running', 'complete', 'error'].includes(String(value.status))) {
    invalidProjection()
  }
  const overview = value.overview === undefined ? undefined : readOverview(value.overview)
  const callId = readString(value.callId, 512, true)
  if (/[\u0000-\u001f\u007f]/.test(callId)) {
    invalidProjection()
  }
  return {
    callId,
    name: readString(value.name, 80, true),
    status: value.status as AiToolCallRecord['status'],
    ...(value.message !== undefined ? { message: readString(value.message, 4000) } : {}),
    ...(overview ? { overview } : {}),
  }
}

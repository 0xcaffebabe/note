import type { AiCitation } from '@/core/domain/AiDocumentTools'

/** 已通过站内 URL 校验的引用投影；序号只在当前回答中有效。 */
export interface AiCitationLink {
  source: AiCitation
  url: string
  index: number
}

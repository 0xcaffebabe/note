import type { AiDocumentMetadata } from '@/core/domain/ai/AiDocument'
import { invalidProjection, isRecord, readArray, readSiteUrl, readString, requireUnique } from './ProtocolValueReader'

/** 校验附件目录的文档地址、版本哈希和唯一锚点。 */
export function readDocumentMetadata(value: unknown): AiDocumentMetadata {
  if (!isRecord(value)) {
    invalidProjection()
  }
  const headings = readArray(value.headings, 5000).map(heading => {
    if (!isRecord(heading)) {
      invalidProjection()
    }
    return {
      id: readString(heading.id, 2000),
      title: readString(heading.title, 2000),
    }
  })
  return {
    docId: readString(value.docId, 1024, true),
    title: readString(value.title, 2000),
    url: readSiteUrl(value.url),
    contentHash: readString(value.contentHash, 256, true),
    headings: requireUnique(headings, heading => heading.id),
  }
}

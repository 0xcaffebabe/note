import type {
  CatalogEntry,
  DiscoveredDocument,
  KnowledgeCitation,
  KnowledgeToolArgs,
  KnowledgeToolResult,
} from './contracts.js';
import { RESULT_CONTENT_BYTES } from './limits.js';
import { bytes, number, pagination, prefix } from './resultBounds.js';

/** 固定版本的引用和列表投影，集中保证证据 ID、分页和结果大小的一致性。 */
export class KnowledgeResults {
  constructor(private readonly revision: string) {}

  /** 将目录项投影为带稳定文档引用 ID 的可发现文档。 */
  public reference(doc: CatalogEntry) {
    return {
      docId: doc.docId,
      title: doc.title,
      url: doc.url,
      category: doc.category,
      sourceId: sourceId(doc.docId, 0),
      contentHash: doc.contentHash,
      revision: this.revision,
    };
  }

  /** 构造文档或章节证据；正文、目录和附件共用相同 ID 与版本。 */
  public citation(
    doc: CatalogEntry,
    section?: number,
    headingId = '',
    title = '',
  ): KnowledgeCitation {
    return {
      sourceId: sourceId(doc.docId, section === undefined ? 0 : section + 1),
      title:
        section === undefined
          ? doc.title
          : `${doc.title} · ${prefix(title, 200)}`,
      url:
        doc.url +
        (headingId ? `?headingId=${encodeURIComponent(headingId)}` : ''),
      contentHash: doc.contentHash,
      revision: this.revision,
    };
  }

  /** 分页投影发现结果，按 UTF-8 字节预算裁剪到实际可返回数量。 */
  public list(
    documents: DiscoveredDocument[],
    args: KnowledgeToolArgs,
    extra: Record<string, unknown> = {},
  ): KnowledgeToolResult {
    const offset = number(args, 'offset', 0);
    const chosen = documents.slice(offset, offset + number(args, 'limit', 30));
    for (;;) {
      const result = {
        data: {
          ...extra,
          revision: this.revision,
          documents: chosen.map((doc) => ({
            ...this.reference(doc),
            ...(doc.matchedIn
              ? { matchedIn: doc.matchedIn, snippets: doc.snippets }
              : {}),
          })),
          total: documents.length,
          ...pagination(offset, chosen.length, documents.length),
        },
        sources: chosen.map((doc) => this.citation(doc)),
      };
      if (bytes(result) <= RESULT_CONTENT_BYTES || chosen.length <= 1) {
        return result;
      }
      chosen.pop();
    }
  }
}

/** 按文档 ID 生成稳定的 FNV-1a 64 位引用前缀，不依赖进程或发布时间。 */
function sourceId(docId: string, section: number): string {
  let hash = 14695981039346656037n;
  for (const byte of Buffer.from(docId)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1099511628211n);
  }
  return `D${hash}S${section}`;
}

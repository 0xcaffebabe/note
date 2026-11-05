import type {
  CatalogEntry,
  DocumentData,
  KnowledgeSource,
} from './contracts.js';
import { KnowledgeError } from './KnowledgeError.js';
import { DOCUMENT_CACHE_BYTES } from './limits.js';
import { validateDocument } from './publishedData.js';
import { validDocId } from './validation.js';

/** 固定版本正文仓库，统一目录边界、正文一致性校验与有界 LRU 缓存。 */
export class DocumentRepository {
  private readonly documentCache = new Map<string, DocumentData>();
  private cacheBytes = 0;

  constructor(
    private readonly source: KnowledgeSource,
    private readonly catalog: Map<string, CatalogEntry>,
  ) {}

  /** 查找固定版本目录项，拒绝目录外或格式不合法的文档 ID。 */
  public entry(docId: string): CatalogEntry {
    const entry = this.catalog.get(docId);
    if (!entry || !validDocId(docId)) {
      throw new KnowledgeError(
        'unknown_document',
        '文档不在本次回答绑定的知识目录中',
      );
    }
    return entry;
  }

  /** 延迟读取并验证正文；在每个快照内维护 8 MiB LRU 工作集。 */
  public async load(
    doc: CatalogEntry,
    signal?: AbortSignal,
  ): Promise<DocumentData> {
    signal?.throwIfAborted();
    const cached = this.documentCache.get(doc.docId);
    if (cached) {
      this.documentCache.delete(doc.docId);
      this.documentCache.set(doc.docId, cached);
      return cached;
    }
    const data = validateDocument(
      await this.source.resource(doc.resource, signal),
      doc,
    );
    // 只缓存当前回答的有界工作集，不镜像整个知识库。
    while (
      this.documentCache.size &&
      this.cacheBytes + doc.resource.bytes > DOCUMENT_CACHE_BYTES
    ) {
      const key = this.documentCache.keys().next().value!;
      this.cacheBytes -= this.catalog.get(key)!.resource.bytes;
      this.documentCache.delete(key);
    }
    if (doc.resource.bytes <= DOCUMENT_CACHE_BYTES) {
      this.documentCache.set(doc.docId, data);
      this.cacheBytes += doc.resource.bytes;
    }
    return data;
  }
}

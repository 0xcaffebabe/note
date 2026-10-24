import type {
  CatalogEntry,
  KnowledgeManifest,
  KnowledgeSource,
  KnowledgeToolResult,
} from './contracts.js';
import { DocumentRepository } from './DocumentRepository.js';
import { DocumentReader } from './DocumentReader.js';
import { KnowledgeDiscovery } from './KnowledgeDiscovery.js';
import { KnowledgeResults } from './KnowledgeResults.js';
import { KnowledgeSearch } from './KnowledgeSearch.js';
import { validateArgs } from './toolArguments.js';
import { finishKnowledgeResult } from './toolOverview.js';

/**
 * 一次回答持有的知识快照与只读工具入口。
 * 持有 manifest 副本和固定目录，组装正文、发现与搜索服务；不负责 HTTP 或解析。
 * 调用前后检查取消信号，确保异步读取完成后也不会返回已取消的结果。
 */
export class KnowledgeSnapshot {
  readonly revision: string;
  readonly knowledgeBaseId: string;
  readonly manifest: KnowledgeManifest;
  private readonly documents: DocumentRepository;
  private readonly reader: DocumentReader;
  private readonly discovery: KnowledgeDiscovery;
  private readonly search: KnowledgeSearch;

  constructor(
    source: KnowledgeSource,
    manifest: KnowledgeManifest,
    catalog: Map<string, CatalogEntry>,
  ) {
    this.manifest = structuredClone(manifest);
    this.revision = manifest.revision;
    this.knowledgeBaseId = manifest.knowledgeBaseId;
    this.documents = new DocumentRepository(source, catalog);
    const results = new KnowledgeResults(this.revision);
    this.reader = new DocumentReader(this.documents, results);
    this.discovery = new KnowledgeDiscovery(
      source,
      this.manifest,
      catalog,
      results,
    );
    this.search = new KnowledgeSearch(source, this.manifest, catalog, results);
  }

  /** 返回附件选择器需要的文档元数据；正文仍按需加载。 */
  public async document(docId: string, signal?: AbortSignal) {
    return this.reader.describe(docId, signal);
  }

  /** 未选章节时附加目录，选择后附加正文；保留与工具读取一致的引用和截断信息。 */
  public async attachment(
    docId: string,
    headingIds?: string[],
    signal?: AbortSignal,
  ): Promise<KnowledgeToolResult> {
    return this.reader.attachment(docId, headingIds, signal);
  }

  /** 校验参数并分派只读操作，所有结果统一添加概览并执行大小检查。 */
  public async execute(
    name: string,
    value: unknown,
    signal?: AbortSignal,
  ): Promise<KnowledgeToolResult> {
    signal?.throwIfAborted();
    const args = validateArgs(name, value);
    const doc =
      args.docId === undefined
        ? undefined
        : this.documents.entry(String(args.docId));
    let result: KnowledgeToolResult;
    switch (name) {
      case 'get_document':
        result = await this.reader.read(doc!, args, signal);
        break;
      case 'get_toc':
        result = await this.reader.toc(doc!, args, signal);
        break;
      case 'get_knowledge_network':
        result = await this.discovery.network(doc, args, signal);
        break;
      case 'get_related_documents':
        result = await this.discovery.related(doc!, args, signal);
        break;
      case 'get_knowledge_overview':
        result = this.discovery.overview(args);
        break;
      default:
        result = await this.search.search(args, signal);
    }
    signal?.throwIfAborted();
    return finishKnowledgeResult(name, args, result);
  }
}

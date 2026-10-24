import type {
  CatalogEntry,
  KnowledgeManifest,
  KnowledgeSource,
  KnowledgeToolArgs,
  KnowledgeToolResult,
} from './contracts.js';
import { KnowledgeResults } from './KnowledgeResults.js';
import { RESULT_CONTENT_BYTES } from './limits.js';
import { array, record, string, version } from './validation.js';
import { bytes, number, pagination } from './resultBounds.js';

/** 固定版本知识目录的发现服务：分类概览、显式链接及发布时的相似文档。 */
export class KnowledgeDiscovery {
  private readonly revision: string;

  constructor(
    private readonly source: KnowledgeSource,
    private readonly manifest: KnowledgeManifest,
    private readonly catalog: Map<string, CatalogEntry>,
    private readonly results: KnowledgeResults,
  ) {
    this.revision = manifest.revision;
  }

  /** 统计整个固定目录的分类，并独立分页分类与文档列表。 */
  public overview(args: KnowledgeToolArgs): KnowledgeToolResult {
    const all = [...this.catalog.values()];
    const counts = new Map<string, number>();
    for (const doc of all) {
      counts.set(doc.category, (counts.get(doc.category) || 0) + 1);
    }
    const categories = [...counts]
      .map(([category, documentCount]) => ({ category, documentCount }))
      .sort((a, b) => a.category.localeCompare(b.category));
    const categoryOffset = number(args, 'categoryOffset', 0);
    const selected = categories.slice(
      categoryOffset,
      categoryOffset + number(args, 'categoryLimit', 40),
    );
    return this.results.list(
      args.category === undefined
        ? all
        : all.filter((doc) => doc.category === args.category),
      args,
      {
        scope: 'knowledge_base',
        totalDocuments: all.length,
        totalCategories: categories.length,
        categories: selected,
        categoryOffset,
        nextCategoryOffset:
          categoryOffset + selected.length < categories.length
            ? categoryOffset + selected.length
            : null,
        categoriesTruncated:
          categoryOffset + selected.length < categories.length,
        ...(args.category ? { category: args.category } : {}),
      },
    );
  }

  /** 读取全局或单文档一跳关系，只返回已绑定目录内的节点与边。 */
  public async network(
    doc: CatalogEntry | undefined,
    args: KnowledgeToolArgs,
    signal?: AbortSignal,
  ): Promise<KnowledgeToolResult> {
    const raw = record(
      await this.source.resource(this.manifest.resources.graph, signal),
    );
    version(raw);
    const direction = doc ? args.direction || 'both' : 'both';
    const edges = array(raw.edges, 200000)
      .map((item) => {
        const edge = record(item);
        return {
          from: string(edge.from, 512),
          to: string(edge.to, 512),
          title: string(edge.title, 160, true),
        };
      })
      .filter(
        (edge) =>
          this.catalog.has(edge.from) &&
          this.catalog.has(edge.to) &&
          (!doc ||
            (edge.from === doc.docId && direction !== 'incoming') ||
            (edge.to === doc.docId && direction !== 'outgoing')),
      );
    const offset = number(args, 'offset', 0);
    const selected = edges.slice(offset, offset + number(args, 'limit', 50));
    for (;;) {
      const ids = new Set([
        ...(doc ? [doc.docId] : []),
        ...selected.flatMap((edge) => [edge.from, edge.to]),
      ]);
      const nodes = [...ids].map((id) => this.catalog.get(id)!);
      const result = {
        data: {
          scope: doc ? 'document' : 'knowledge_base',
          ...(doc ? { docId: doc.docId } : {}),
          direction,
          revision: this.revision,
          nodes: nodes.map((item) => this.results.reference(item)),
          edges: selected,
          totalEdges: edges.length,
          ...pagination(offset, selected.length, edges.length),
        },
        sources: nodes.map((item) => this.results.citation(item)),
      };
      if (bytes(result) <= RESULT_CONTENT_BYTES || !selected.length) {
        return result;
      }
      selected.pop();
    }
  }

  /** 从发布的相似度簇读取相关文档，去重并排除目录外结果和文档自身。 */
  public async related(
    doc: CatalogEntry,
    args: KnowledgeToolArgs,
    signal?: AbortSignal,
  ): Promise<KnowledgeToolResult> {
    const raw = record(
      await this.source.resource(this.manifest.resources.clusters, signal),
    );
    version(raw);
    const ids = new Set<string>();
    for (const item of array(raw.related, 50000)) {
      const entry = record(item);
      const id = string(entry.docId, 512);
      const related = array(entry.docIds, 50000);
      if (id === doc.docId) {
        for (const other of related) {
          const target = string(other, 512);
          if (this.catalog.has(target) && target !== id) {
            ids.add(target);
          }
        }
      }
    }
    return this.results.list(
      [...ids].map((id) => this.catalog.get(id)!),
      args,
      { docId: doc.docId },
    );
  }
}

import type {
  CatalogEntry,
  DiscoveredDocument,
  KnowledgeManifest,
  KnowledgeSearchDescriptor,
  KnowledgeSource,
  KnowledgeToolArgs,
  KnowledgeToolResult,
} from './contracts.js';
import { KnowledgeResults } from './KnowledgeResults.js';
import { invalid } from './KnowledgeError.js';
import { array, record } from './validation.js';
import { prefix } from './resultBounds.js';

/**
 * 组合固定目录检索和独立发布的全文索引。
 * 全文命中只能发现目录内文档；片段显式标记为实时数据，不能直接充当引用证据。
 * 搜索失败的回退结果保留失败状态，避免把检索失败误解为正文没有关键词。
 */
export class KnowledgeSearch {
  constructor(
    private readonly source: KnowledgeSource,
    private readonly manifest: KnowledgeManifest,
    private readonly catalog: Map<string, CatalogEntry>,
    private readonly results: KnowledgeResults,
  ) {}

  /** 组合目录与实时全文结果；全文不可用时明确标识回退，取消则向上传播。 */
  public async search(
    args: KnowledgeToolArgs,
    signal?: AbortSignal,
  ): Promise<KnowledgeToolResult> {
    const query = String(args.query).trim();
    if (!query) {
      invalid('搜索 query 不得为空');
    }
    const scope = String(args.scope || 'all');
    const catalogMatches = this.findCatalogMatches(query);
    const matches = new Map<string, DiscoveredDocument>();
    const fallback = () => {
      for (const doc of catalogMatches) {
        matches.set(doc.docId, {
          ...doc,
          matchedIn: ['catalog'],
          snippets: [],
        });
      }
    };
    if (scope !== 'fulltext') {
      fallback();
    }
    let fulltext: Record<string, unknown> = {
      status: 'not_requested',
      maxResults: 200,
    };
    if (scope !== 'catalog') {
      if (!this.manifest.search) {
        fulltext = {
          status: 'unavailable',
          maxResults: 200,
          message: '全文索引未配置，已回退到目录标题/路径检索。',
        };
        fallback();
      } else {
        try {
          fulltext = await this.searchLiveIndex(
            this.manifest.search,
            query,
            matches,
            signal,
          );
        } catch {
          signal?.throwIfAborted();
          fulltext = {
            status: 'failed',
            maxResults: 200,
            message:
              '全文索引请求失败，已回退到目录标题/路径检索。不能据此判断正文是否包含关键词。',
          };
          fallback();
        }
      }
    }
    return this.results.list([...matches.values()], args, {
      query,
      requestedScope: scope,
      fulltext,
    });
  }

  private findCatalogMatches(query: string): CatalogEntry[] {
    const words = query.toLocaleLowerCase().split(/\s+/);
    return [...this.catalog.values()].filter((doc) =>
      words.every((word) =>
        `${doc.title} ${doc.docId} ${decodeURIComponent(doc.url)}`
          .toLocaleLowerCase()
          .includes(word),
      ),
    );
  }

  private async searchLiveIndex(
    descriptor: KnowledgeSearchDescriptor,
    query: string,
    matches: Map<string, DiscoveredDocument>,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    const response = record(
      await this.source.search(descriptor, query, signal),
    );
    const hits = array(response.hits, 200);
    let accepted = 0;
    for (const value of hits) {
      const hit = record(value);
      if (typeof hit.url !== 'string') {
        continue;
      }
      const id = searchDocId(hit.url);
      const doc = this.catalog.get(id);
      if (!doc) {
        continue;
      }
      accepted++;
      const old = matches.get(id);
      const snippets = Array.isArray(hit.segments)
        ? hit.segments.slice(0, 3).flatMap((item) => {
            if (
              !item ||
              typeof item !== 'object' ||
              typeof item.txt !== 'string'
            ) {
              return [];
            }
            return [plainSnippet(item.txt)];
          })
        : [];
      matches.set(id, {
        ...doc,
        matchedIn: old ? ['catalog', 'fulltext'] : ['fulltext'],
        snippets,
      });
    }
    return {
      status: 'ok',
      maxResults: 200,
      returnedResults: hits.length,
      acceptedDocuments: accepted,
      revisionConsistency: 'live',
      searchedAt: new Date().toISOString(),
      message:
        '全文索引独立更新，片段仅用于发现文档；引用前用 get_document 核实本次绑定版本。',
    };
  }
}

/** 只接受本地文档路径，拒绝绝对 URL、查询串和锚点。 */
function searchDocId(value: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value) || /[?#\\]/.test(value)) {
    return '';
  }
  try {
    return decodeURI(value)
      .replace(/^\.\/doc\//, '')
      .replace(/^doc\//, '')
      .replace(/^\.\//, '')
      .replace(/^\//, '')
      .replace(/\.(?:md|html)$/i, '')
      .replace(/-/g, '@@')
      .split('/')
      .join('-');
  } catch {
    return '';
  }
}

/** 清除实时索引片段中的 HTML 与控制字符，限制展示长度。 */
function plainSnippet(value: string): string {
  return prefix(
    value
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[<>\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    480,
  );
}

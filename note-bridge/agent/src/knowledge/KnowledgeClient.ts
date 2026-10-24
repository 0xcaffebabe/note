import type {
  KnowledgeClientOptions,
  KnowledgeManifest,
  KnowledgeResource,
  KnowledgeSource,
} from './contracts.js';
import { KnowledgeError } from './KnowledgeError.js';
import { KnowledgeHttpTransport } from './KnowledgeHttpTransport.js';
import { KnowledgeSnapshot } from './KnowledgeSnapshot.js';
import {
  validateCatalog,
  validateManifest,
  validateResource,
} from './publishedData.js';

/**
 * 已授权 Origin 的知识客户端，负责固定及恢复站点发布快照。
 * 正文仍由站点发布；客户端只读取 manifest 指向的不可变资源。
 * 版本恢复不读取最新 manifest，保证重启前后的引用来自同一个知识版本。
 */
export class KnowledgeClient implements KnowledgeSource {
  readonly origin: string;
  private readonly transport: KnowledgeHttpTransport;

  constructor(origin: string, options: KnowledgeClientOptions = {}) {
    const url = new URL(origin);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new KnowledgeError(
        'invalid_origin',
        '知识站点地址必须为已授权 HTTP(S) Origin',
      );
    }
    this.origin = url.origin;
    this.transport = new KnowledgeHttpTransport(options);
  }

  /** 固定当前版本；expectedRevision 不匹配时立即拒绝，不混用新旧知识。 */
  public async pin(
    signal?: AbortSignal,
    expectedRevision?: string,
  ): Promise<KnowledgeSnapshot> {
    const manifest = validateManifest(
      await this.transport.fetchJson(
        `${this.origin}/ai/manifest.json`,
        256 * 1024,
        signal,
      ),
    );
    if (expectedRevision && manifest.revision !== expectedRevision) {
      throw new KnowledgeError(
        'stale_revision',
        '知识站点已更新，请重新发起提问',
      );
    }
    return this.restore(manifest, signal);
  }

  /** 恢复持久化 manifest 并重新验证目录；不会替换为站点最新版本。 */
  public async restore(
    value: unknown,
    signal?: AbortSignal,
  ): Promise<KnowledgeSnapshot> {
    const manifest = validateManifest(value);
    const catalog = validateCatalog(
      await this.resource(manifest.resources.catalog, signal),
    );
    return new KnowledgeSnapshot(this, manifest, catalog);
  }

  /** 只读取已校验的同源 hash 路径，同时验证响应字节数与 SHA-256。 */
  public async resource(
    reference: KnowledgeResource,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const resource = validateResource(reference);
    return this.transport.fetchJson(
      this.origin + resource.path,
      resource.bytes,
      signal,
      undefined,
      resource,
    );
  }

  /** 使用受支持的 Algolia 公共适配器检索，不允许调用方指定外部主机。 */
  public async search(
    descriptor: NonNullable<KnowledgeManifest['search']>,
    query: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const url = `https://${descriptor.applicationId.toLowerCase()}-dsn.algolia.net/1/indexes/${encodeURIComponent(descriptor.indexName)}/query`;
    return this.transport.fetchJson(url, 4 * 1024 * 1024, signal, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': descriptor.applicationId,
        'X-Algolia-API-Key': descriptor.searchOnlyApiKey,
      },
      body: JSON.stringify({
        query,
        hitsPerPage: 200,
        attributesToRetrieve: ['url', 'segments'],
        attributesToHighlight: ['segments'],
        highlightPreTag: '',
        highlightPostTag: '',
      }),
    });
  }
}

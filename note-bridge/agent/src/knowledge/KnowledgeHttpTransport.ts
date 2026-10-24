import { createHash } from 'node:crypto';
import type { KnowledgeClientOptions, KnowledgeResource } from './contracts.js';
import { KnowledgeError, invalid } from './KnowledgeError.js';

/**
 * 受限 JSON 传输适配器，统一执行截止时间、响应大小、重定向和 hash 校验。
 * 目标地址由 KnowledgeClient 构造；本适配器不接收模型提供的 URL。
 * 响应体读取全程关联调用方取消信号，释放 reader 后才返回通过校验的数据。
 */
export class KnowledgeHttpTransport {
  private readonly fetcher: typeof globalThis.fetch;
  private readonly timeoutMs: number;

  constructor(options: KnowledgeClientOptions = {}) {
    this.fetcher = options.fetch || globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 30000;
    if (
      !Number.isSafeInteger(this.timeoutMs) ||
      this.timeoutMs < 1 ||
      this.timeoutMs > 60000
    ) {
      throw new Error('Invalid knowledge timeout');
    }
  }

  /** 读取有界 UTF-8 JSON；不可变资源缺失时返回 stale_revision，不替换资源。 */
  public async fetchJson(
    url: string,
    maxBytes: number,
    signal?: AbortSignal,
    init?: RequestInit,
    expected?: KnowledgeResource,
  ): Promise<unknown> {
    signal?.throwIfAborted();
    const deadline = AbortSignal.timeout(this.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
    let response: Response;
    try {
      response = await this.fetcher(url, {
        ...init,
        headers: { Accept: 'application/json', ...init?.headers },
        redirect: 'error',
        signal: combined,
        cache: 'no-store',
      });
    } catch {
      signal?.throwIfAborted();
      throw new KnowledgeError(
        'knowledge_unavailable',
        '无法读取知识站点资源（连接失败、超时或重定向）',
      );
    }
    await this.validateResponse(response, url, maxBytes, expected);
    const body = await this.readBody(response, maxBytes, combined);
    if (
      expected &&
      (body.byteLength !== expected.bytes ||
        createHash('sha256').update(body).digest('hex') !== expected.sha256)
    ) {
      invalid('知识资源 hash 校验失败；不会混用不同版本');
    }
    return this.parseJson(body);
  }

  private async validateResponse(
    response: Response,
    url: string,
    maxBytes: number,
    expected?: KnowledgeResource,
  ): Promise<void> {
    if (!response.ok) {
      await response.body?.cancel();
      if (expected && [404, 410].includes(response.status)) {
        throw new KnowledgeError(
          'stale_revision',
          '本次回答绑定的旧知识资源已下线，请重新发起提问',
        );
      }
      throw new KnowledgeError(
        'knowledge_unavailable',
        `知识站点返回 HTTP ${response.status}`,
      );
    }
    if (response.redirected || (response.url && response.url !== url)) {
      await response.body?.cancel();
      invalid('知识资源不允许重定向');
    }
    const length = response.headers.get('content-length');
    if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
      await response.body?.cancel();
      invalid('知识资源超过大小限制');
    }
  }

  private async readBody(
    response: Response,
    maxBytes: number,
    signal: AbortSignal,
  ): Promise<Buffer> {
    const reader = response.body?.getReader();
    if (!reader) {
      invalid('知识资源响应为空');
    }
    let count = 0;
    const chunks: Uint8Array[] = [];
    try {
      for (;;) {
        const next = await reader.read();
        signal.throwIfAborted();
        if (next.done) {
          break;
        }
        count += next.value.byteLength;
        if (count > maxBytes) {
          await reader.cancel();
          invalid('知识资源超过大小限制');
        }
        chunks.push(next.value);
      }
    } finally {
      reader.releaseLock();
    }
    return Buffer.concat(chunks, count);
  }

  private parseJson(body: Buffer): unknown {
    let parsed: unknown;
    try {
      parsed = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(body),
      );
    } catch {
      invalid('知识资源不是有效 UTF-8 JSON');
    }
    // 允许忽略新增字段，但新增字段也必须受嵌套深度与条目数量约束。
    const queue: { value: unknown; depth: number }[] = [
      { value: parsed, depth: 0 },
    ];
    let values = 0;
    while (queue.length) {
      const item = queue.pop()!;
      if (++values > 1_000_000 || item.depth > 64) {
        invalid('知识 JSON 嵌套或条目超过限制');
      }
      if (item.value && typeof item.value === 'object') {
        for (const value of Object.values(item.value)) {
          if (values + queue.length >= 1_000_000) {
            invalid('知识 JSON 条目超过限制');
          }
          queue.push({ value, depth: item.depth + 1 });
        }
      }
    }
    return parsed;
  }
}

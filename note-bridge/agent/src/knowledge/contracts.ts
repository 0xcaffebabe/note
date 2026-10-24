/** 站点发布的不可变 JSON 资源；路径、字节数及 SHA-256 必须同时匹配。 */
export interface KnowledgeResource {
  path: string;
  sha256: string;
  bytes: number;
}

/** 公共全文索引配置。索引独立更新，结果仅用于发现当前快照内的文档。 */
export interface KnowledgeSearchDescriptor {
  type: 'algolia';
  applicationId: string;
  indexName: string;
  searchOnlyApiKey: string;
  revisionConsistency: 'live';
}

/**
 * 与知识站点源码和发布周期解耦的版本化数据契约。
 * 一个回答持有一个 manifest；恢复执行时沿用原资源，不替换为最新版本。
 */
export interface KnowledgeManifest {
  schemaVersion: 1;
  knowledgeBaseId: string;
  revision: string;
  capabilities: string[];
  resources: {
    catalog: KnowledgeResource;
    graph: KnowledgeResource;
    clusters: KnowledgeResource;
  };
  search?: KnowledgeSearchDescriptor;
}

/** 可持久化的引用证据；sourceId 在同一文档章节中稳定，revision 标识证据版本。 */
export interface KnowledgeCitation {
  sourceId: string;
  title: string;
  url: string;
  contentHash: string;
  revision: string;
}

/** 提供给薄客户端的工具调用概览，仅包含适合展示的有界文本。 */
export interface KnowledgeOverview {
  input: { label: string; value: string }[];
  summary?: string;
  items?: string[];
  note?: string;
}

/** 模型数据、可验证引用和客户端概览使用同一个工具结果边界。 */
export interface KnowledgeToolResult {
  data: Record<string, unknown>;
  sources?: KnowledgeCitation[];
  overview?: KnowledgeOverview;
}

/** 已完成目录校验的文档描述。文档正文通过 resource 延迟读取。 */
export interface CatalogEntry {
  docId: string;
  title: string;
  url: string;
  category: string;
  contentHash: string;
  resource: KnowledgeResource;
}

/** 目录项附加发现来源；实时片段不能替代固定版本的正文证据。 */
export interface DiscoveredDocument extends CatalogEntry {
  matchedIn?: string[];
  snippets?: string[];
}

/** 站点渲染后的正文与标题锚点，保留发布时的章节顺序。 */
export interface DocumentData {
  docId: string;
  title: string;
  url: string;
  headings: { id: string; title: string }[];
  sections: { headingId: string; title: string; text: string }[];
}

/** 注入 HTTP 实现及单次读取超时；默认超时为 30 秒，最大 60 秒。 */
export interface KnowledgeClientOptions {
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

/**
 * 已授权知识数据读取端口。
 * 实现负责资源 hash、大小、重定向与取消校验；调用者消费验证后的 JSON。
 * 外部搜索只能使用受支持的公共索引适配器，不接受任意目标 URL。
 */
export interface KnowledgeSource {
  /** 读取指定不可变资源；资源过期时失败，不回退到其他版本。 */
  resource(
    reference: KnowledgeResource,
    signal?: AbortSignal,
  ): Promise<unknown>;
  /** 查询公共实时索引；搜索服务还须将响应过滤到固定版本的目录。 */
  search(
    descriptor: KnowledgeSearchDescriptor,
    query: string,
    signal?: AbortSignal,
  ): Promise<unknown>;
}

/** 工具参数经过 schema 校验后，只包含受支持的字符串和整数。 */
export type KnowledgeToolArgs = Record<string, string | number>;

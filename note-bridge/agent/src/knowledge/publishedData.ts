import type {
  CatalogEntry,
  DocumentData,
  KnowledgeManifest,
  KnowledgeResource,
} from './contracts.js';
import { RESOURCE_BYTES } from './limits.js';
import { invalid } from './KnowledgeError.js';
import {
  array,
  record,
  string,
  validDocId,
  validateSiteUrl,
  version,
} from './validation.js';

/** 校验固定版本 manifest；只构造明确支持的公共资源和搜索描述。 */
export function validateManifest(value: unknown): KnowledgeManifest {
  const raw = record(value);
  version(raw);
  const revision = string(raw.revision, 64);
  if (!/^[a-f0-9]{64}$/.test(revision)) {
    invalid('知识版本标识无效');
  }
  const resources = record(raw.resources);
  const manifest: KnowledgeManifest = {
    schemaVersion: 1,
    revision,
    knowledgeBaseId: string(raw.knowledgeBaseId, 200),
    capabilities: array(raw.capabilities, 32).map((item) => string(item, 64)),
    resources: {
      catalog: validateResource(resources.catalog),
      graph: validateResource(resources.graph),
      clusters: validateResource(resources.clusters),
    },
  };
  if (raw.search !== undefined) {
    const search = record(raw.search);
    if (search.type !== 'algolia' || search.revisionConsistency !== 'live') {
      invalid('不支持的知识检索服务');
    }
    const applicationId = string(search.applicationId, 32);
    const indexName = string(search.indexName, 128);
    if (
      !/^[A-Z0-9]{6,32}$/.test(applicationId) ||
      !/^[\w.-]{1,128}$/.test(indexName)
    ) {
      invalid('知识检索配置无效');
    }
    manifest.search = {
      type: 'algolia',
      applicationId,
      indexName,
      searchOnlyApiKey: string(search.searchOnlyApiKey, 4096),
      revisionConsistency: 'live',
    };
  }
  return manifest;
}

/** 校验 hash、路径和大小，保证资源始终位于 Origin 下的不可变对象目录。 */
export function validateResource(value: unknown): KnowledgeResource {
  const resource = record(value);
  const hash = string(resource.sha256, 64);
  if (
    !/^[a-f0-9]{64}$/.test(hash) ||
    resource.path !== `/ai/objects/${hash}.json` ||
    !Number.isSafeInteger(resource.bytes) ||
    Number(resource.bytes) < 2 ||
    Number(resource.bytes) > RESOURCE_BYTES
  ) {
    invalid('知识资源路径、hash 或大小无效');
  }
  return {
    path: resource.path as string,
    sha256: hash,
    bytes: resource.bytes as number,
  };
}

/** 校验全量目录及文档唯一性，返回可安全用于工具查询的目录。 */
export function validateCatalog(value: unknown): Map<string, CatalogEntry> {
  const raw = record(value);
  version(raw);
  const catalog = new Map<string, CatalogEntry>();
  for (const item of array(raw.documents, 50000)) {
    const entry = record(item);
    const docId = string(entry.docId, 512);
    if (!validDocId(docId) || catalog.has(docId)) {
      invalid('文档目录 ID 无效或重复');
    }
    const url = string(entry.url, 8192);
    validateSiteUrl(url, docId);
    const resource = validateResource(entry.resource);
    const contentHash = string(entry.contentHash, 80);
    if (contentHash !== `sha256:${resource.sha256}`) {
      invalid('文档内容 hash 与资源不一致');
    }
    catalog.set(docId, {
      docId,
      title: string(entry.title, 200),
      url,
      category: string(entry.category, 512),
      contentHash,
      resource,
    });
  }
  return catalog;
}

/** 校验正文结构及目录一致性，保留站点发布的真实标题锚点和章节顺序。 */
export function validateDocument(
  value: unknown,
  doc: CatalogEntry,
): DocumentData {
  const raw = record(value);
  version(raw);
  if (
    raw.docId !== doc.docId ||
    raw.url !== doc.url ||
    raw.title !== doc.title
  ) {
    invalid('文档资源与目录不一致');
  }
  const sections = array(raw.sections, 100000).map((item) => {
    const section = record(item);
    return {
      headingId: string(section.headingId, 4096, true),
      title: string(section.title, 20000, true),
      text: string(section.text, 10000000, true),
    };
  });
  const headings = array(raw.headings, 100000).map((item) => {
    const heading = record(item);
    return {
      id: string(heading.id, 4096),
      title: string(heading.title, 20000, true),
    };
  });
  return {
    docId: doc.docId,
    title: doc.title,
    url: doc.url,
    sections,
    headings,
  };
}

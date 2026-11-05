/**
 * 知识工具公共入口。发布协议、HTTP 读取与查询实现位于 knowledge/ 内，
 * 运行时与测试通过此处使用稳定 API，不依赖内部服务的拆分方式。
 */
export type {
  KnowledgeResource,
  KnowledgeManifest,
  KnowledgeCitation,
  KnowledgeOverview,
  KnowledgeToolResult,
  KnowledgeClientOptions,
} from './knowledge/contracts.js';
export { KnowledgeError } from './knowledge/KnowledgeError.js';
export { KnowledgeClient } from './knowledge/KnowledgeClient.js';
export { KnowledgeSnapshot } from './knowledge/KnowledgeSnapshot.js';
export { KNOWLEDGE_TOOL_RESULT_BYTES } from './knowledge/limits.js';
export { KNOWLEDGE_TOOL_DEFINITIONS } from './knowledge/toolDefinitions.js';

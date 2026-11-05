/** 包含引用与概览的完整工具结果上限。 */
export const KNOWLEDGE_TOOL_RESULT_BYTES = 192 * 1024;
/** 为概览等投影字段预留空间后的结果主体预算。 */
export const RESULT_CONTENT_BYTES = KNOWLEDGE_TOOL_RESULT_BYTES - 4096;
/** 单个不可变发布资源允许的最大响应体。 */
export const RESOURCE_BYTES = 16 * 1024 * 1024;
/** 每个回答缓存的正文工作集上限；不会缓存整个知识库。 */
export const DOCUMENT_CACHE_BYTES = 8 * 1024 * 1024;

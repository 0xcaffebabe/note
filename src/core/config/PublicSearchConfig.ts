import type { PublishedSearch } from '../domain/knowledge/KnowledgePublication'

/** 站点已经公开的只读搜索配置；只能使用 search-only key，不能配置管理密钥。 */
export const PUBLIC_SEARCH_CONFIG = {
  type: 'algolia' as const,
  applicationId: 'K9I7PAT3CY',
  indexName: 'note',
  searchOnlyApiKey: '8f3ec5043331dedbccce916154fc0162',
  revisionConsistency: 'live' as const,
} satisfies PublishedSearch

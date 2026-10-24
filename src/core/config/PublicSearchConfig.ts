/** Public, search-only credentials already shipped by the website. Never use an admin key here. */
export const PUBLIC_SEARCH_CONFIG = {
  type: 'algolia' as const,
  applicationId: 'K9I7PAT3CY',
  indexName: 'note',
  searchOnlyApiKey: '8f3ec5043331dedbccce916154fc0162',
  revisionConsistency: 'live' as const,
}

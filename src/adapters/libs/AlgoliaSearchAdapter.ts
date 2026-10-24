// SearchEnginePort 的实现: 委托 algoliasearch。凭据属基础设施配置, 留在适配器层。
import type { SearchEnginePort, AlgoliaSearchResponse, SearchOptions } from '@/core/ports'
import SearchSuggestion from '@/core/domain/search/SearchSuggestion'
import { algoliasearch } from 'algoliasearch'

import { PUBLIC_SEARCH_CONFIG } from '../../core/config/PublicSearchConfig'

export class AlgoliaSearchAdapter implements SearchEnginePort {
  private client = algoliasearch(PUBLIC_SEARCH_CONFIG.applicationId, PUBLIC_SEARCH_CONFIG.searchOnlyApiKey)

  async search(kw: string, opts: SearchOptions): Promise<AlgoliaSearchResponse | undefined> {
    return this.client.searchSingleIndex({
      indexName: PUBLIC_SEARCH_CONFIG.indexName,
      searchParams: { query: kw, ...opts },
    }) as unknown as Promise<AlgoliaSearchResponse | undefined>
  }

  async querySuggestions(kw: string, hitsPerPage: number): Promise<SearchSuggestion[]> {
    const hits = await this.client.searchSingleIndex<SearchSuggestion>({
      indexName: 'note_query_suggestions',
      searchParams: { query: kw, hitsPerPage },
    })
    return hits ? hits.hits : []
  }
}

export const algoliaSearch = new AlgoliaSearchAdapter()

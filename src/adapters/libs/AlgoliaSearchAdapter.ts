// SearchEnginePort 的实现: 委托 algoliasearch。凭据属基础设施配置, 留在适配器层。
import type { SearchEnginePort, AlgoliaSearchResponse, SearchOptions } from '@/core/ports'
import SearchSuggestion from '@/core/domain/search/SearchSuggestion'
import algoliasearch from 'algoliasearch'

const APP_ID = 'K9I7PAT3CY'
const API_KEY = '8f3ec5043331dedbccce916154fc0162'

export class AlgoliaSearchAdapter implements SearchEnginePort {
  private client = algoliasearch(APP_ID, API_KEY)

  async search(kw: string, opts: SearchOptions): Promise<AlgoliaSearchResponse | undefined> {
    const index = this.client.initIndex('note')
    return index.search(kw, opts) as unknown as Promise<AlgoliaSearchResponse | undefined>
  }

  async querySuggestions(kw: string, hitsPerPage: number): Promise<SearchSuggestion[]> {
    const index = this.client.initIndex('note_query_suggestions')
    const hits = await index.search(kw, { hitsPerPage })
    return hits ? (hits.hits as unknown as SearchSuggestion[]) : []
  }
}

export const algoliaSearch = new AlgoliaSearchAdapter()

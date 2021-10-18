import SearchResult from '@/dto/SearchResult';
import algoliasearch from 'algoliasearch'
import { SearchResponse } from '@algolia/client-search';

interface DocHits {
  url: string,
  txt: string
}

const hilighTag = 'mark'

class SearchService {
  static async search(kw: string): Promise<SearchResult[]> {
    const client = algoliasearch('K9I7PAT3CY', '8f3ec5043331dedbccce916154fc0162');
    const index = client.initIndex('note');
    const hits : SearchResponse<DocHits> = await index.search(kw, { hitsPerPage: 200, highlightPreTag: `<${hilighTag}>`, highlightPostTag: `</${hilighTag}>` });
    if (hits) {
      return hits.hits.map(v => {
        return {
          url: v.url,
          body: v.txt,
          hilighedUrl: v._highlightResult?.url?.value,
          hilighedBody: v._highlightResult?.txt?.value,
          hilighedSegement: this.splitHilighedBody(v._highlightResult?.txt?.value)
        } as SearchResult
      })
    }
    return []
  }

  private static splitHilighedBody(body :string | undefined) :string[] {
    if (!body || body.indexOf(`<${hilighTag}>`) == -1) {
      return []
    }
    const res = body.split('\n')
               .filter(v => v.indexOf(`<${hilighTag}>`) != -1)
    return Array.from(new Set(res))
  }
}

export default SearchService
import SearchResult from '@/dto/SearchResult';
import algoliasearch from 'algoliasearch'
import { SearchResponse } from '@algolia/client-search';
import SearchIndexSegment from '@/dto/search/SearchIndexSegement';


interface DocHits {
  url: string,
  createTime: string,
  segments: SearchIndexSegment[]
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
          hilighedUrl: v._highlightResult?.url?.value,
          createTime: v.createTime,
          hilighedSegement: v._highlightResult?.segments?.map(v => {return {id: v?.id?.value, txt: v?.txt?.value}}) // 将algolia的高亮结构体转换成我们自己的SearchIndexSegment
                            .filter(v => v.id?.indexOf(`<${hilighTag}>`) != -1 || v.txt?.indexOf(`<${hilighTag}>`) != -1) // 过滤掉没有高亮的搜索结果
        } as SearchResult
      })
    }
    return []
  }
}

export default SearchService
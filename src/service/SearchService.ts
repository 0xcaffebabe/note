import SearchResult from '@/dto/SearchResult';
import algoliasearch from 'algoliasearch'
import { SearchResponse } from '@algolia/client-search';
import SearchIndexSegment from '@/dto/search/SearchIndexSegement';
import Cacheable from '@/decorator/Cacheable';
import Cache from '@/decorator/Cache'
import SearchSuggestion from '@/dto/search/SearchSuggestion';
import { text } from 'stream/consumers';

interface DocHits {
  url: string,
  createTime: string,
  segments: SearchIndexSegment[]
}

const hilighTag = 'mark'
const cache = Cache()

function kwContains(kw: string, txt: string): boolean{
  if (!txt) {
    return false
  }
  const kwList = kw.trim().split(' ').filter(v => v);
  for(let i of kwList) {
    if (txt.replace(/<[^>]+>/ig, '').indexOf(i) != -1) {
      return true;
    }
  }
  return false;
}

class SearchService implements Cacheable{
  private static instance: SearchService;

  private constructor(){}

  public static getInstance(){
    if(!this.instance) {
      this.instance = new SearchService();
    }
    return this.instance;
  }

  name(): string {
    return 'search-service'
  }

  @cache
  public async search(kw: string): Promise<SearchResult[]> {
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
          .filter(v => kwContains(kw, v.id || '') || kwContains(kw, v.txt || '')) // 过滤掉搜索结果没有关键词的结果
        } as SearchResult
      })
    }
    return []
  }

  @cache
  public async getQuerySuggestions(kw: string = ''): Promise<SearchSuggestion[]> {
    const client = algoliasearch('K9I7PAT3CY', '8f3ec5043331dedbccce916154fc0162');
    const index = client.initIndex('note_query_suggestions');
    const hits: SearchResponse<SearchSuggestion> = await index.search(kw, {hitsPerPage: 100});
    if (hits) {
      return hits.hits;
    }
    return [];
  }

}

export default SearchService.getInstance()
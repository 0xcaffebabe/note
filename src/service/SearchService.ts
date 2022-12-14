import SearchResultItem from '@/dto/search/SearchResultItem';
import algoliasearch from 'algoliasearch'
import { SearchResponse } from '@algolia/client-search';
import SearchIndexSegment from '@/dto/search/SearchIndexSegement';
import Cacheable from '@/decorator/Cacheable';
import Cache from '@/decorator/Cache'
import SearchSuggestion from '@/dto/search/SearchSuggestion';
import { text } from 'stream/consumers';
import axios from 'axios';
import SearchResult from '@/dto/search/SearchResult';

interface DocHits {
  url: string,
  createTime: string,
  segments: SearchIndexSegment[]
}

const hilighTag = 'mark'
const cache = Cache()

const splitRegx = /,|，|\s+/

function kwContains(kw: string, txt: string): boolean{
  if (!txt) {
    return false
  }
  const kwList = kw.trim().split(splitRegx).filter(v => v);
  for(let i of kwList) {
    if (txt.replace(/<[^>]+>/ig, '').toLowerCase().indexOf(i.toLowerCase()) != -1) {
      return true;
    }
  }
  return false;
}

function appendMissingKw(segement: SearchIndexSegment, kw: string): SearchIndexSegment {
  const kwList = kw.trim().split(splitRegx).filter(v => v);
  for(let i of kwList) {
    if (segement.id.replace(/<[^>]+>/ig, '').toLowerCase().indexOf(i.toLowerCase()) == -1 &&
          segement.txt.replace(/<[^>]+>/ig, '').toLowerCase().indexOf(i.toLowerCase()) == -1) {
      if (!segement.missingKeywords) {
        segement.missingKeywords = [i]
      }else {
        segement.missingKeywords.push(i);
      }
    }
  }
  return segement;
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
  public async search(kw: string, type: 'es' | 'algolia' = 'es'): Promise<SearchResult> {
    if (type == 'es') {
      return this.searchInSelfES(kw)
    }
    const client = algoliasearch('K9I7PAT3CY', '8f3ec5043331dedbccce916154fc0162');
    const index = client.initIndex('note');
    const hits : SearchResponse<DocHits> = await index.search(kw, { hitsPerPage: 200, highlightPreTag: `<${hilighTag}>`, highlightPostTag: `</${hilighTag}>` });
    if (hits) {
      let result = hits.hits.map(v => {
        return {
          url: v.url,
          hilighedUrl: v._highlightResult?.url?.value,
          createTime: v.createTime,
          hilighedSegement: v._highlightResult?.segments?.map(v => {return {id: v?.id?.value, txt: v?.txt?.value} as SearchIndexSegment}) // 将algolia的高亮结构体转换成我们自己的SearchIndexSegment
          .filter(v => v.id?.indexOf(`<${hilighTag}>`) != -1 || v.txt?.indexOf(`<${hilighTag}>`) != -1) // 过滤掉没有高亮的搜索结果
          .filter(v => kwContains(kw, v.id || '') || kwContains(kw, v.txt || '')) // 过滤掉搜索结果没有关键词的结果
          .map(v => appendMissingKw(v, kw)) // 添加搜索结果中没有出现的关键词
        } as SearchResultItem
      })
      // 过滤掉目录名没有包含关键词且没有搜索结果的纪录
      result = result.filter(v => (v.hilighedSegement && v.hilighedSegement.length != 0) || kwContains(kw, v.url))
      return {took:hits.processingTimeMS ,list: result}
    }
    return {took:0, list: []}
  }

  public async searchInSelfES(kw: string): Promise<SearchResult> {
    interface ESHits {
      _index: string
      _id: string
      _score: number
      _source: {
        url: string
        objectID: string
        segments: SearchIndexSegment[]
        createTime: string
      },
      highlight: {
        "segments.id"?: string[],
        "segments.txt"?: string[],
        url?: string[],
      }
    }
    const serviceUrl = "https://search.ismy.wang"
    const raw = (await axios.get(`${serviceUrl}/search?kw=${encodeURI(kw)}`)).data
    const hits = raw.hits.hits as ESHits[]
    if (hits) {
      const result = hits.map(v => {
        const idList = v.highlight['segments.id']?.map(v => v.replace(/<mark>/gi, '').replace(/<\/mark>/gi, '')) || []
        const txtList = v.highlight['segments.txt']?.map(v => v.replace(/<mark>/gi, '').replace(/<\/mark>/gi, '')) || []
        const urlList = v.highlight.url || []
        return {
          url: v._source.url,
          score: v._score,
          hilighedUrl: urlList[0] || v._source.url,
          createTime: v._source.createTime,
          hilighedSegement: v._source.segments.map(sv => {
            if (v.highlight['segments.id']) {
              for(let i = 0; i < idList.length; i++) {
                sv.id = sv.id.replace(idList[i], v.highlight['segments.id'][i])
              }
            }
            if (v.highlight['segments.txt']) {
              for(let i = 0; i < txtList.length; i++) {
                sv.txt = sv.txt.replace(txtList[i], v.highlight['segments.txt'][i])
              }
            }
            return sv
          })
          .filter(sv => sv.id.indexOf(`<${hilighTag}>`) != -1 || sv.txt.indexOf(`<${hilighTag}>`) != -1) // 过滤掉没有高亮的搜索结果
          .filter(v => kwContains(kw, v.id || '') || kwContains(kw, v.txt || '')) // 过滤掉搜索结果没有关键词的结果
          .map(v => appendMissingKw(v, kw)) // 添加搜索结果中没有出现的关键词
        } as SearchResultItem
      })
      // 过滤掉目录名没有包含关键词且没有搜索结果的纪录
      let i = result.filter(v => (v.hilighedSegement && v.hilighedSegement.length != 0) || kwContains(kw, v.url))
      return {took: raw.took as number, list: i}
    }
    return {took:0, list:[]}
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
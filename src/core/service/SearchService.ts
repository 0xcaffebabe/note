import SearchResultItem from '../domain/search/SearchResultItem'
import SearchIndexSegment from '../domain/search/SearchIndexSegement'
import Cacheable from '../cache/Cacheable'
import Cache from '../cache/Cache'
import type { CachePort } from '../ports/CachePort'
import SearchSuggestion from '../domain/search/SearchSuggestion'
import SearchResult from '../domain/search/SearchResult'
import type { SearchEnginePort } from '../ports'

const hilighTag = 'mark'
const cache = Cache()

const splitRegx = /,|，|\s+/

function kwContains(kw: string, txt: string): boolean {
  if (!txt) {
    return false
  }
  const kwList = kw.trim().split(splitRegx).filter(v => v)
  for (const i of kwList) {
    if (txt.replace(/<[^>]+>/gi, '').toLowerCase().indexOf(i.toLowerCase()) != -1) {
      return true
    }
  }
  return false
}

function appendMissingKw(segement: SearchIndexSegment, kw: string): SearchIndexSegment {
  const kwList = kw.trim().split(splitRegx).filter(v => v)
  for (const i of kwList) {
    if (segement.id.replace(/<[^>]+>/gi, '').toLowerCase().indexOf(i.toLowerCase()) == -1 &&
      segement.txt.replace(/<[^>]+>/gi, '').toLowerCase().indexOf(i.toLowerCase()) == -1) {
      if (!segement.missingKeywords) {
        segement.missingKeywords = [i]
      } else {
        segement.missingKeywords.push(i)
      }
    }
  }
  return segement
}

/**
 * 全文搜索: 走 SearchEnginePort(Algolia)。高亮过滤 / 关键词补标等结果处理逻辑属 core。
 */
export class SearchService implements Cacheable {
  constructor(private readonly searchEngine: SearchEnginePort, private readonly cache: CachePort) {}

  name(): string {
    return 'search-service'
  }

  @cache
  public async search(kw: string): Promise<SearchResult> {
    const hits = await this.searchEngine.search(kw, {
      hitsPerPage: 200,
      highlightPreTag: `<${hilighTag}>`,
      highlightPostTag: `</${hilighTag}>`,
    })
    if (hits) {
      let result = hits.hits.map(v => {
        return {
          url: v.url,
          hilighedUrl: v._highlightResult?.url?.value,
          createTime: v.createTime,
          hilighedSegement: v._highlightResult?.segments?.map(v => { return { id: v?.id?.value, txt: v?.txt?.value } as SearchIndexSegment }) // 将algolia的高亮结构体转换成我们自己的SearchIndexSegment
            .filter(v => v.id?.indexOf(`<${hilighTag}>`) != -1 || v.txt?.indexOf(`<${hilighTag}>`) != -1) // 过滤掉没有高亮的搜索结果
            .filter(v => kwContains(kw, v.id || '') || kwContains(kw, v.txt || '')) // 过滤掉搜索结果没有关键词的结果
            .map(v => appendMissingKw(v, kw)), // 添加搜索结果中没有出现的关键词
        } as SearchResultItem
      })
      // 过滤掉目录名没有包含关键词且没有搜索结果的纪录
      result = result.filter(v => (v.hilighedSegement && v.hilighedSegement.length != 0) || kwContains(kw, v.url))
      return { took: hits.processingTimeMS, list: result }
    }
    return { took: 0, list: [] }
  }

  @cache
  public async getQuerySuggestions(kw: string = ''): Promise<SearchSuggestion[]> {
    return this.searchEngine.querySuggestions(kw, 100)
  }
}

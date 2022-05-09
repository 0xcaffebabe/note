import SearchResultItem from './SearchResultItem'

export default interface SearchResult {
  // 耗时
  took: number
  // 搜索结果列表
  list: SearchResultItem[]
}
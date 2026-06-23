import SearchIndexSegment from './SearchIndexSegement'

// 一条 Algolia 搜索索引记录(平台无关)。objectID 是主键, 改动即影响线上索引。
export default interface SearchIndexItem {
  url: string
  objectID: string
  segments: SearchIndexSegment[]
  createTime: string
}

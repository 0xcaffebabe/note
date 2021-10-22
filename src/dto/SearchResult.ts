import SearchIndexSegment from "./search/SearchIndexSegement"

export default class SearchResult {
  url: string = ''
  hilighedUrl: string = ''
  createTime: string = ''
  // 经过处理过的高亮结果列表
  hilighedSegement: SearchIndexSegment[] = []
}
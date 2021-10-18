
export default class SearchResult {
  url: string = ''
  body: string = ''
  hilighedUrl: string = ''
  hilighedBody: string = ''

  // 经过处理过的高亮结果列表
  hilighedSegement: string[] = []
}
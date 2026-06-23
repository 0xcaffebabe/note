
export default interface SearchIndexSegment{
  id: string
  txt: string
  // 在搜索条件有的关键词 但在结果里没出现
  missingKeywords?: string[]
}
import QueriesRankedKeywordItem from "./QueriesRankedKeywordItem"

export default interface RelatedQueriesResult {
  default: {
    rankedList: {rankedKeyword: QueriesRankedKeywordItem[]}[]
  }
}
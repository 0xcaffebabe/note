import TopicsRankedKeywordItem from "./TopicsRankedKeywordItem"

export default interface RelatedTopicsResult {
  default: {
    rankedList: {rankedKeyword: TopicsRankedKeywordItem[]}[]
  }
}
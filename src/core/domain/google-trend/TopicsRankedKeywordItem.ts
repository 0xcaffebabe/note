
export default interface TopicsRankedKeywordItem {
  topic: {
    mid: string
    title: string
    type: string
  }
  value: number
  formattedValue: string
  hasData: boolean
  link: string
}
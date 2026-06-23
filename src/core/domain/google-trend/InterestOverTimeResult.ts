import TimeLineDataItem from "./TimeLineDataItem"

export default interface InterestOverTimeResult{
  default: {
    timelineData: TimeLineDataItem[]
    averages: any[]
  }
}
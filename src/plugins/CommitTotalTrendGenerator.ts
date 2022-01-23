import StatisticService from "../build/StatisticService";
import { ResolvedConfig } from "vite"
import fs from "fs";
import UrlConst from "../const/UrlConst";

export default function CommitTotalTrendGenerator(){
  let config : ResolvedConfig;
  return {
    name: "commit-total-trend-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      if (process.env.NOTE_BUILD_COMMIT_TOTAL_TREND) {
        console.log('提交总量趋势构建取消: 环境变量指定')
        return
      }
      console.log('提交总量趋势构建开始')
      StatisticService.generateCommitTotalTrend().then(data => {
        fs.writeFileSync(config.build.outDir + UrlConst.commitTotalTrend, JSON.stringify(data))
        console.log('提交总量趋势构建结束')
      })
    }
  }
}
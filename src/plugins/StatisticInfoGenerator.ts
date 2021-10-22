import fs from "fs";
import { ResolvedConfig } from "vite"
import statisticService from "../build/StatisticService";

export default function StatisticInfoGenerator(){
  let config : ResolvedConfig;
  return {
    name: 'statistic-info-generator',
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      console.log('准备生成统计信息')
      statisticService.generateStatistic().then(info => {
        fs.writeFileSync(config.build.outDir + "/info.json", JSON.stringify(info))
        console.log('统计信息生成完毕')
      })
      console.log('准备生成日历图数据')
      await statisticService.generateYearsCommitHeatmap().then(heatmap => {
        fs.writeFileSync(config.build.outDir + "/commitHeatmap.json", JSON.stringify(heatmap))
        console.log('日历图数据生成完毕')
      })

    }
  }
}
import UrlConst from "../const/UrlConst";
import fs from "fs";
import { ResolvedConfig } from "vite"
import statisticService from "../build/StatisticService";
import BadgeService from "../build/BadgeService";

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
        
        console.log('准备生成字数徽章')
        BadgeService.generate("字数", info.word.total.toLocaleString())
          .then(data => {
            fs.writeFileSync(config.build.outDir + "/wordCountBadge.svg", data)
            console.log('字数徽章生成完成')
          })
      })
      console.log('准备生成日历图数据')
      statisticService.generateYearsCommitHeatmap().then(heatmap => {
        fs.writeFileSync(config.build.outDir + "/commitHeatmap.json", JSON.stringify(heatmap))
        console.log('日历图数据生成完毕')
      })
      console.log('准备生成提交小时热力图数据')
      statisticService.generateCommitHourHeatmap().then(data => {
        fs.writeFileSync(config.build.outDir + UrlConst.hourCommitHeatmap, JSON.stringify(data))
        console.log('提交小时热力图数据生成完毕')
      })

    }
  }
}
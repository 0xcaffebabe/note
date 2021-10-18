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
      const info = await statisticService.generateStatistic()
      fs.writeFileSync(config.build.outDir + "/info.json", JSON.stringify(info))
      console.log('统计信息生成完毕')
    }
  }
}
import StatisticService from "../build/StatisticService";
import { ResolvedConfig } from "vite"
import axios from 'axios'
import fs from "fs";
import UrlConst from "../const/UrlConst";

async function getCommitTotalTrendFromGitHub(): Promise<[string, number, number][]> {
  let tries = 0
  while(tries < 3) {
    try {
      return (await axios.get("https://github.com/0xcaffebabe/note/raw/gh-pages/commitTotalTrend.json")).data
    }catch(err: any) {
      console.log("请求github提交总量趋势异常", err)
    }
    tries++
  }
  return []
}

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
      const data = await getCommitTotalTrendFromGitHub()
      let localGenerate = false
      if (data.length == 0) {
        console.log("github提交总量趋势数据为空 本地生成")
        localGenerate = true
      }else {
        const recentItem = data[data.length - 1]
        const lastTime = new Date(recentItem[0]).getTime()
        const currentTime = new Date().getTime()
        // 距离上一次生成时间大于7天
        if ((currentTime - lastTime) / (3600 * 1000 * 24) >= 7) {
          console.log("提交总量趋势距离最后一次时间大于7天，重新生成")
          localGenerate = true
        }else {
          console.log("提交总量趋势距离最后一次时间小于7天，使用github原始数据")
          fs.writeFileSync(config.build.outDir + UrlConst.commitTotalTrend, JSON.stringify(data))
        }
      }

      if (localGenerate) {
        StatisticService.generateCommitTotalTrend().then(data => {
          fs.writeFileSync(config.build.outDir + UrlConst.commitTotalTrend, JSON.stringify(data))
          console.log('提交总量趋势构建结束')
        })
      }
    }
  }
}
import { ResolvedConfig } from "vite"
import WordCloudService from '../build/WordCloudService'
import fs from 'fs'

export default function WordCloudGenrator(){
  let config : ResolvedConfig;
  return {
    name: 'word-cloud-generator',
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      // build 模式移动doc目录
      if (config.command == 'build') {
        console.log('准备进行词云数据生成')
        const result = await WordCloudService.calcWordFrequency()
        fs.writeFileSync(config.build.outDir + "/wordcloud.json", JSON.stringify(result))
        console.log('词云数据生成完毕')
      }
    }
  }
}
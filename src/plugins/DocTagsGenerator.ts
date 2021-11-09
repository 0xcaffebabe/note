import DocService from "../build/DocService";
import { ResolvedConfig } from "vite"
import fs from "fs";

export default function KnowledgeNetworkGenerator(){
  let config : ResolvedConfig;
  return {
    name: "doc-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      console.log('文章标签数据构建开始')
      const mapping = await DocService.buildTagMapping()
      fs.writeFileSync(config.build.outDir + "/tagMapping.json", JSON.stringify(Array.from(mapping.entries())))
      console.log('文章标签数据构建结束')
    }
  }
}
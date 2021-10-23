import DocService from "../build/DocService";
import { ResolvedConfig } from "vite"
import fs from "fs";

export default function KnowledgeNetworkGenerator(){
  let config : ResolvedConfig;
  return {
    name: "knowledge-network-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      console.log('知识网络构建开始')
      const network = await DocService.generateKnowledgeNetwork()
      fs.writeFileSync(config.build.outDir + "/knowledgeNetwork.json", JSON.stringify(network))
      console.log('知识网络构建结束')
    }
  }
}
import DocService from "../build/DocService";
import { ResolvedConfig } from "vite"
import fs from "fs";
import UrlConst from "../const/UrlConst";

export default function KnowledgeNetworkGenerator(){
  let config : ResolvedConfig;
  return {
    name: "knowledge-network-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      console.log('显式知识网络构建开始')
      DocService.generateKnowledgeNetwork().then(network => {
        fs.writeFileSync(config.build.outDir + "/knowledgeNetwork.json", JSON.stringify(network))
        console.log('显式知识网络构建结束')
      })
      console.log('隐式知识网络构建开始')
      DocService.generatePotentialKnowledgeNetwork().then(network => {
        fs.writeFileSync(config.build.outDir + UrlConst.potentialKnowledgeNetwork, JSON.stringify(network))
        console.log('隐式知识网络构建结束')
      })
    }
  }
}
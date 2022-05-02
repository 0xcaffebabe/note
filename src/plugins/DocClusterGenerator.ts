import DocService from "../build/DocService";
import { ResolvedConfig } from "vite"
import fs from "fs";
import UrlConst from "../const/UrlConst";

export default function DocClusterGenrator(){
  let config : ResolvedConfig;
  return {
    name: "doc-cluster-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      console.log('文档聚类构建开始')
      DocService.getDocCluster().then(cluster => {
        fs.writeFileSync(config.build.outDir + UrlConst.docClusterJson, JSON.stringify(cluster))
        console.log('文档聚类构建开始')
      })
    }
  }
}
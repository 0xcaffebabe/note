import DocService from "../build/DocService";
import { ResolvedConfig } from "vite"
import fs from "fs";
import UrlConst from "../const/UrlConst";

export default function DescCommitDocListGenerator(){
  let config : ResolvedConfig;
  return {
    name: "desc-commit-doc-list-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      console.log('倒序提交文档列表构建开始')
      DocService.generateDocListOrderByLastCommit().then(docs => {
        fs.writeFileSync(config.build.outDir + UrlConst.descCommitTimeDocList, JSON.stringify(docs))
        console.log('倒序提交文档列表构建结束')
      })
    }
  }
}
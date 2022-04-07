import CategoryService from "../build/CategoryService";
import { ResolvedConfig } from "vite"
import fs from "fs";
import UrlConst from "../const/UrlConst";

export default function CategoryJsonGenrator(){
  let config : ResolvedConfig;
  return {
    name: "category-json-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      console.log('目录构建开始')
      CategoryService.getCategoryList().then(category => {
        fs.writeFileSync(config.build.outDir + UrlConst.category, JSON.stringify(category))
        console.log('目录构建结束')
      })
    }
  }
}
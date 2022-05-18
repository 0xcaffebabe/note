import { ResolvedConfig } from "vite"
import fs from "fs";
import apiMappings from "./ApiMappings";
import UrlConst from "../const/UrlConst";

export default function DataGenerator(){
  let config : ResolvedConfig;
  return {
    name: "data-generator",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    async buildStart(options: any) {
      for(let api of apiMappings) {
        if (!api.type || api.type?.indexOf("build") == -1) {
          continue
        }
        console.log(`${api.name}构建开始`)
        api.method().then((data: any) => {
          fs.writeFileSync(config.build.outDir + api.path, JSON.stringify(data))
          console.log(`${api.name}构建结束`)
        })
        .catch((err:any) => {
          console.error(`${api.name}构建异常: ${err}`)
        })
      }
    }
  }
}
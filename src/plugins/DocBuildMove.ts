import { ResolvedConfig } from "vite"
import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import rimraf from 'rimraf'
import BaseService from "../build/BaseService"
import DocService from '../build/DocService'

function ensureDirectoryExistence(filePath: string) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

export default function DocBuildMove(){
  let config : ResolvedConfig;
  return {
    name: "doc-build-move",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    buildStart(options: any) {
      // build 模式移动doc目录
      if (config.command == 'build') {
        console.log("doc-build-move 清空outDir")
        rimraf.sync(config.build.outDir + "/*")
        shell.mkdir(config.build.outDir)
        console.log("doc-build-move 移动doc目录")
        shell.cp("-R", "doc/*","./" + config.build.outDir)
        // 生成md文件对应的json
        for (let item of BaseService.listAllMdFile()) {
          DocService.getFileInfo(item)
            .then(info => {
              let filename = item
              if (filename.startsWith('doc/')) {
                filename = filename.substring(4)
              }
              const fileFullName = `${config.build.outDir}/${filename}.json`
              ensureDirectoryExistence(fileFullName)
              fs.writeFileSync(fileFullName, JSON.stringify(info))
              console.log("doc-build-move " + fileFullName + " 完成")
            })
        }
      }
    }
  }
}
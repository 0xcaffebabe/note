import { ResolvedConfig } from "vite"
import fs from 'fs'
import path from 'path'
import { rimrafSync } from 'rimraf'
import BaseService from "../build/BaseService"
import DocService from '../build/DocService'
import PathUtils from "../util/PathUtils"
import { marked } from "marked"

function ensureDirectoryExistence(filePath: string) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function getSummaryHtml() {
  const content = fs.readFileSync("./doc/SUMMARY.md").toString()
  const renderer = new marked.Renderer();
  return marked(content, {
    renderer: renderer
  }).replaceAll(/\.\//gi, '/').replaceAll(/\.md/gi, '.html')
}

export default function DocBuildMove(){
  let config : ResolvedConfig;
  const summaryHtml = getSummaryHtml()
  return {
    name: "doc-build-move",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
    },
    transformIndexHtml(html: String) {
      return html.replace('{summary}', summaryHtml)
    },
    async buildStart(options: any) {
      // build 模式移动doc目录
      if (config.command == 'build') {
        console.log("doc-build-move 清空outDir")
        rimrafSync(config.build.outDir + "/*")
        PathUtils.ensureDirectoryExistence(config.build.outDir)
        console.log("doc-build-move 移动doc目录")
        for(let sourceFile of BaseService.listAllFile('doc')) {
          const targetFilename = config.build.outDir + '/' + sourceFile.replace('doc/', '')
          PathUtils.ensureDirectoryExistence(targetFilename)
          fs.promises.readFile(sourceFile)
            .then(data => fs.promises.writeFile(targetFilename, data))
        }
        // 生成md文件对应的json,html
        for (let item of BaseService.listAllMdFile()) {
          DocService.getFileInfo(item)
            .then(info => {
              let filename = item
              if (filename.startsWith('doc/')) {
                filename = filename.substring(4)
              }
              const jsonFileFullName = `${config.build.outDir}/${filename}.json`
              ensureDirectoryExistence(jsonFileFullName)
              fs.promises.writeFile(jsonFileFullName, JSON.stringify(info)).then(() => console.log("doc-build-move " + jsonFileFullName + " 生成完成"))
              

              const htmlFileFullName = `${config.build.outDir}/${filename.replace('.md', '')}.html`

              const renderer = new marked.Renderer();
              let html = marked(info.content, {
                renderer: renderer
              })
              html = html.replaceAll(/\.md/gi, '.html')
              html = `
              <!DOCTYPE html>
              <html lang="zh">
                <head>
                  <meta charset="UTF-8">
                  <title>${info.name}</title>
                  <meta name="description" content="">
                </head>
                <script>
                  window.location = '/#/doc/${info.id}'
                </script>
                <body>
                  <div class='menu'>
                    ${summaryHtml}
                  </div>
                  <div class='content'>
                    ${html}
                  </div>
                </body>
              </html>
              `
              fs.promises.writeFile(htmlFileFullName, html).then(() => console.log("doc-build-move " + htmlFileFullName + " 生成完成"))
              
            })
        }
      }
    }
  }
}
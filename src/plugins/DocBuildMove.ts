import { ResolvedConfig } from "vite"
import fs from 'fs'
import path from 'path'
import { rimrafSync } from 'rimraf'
import BaseService from "../build/BaseService"
import DocService from '../build/DocService'
import PathUtils from "../util/PathUtils"
import { marked } from "marked"
import DocFileInfo from "@/dto/DocFileInfo"
import {JSDOM} from 'jsdom';

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
  return (marked(content, {
    renderer: renderer
  }) as string).replaceAll(/\.\//gi, '/').replaceAll(/\.md/gi, '.html')
}

const dom = new JSDOM()

function generalHtmlContent(summaryHtml: string, info: DocFileInfo) {
  const renderer = new marked.Renderer()
  renderer.text = (text) => text.text
  let html = marked(info.content, {
    renderer: renderer
  }) as string
  html = html.replaceAll(/\.md/gi, '.html')
  html = html.replaceAll(/\n/gi, '')
  dom.window.document.body.innerHTML = `<!DOCTYPE html><body>${html}</body></html>`
  let text = dom.window.document.body.textContent || ''
  text = text.replace(/\n/ig, '')
  return `
  <!DOCTYPE html>
  <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <title>${info.name}</title>
      <meta name="description" content="${text.substring(0, Math.min(100, text.length))}...">
    </head>
    <script>
      if (!/bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)) {
        window.location = '/#/doc/${info.id}'
      }
    </script>
    <body>
      <div class='content'>
      ${html}
      </div>
      <div class='menu'>
        ${summaryHtml}
      </div>
    </body>
  </html>
  `
}

export default function DocBuildMove(){
  let config : ResolvedConfig;
  const summaryHtml = getSummaryHtml().replace(/\n/ig, '')
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
              if (filename == 'README.md') {
                info.content = fs.readFileSync('./readme_template.md').toString().replace('{{SUMMARY}}', fs.readFileSync("./doc/SUMMARY.md").toString())
              }
              const jsonFileFullName = `${config.build.outDir}/${filename}.json`
              ensureDirectoryExistence(jsonFileFullName)
              fs.promises.writeFile(jsonFileFullName, JSON.stringify(info)).then(() => console.log("doc-build-move " + jsonFileFullName + " 生成完成"))
              

              const htmlFileFullName = `${config.build.outDir}/${filename.replace('.md', '')}.html`

              const html = generalHtmlContent(summaryHtml, info)
              fs.promises.writeFile(htmlFileFullName, html).then(() => console.log("doc-build-move " + htmlFileFullName + " 生成完成"))
              
            })
        }
      }
    }
  }
}
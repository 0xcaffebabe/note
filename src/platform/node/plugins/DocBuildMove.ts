import { ResolvedConfig } from "vite"
import fs from 'fs'
import BaseService from "../build/BaseService"
import DocService from '../build/DocService'
import PathUtils from "../util/PathUtils"
import DocFileInfo from "../../../core/domain/DocFileInfo"
import { StaticHtmlService } from "../../../core/service/doc/StaticHtmlService"
import { nodeMarkdown } from "../../../adapters/node/NodeMarkdownAdapter"
import { nodeDomParser } from "../../../adapters/node/NodeDomParser"

// SSR/SEO 静态 html 生成已下沉 core/service/doc/StaticHtmlService(marked/jsdom 经端口注入);
// 本插件只剩 vite 生命周期 + fs 读写; 用 node 适配器装配该服务。
const staticHtmlService = new StaticHtmlService(nodeMarkdown, nodeDomParser)

function getSummaryHtml() {
  return staticHtmlService.renderSummaryLinks(fs.readFileSync("./doc/SUMMARY.md").toString())
}

/**
 * 以构建产物index.html为模板 生成文档对应的静态html(逻辑在 core StaticHtmlService)。
 * 保留本导出名: 现有 closeBundle 调用点与 DocBuildMove.test 不变。
 */
export function generalHtmlContent(template: string, info: DocFileInfo, preloadTags: string = '', jsonPath: string = '') {
  return staticHtmlService.buildStaticHtml(template, info, preloadTags, jsonPath)
}

export default function DocBuildMove(){
  let config : ResolvedConfig;
  const summaryHtml = getSummaryHtml().replace(/\n/ig, '')
  // buildStart收集到的文档信息 closeBundle生成html时复用 避免二次解析
  let pendingInfos: Promise<{filename: string, info: DocFileInfo}>[] = []
  return {
    name: "doc-build-move",
    async configResolved(rconfig: ResolvedConfig) {
      config = rconfig
      // 清空必须在 configResolved 完成: 其他插件的 buildStart 会异步往 outDir 写文件,
      // 若清空动作晚于这些写入, 先完成的文件会被误删
      if (config.command == 'build') {
        console.log("doc-build-move 清空outDir")
        fs.rmSync(config.build.outDir, { recursive: true, force: true })
        PathUtils.ensureDirectoryExistence(config.build.outDir)
      }
    },
    transformIndexHtml(html: String) {
      return html.replace('{summary}', summaryHtml)
    },
    async buildStart(options: any) {
      // build 模式移动doc目录
      if (config.command == 'build') {
        console.log("doc-build-move 移动doc目录")
        for(let sourceFile of BaseService.listAllFile('doc')) {
          const targetFilename = config.build.outDir + '/' + sourceFile.replace('doc/', '')
          PathUtils.ensureDirectoryExistence(targetFilename)
          fs.promises.readFile(sourceFile)
            .then(data => fs.promises.writeFile(targetFilename, data))
        }
        // 生成md文件对应的json html在closeBundle生成(需要以构建产物index.html为模板)
        pendingInfos = []
        for (let item of BaseService.listAllMdFile()) {
          pendingInfos.push(DocService.getFileInfo(item)
            .then(info => {
              let filename = item
              if (filename.startsWith('doc/')) {
                filename = filename.substring(4)
              }
              if (filename == 'README.md') {
                info.content = fs.readFileSync('./readme_template.md').toString().replace('{{SUMMARY}}', fs.readFileSync("./doc/SUMMARY.md").toString())
              }
              const jsonFileFullName = `${config.build.outDir}/${filename}.json`
              PathUtils.ensureDirectoryExistence(jsonFileFullName)
              fs.promises.writeFile(jsonFileFullName, JSON.stringify(info)).then(() => console.log("doc-build-move " + jsonFileFullName + " 生成完成"))
              return {filename, info}
            }))
        }
      }
    },
    async closeBundle() {
      if (config.command != 'build') {
        return
      }
      const templateFile = `${config.build.outDir}/index.html`
      if (!fs.existsSync(templateFile)) {
        console.warn("doc-build-move 未找到构建产物index.html 跳过文档html生成")
        return
      }
      const template = fs.readFileSync(templateFile).toString()
      // history路由fallback: GitHub Pages对不存在的路径(/m/**等)返回404.html
      await fs.promises.writeFile(`${config.build.outDir}/404.html`, template)
      console.log("doc-build-move 404.html 生成完成")
      // 应用页面静态入口: /home.html /tag.html (替换值用函数形式 避免$模式解释)
      const siteName = template.match(/<title>([^<]*)<\/title>/)?.[1] || ''
      const appPages = [
        { file: 'home.html', title: '首页' },
        { file: 'tag.html', title: '标签' },
        { file: 'catalog.html', title: '浏览总目录' },
        { file: 'cluster.html', title: '知识聚类' },
      ]
      await Promise.all(appPages.map(({file, title}) => {
        const html = template.replace(/<title>[^<]*<\/title>/, () => `<title>${title} - ${siteName}</title>`)
        return fs.promises.writeFile(`${config.build.outDir}/${file}`, html)
          .then(() => console.log(`doc-build-move ${file} 生成完成`))
      }))
      // 文档页直达加载链是 entry→App→DocPage 的串行瀑布 为确定会用到的chunk注入预加载提示
      let preloadTags = ''
      try {
        const resourceDir = `${config.build.outDir}/resource`
        const resourceFiles = fs.readdirSync(resourceDir)
        const preloadJs = resourceFiles.filter(f => /^(App|DocPage)-.+\.js$/.test(f))
        const preloadCss = resourceFiles.filter(f => /^(App|DocPage)-.+\.css$/.test(f))
        preloadTags = [
          ...preloadJs.map(f => `<link rel="modulepreload" href="/resource/${f}">`),
          ...preloadCss.map(f => `<link rel="preload" as="style" href="/resource/${f}">`),
        ].join('\n  ')
      } catch (e) {
        console.warn('doc-build-move 预加载标签生成失败 跳过', e)
      }
      const infos = await Promise.all(pendingInfos)
      await Promise.all(infos.map(({filename, info}) => {
        const htmlFileFullName = `${config.build.outDir}/${filename.replace('.md', '')}.html`
        PathUtils.ensureDirectoryExistence(htmlFileFullName)
        const jsonPath = '/' + encodeURI(`${filename}.json`)
        const html = generalHtmlContent(template, info, preloadTags, jsonPath)
        return fs.promises.writeFile(htmlFileFullName, html).then(() => console.log("doc-build-move " + htmlFileFullName + " 生成完成"))
      }))
    }
  }
}

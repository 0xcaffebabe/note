import { ResolvedConfig } from "vite"
import fs from 'fs'
import path from 'path'
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

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 以构建产物index.html为模板 生成文档对应的静态html
 * 该html是完整的SPA入口(含构建后的js/css标签) 直接访问/xx/xx.html即进入对应文档页
 * 正文以可见的.static-content直出(即时首屏 兼顾爬虫) Vue挂载完成后由main.ts移除
 */
function generalHtmlContent(template: string, info: DocFileInfo, preloadTags: string = '', jsonPath: string = '') {
  const renderer = new marked.Renderer()
  renderer.text = (text) => text.text
  let html = marked(info.content, {
    renderer: renderer
  }) as string
  html = html.replaceAll(/\.md/gi, '.html')
  // 保留换行: 压成单行会破坏<pre><code>代码块格式 也让view-source不可读
  dom.window.document.body.innerHTML = `<!DOCTYPE html><body>${html}</body></html>`
  let text = dom.window.document.body.textContent || ''
  text = text.replace(/\n/ig, '')
  const description = escapeHtmlText(text.substring(0, Math.min(100, text.length)))
  // 替换值用函数形式: 字符串形式会解释$$/$&等替换模式 文档内容含'$$'(KaTeX)时会被吞掉
  const siteName = escapeHtmlText(template.match(/<title>([^<]*)<\/title>/)?.[1] || '')
  const title = escapeHtmlText(info.name)
  // og/twitter卡片: 让文档链接在微信/Slack/Twitter等处分享时带标题与摘要预览
  const socialMeta = [
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}...">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="${siteName}">`,
    `<meta name="twitter:card" content="summary">`,
  ].join('\n  ')
  // 文档数据json预取: 与js chunk并行下载 缩短可交互时间
  const jsonPreload = jsonPath ? `<link rel="preload" as="fetch" href="${jsonPath}">` : ''
  return template
    .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
    .replace('</head>', () => `<meta name="description" content="${description}...">\n  ${socialMeta}\n  ${preloadTags}\n  ${jsonPreload}\n  </head>`)
    .replace('</body>', () => `<div class='content static-content'>${html}</div></body>`)
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
              ensureDirectoryExistence(jsonFileFullName)
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
        ensureDirectoryExistence(htmlFileFullName)
        const jsonPath = '/' + encodeURI(`${filename}.json`)
        const html = generalHtmlContent(template, info, preloadTags, jsonPath)
        return fs.promises.writeFile(htmlFileFullName, html).then(() => console.log("doc-build-move " + htmlFileFullName + " 生成完成"))
      }))
    }
  }
}

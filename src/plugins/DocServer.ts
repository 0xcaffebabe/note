
import {ViteDevServer} from 'vite'
import fs from 'fs'
import path from 'path'
import mime from 'mime'
import WordCloudService from '../build/WordCloudService'
import GitService from '../build/GitService'
import DocService from '../build/DocService'
import StatisticService from '../build/StatisticService'
import UrlConst from '../const/UrlConst'

interface DocApiItem {
  name: string
  path: string
  method: Function
}

// api 请求映射
const apiMappings: DocApiItem[] = [
  {
    name: '词云数据',
    path: '/wordcloud.json',
    method: async () => WordCloudService.calcWordFrequency()
  },
  {
    name: '统计数据',
    path: '/info.json',
    method: async () => StatisticService.generateStatistic()
  },
  {
    name: '提交日历图数据',
    path: '/commitHeatmap.json',
    method: async () => StatisticService.generateYearsCommitHeatmap()
  },
  {
    name: '小时提交热力图',
    path: UrlConst.hourCommitHeatmap,
    method: async () => StatisticService.generateCommitHourHeatmap()
  },
  {
    name: '显式知识网络',
    path: '/knowledgeNetwork.json',
    method: async () => DocService.generateKnowledgeNetwork()
  },
  {
    name: '隐式知识网络',
    path: UrlConst.potentialKnowledgeNetwork,
    method: async () => DocService.generatePotentialKnowledgeNetwork()
  },
  {
    name: '倒序提交文档列表',
    path: UrlConst.descCommitTimeDocList,
    method: async () => DocService.generateDocListOrderByLastCommit()
  },
  {
    name: '标签映射',
    path: '/tagMapping.json',
    method: async () => Array.from((await DocService.buildTagMapping()).entries())
  },
]

// API请求缓存
const apiCache = new Map<string, any>()

export default function DocServer(){
  return {
    name: "doc-server",
    configureServer(server: ViteDevServer){
      // 处理doc目录下静态资源
      server.middlewares.use((req, res, next) => {
        if (req.originalUrl && req.originalUrl !== '/') {
          const uri = decodeURI(req.originalUrl)
          const fileUri = "./doc" + uri;
          if (!fs.existsSync(fileUri)){
            next()
            return
          }
          if (fileUri.endsWith('.md')) {
            GitService.getFileCommitList(fileUri)
          }
          res.writeHead(200, { 'Content-Type': `${mime.getType(path.extname(uri))};charset=utf8` });
          res.write(fs.readFileSync(fileUri))
          res.end()
        }else{
          next()
        }
      })
      // 处理md文件
      server.middlewares.use(async (req, res, next) => {
        if (req.originalUrl && req.originalUrl.endsWith('.md.json')) {
          const uri = decodeURI(req.originalUrl)
          const mdFileUri = "./doc" + uri.substring(0,uri.lastIndexOf('.'));
          console.log(mdFileUri)
          if (!fs.existsSync(mdFileUri)){
            next()
            return
          }
          res.writeHead(200, { 'Content-Type': `application/json;charset=utf8` });
          res.write(JSON.stringify(await DocService.getFileInfo(mdFileUri)))
          res.end()
        }else{
          next()
        }
      })
      
      // JSON API
      server.middlewares.use(async (req, res, next) => {
        const api = apiMappings.find(v => v.path == req.originalUrl)
        if (api) {
          if (!apiCache.has(api.path)) {
            console.log(`${api.name}为空 生成`)
            apiCache.set(api.path, await api.method())
          }
          res.writeHead(200, { 'Content-Type': `application/json;charset=utf8` });
          res.write(JSON.stringify(apiCache.get(api.path)))
          res.end()
        }else{
          next()
        }
      })
    }
  }
}
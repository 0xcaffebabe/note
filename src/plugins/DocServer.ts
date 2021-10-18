
import {ViteDevServer} from 'vite'
import fs from 'fs'
import path from 'path'
import mime from 'mime'
import WordCloudService from '../build/WordCloudService'
import GitService from '../build/GitService'
import CommitInfo from '@/dto/CommitInfo'
import DocService from '../build/DocService'
import { StatisticInfo } from '@/dto/StatisticInfo'
import StatisticService from '../build/StatisticService'

let wordcloud: [string, number][] = []
let statisticInfo : StatisticInfo
interface DocFileInfo {
  content: string,
  commitList: CommitInfo[]
}

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
      // 处理词云数据
      server.middlewares.use(async (req, res, next) => {
        if (req.originalUrl && req.originalUrl == '/wordcloud.json') {
          if (wordcloud.length == 0) {
            console.log('词云数据为空 生成')
            wordcloud = await WordCloudService.calcWordFrequency()
          }
          res.writeHead(200, { 'Content-Type': `application/json;charset=utf8` });
          res.write(JSON.stringify(wordcloud))
          res.end()
        }else{
          next()
        }
      })
      // 处理统计信息
      server.middlewares.use(async (req, res, next) => {
        if (req.originalUrl && req.originalUrl == '/info.json') {
          if (!statisticInfo) {
            console.log('统计数据为空 生成')
            statisticInfo = await StatisticService.generateStatistic()
          }
          res.writeHead(200, { 'Content-Type': `application/json;charset=utf8` });
          res.write(JSON.stringify(statisticInfo))
          res.end()
        }else{
          next()
        }
      })
    }
  }
}
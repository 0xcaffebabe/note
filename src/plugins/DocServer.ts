
import {ViteDevServer} from 'vite'
import fs from 'fs'
import path from 'path'
import mime from 'mime'
import GitService from '../build/GitService'
import DocService from '../build/DocService'
import ApiMappings from './ApiMappings'
import url from 'url'

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
        const uri = url.parse(req.originalUrl || '', true)
        const api = ApiMappings.find(v => v.path == uri.pathname)
        if (api) {
          if (!apiCache.has(api.path)) {
            console.log(`${api.name}为空 生成`)
            apiCache.set(api.path, await api.method())
          }
          if (uri.query.refresh) {
            console.log(`${api.name} 强制刷新`)
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
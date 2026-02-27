
import {ViteDevServer} from 'vite'
import fs from 'fs'
import path from 'path'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
}

function getMimeType(ext: string): string {
  return MIME_TYPES[ext.toLowerCase()] ?? 'application/octet-stream'
}
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
          res.writeHead(200, { 'Content-Type': `${getMimeType(path.extname(uri))};charset=utf8` });
          res.write(fs.readFileSync(fileUri))
          res.end()
        }else{
          next()
        }
      })
      // 处理md文件
      server.middlewares.use(async (req, res, next) => {
        if (req.originalUrl && req.originalUrl.endsWith('.md.json') && req.method == 'GET') {
          const uri = decodeURI(req.originalUrl)
          let mdFileUri = "./doc" + uri.substring(0,uri.lastIndexOf('.'));
          if (mdFileUri.indexOf('README') != -1) {
            mdFileUri = './readme_template.md'
          }
          console.log(mdFileUri)
          if (!fs.existsSync(mdFileUri)){
            next()
            return
          }
          res.writeHead(200, { 'Content-Type': `application/json;charset=utf8` });
          const st = new Date().getTime()
          const fileInfo = await DocService.getFileInfo(mdFileUri)
          console.log(`获取 ${mdFileUri} 文件信息耗时: ${new Date().getTime() - st}`)
          res.write(JSON.stringify(fileInfo))
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
            try {
              const st = new Date().getTime()
              apiCache.set(api.path, await api.method())
              console.log(`${api.name}生成完毕 耗时 ${new Date().getTime() - st}`)
            }catch(err: any) {
              console.error(err)
            }
          }
          if (uri.query.refresh) {
            console.log(`${api.name} 强制刷新`)
            try {
              apiCache.set(api.path, await api.method())
            }catch(err: any) {
              console.error(err)
            }
          }
          res.writeHead(200, { 'Content-Type': `application/json;charset=utf8` });
          res.write(JSON.stringify(apiCache.get(api.path)|| ""))
          res.end()
        }else{
          next()
        }
      })
    }
  }
}
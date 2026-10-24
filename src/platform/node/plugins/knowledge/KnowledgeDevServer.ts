import type { ViteDevServer } from 'vite'
import type { KnowledgePublication } from '../../../../core/domain/knowledge/KnowledgePublication'

/**
 * 开发服务器的知识资源路由和生成缓存。
 * 同一轮请求共享构建 Promise；Markdown 变化会使缓存失效，旧轮次完成后返回 503，
 * 防止客户端将旧 manifest 与新对象混用。错误和失效均允许后续请求重新生成。
 */
export class KnowledgeDevServer {
  private current: Promise<KnowledgePublication> | undefined
  private generation = 0

  constructor(private readonly generate: () => Promise<KnowledgePublication>) {}

  /** 将失效监听和 /ai/ 路由安装到当前 Vite 开发服务器。 */
  public install(server: ViteDevServer): void {
    server.watcher.on('all', (_event, filename) => {
      if (filename.endsWith('.md') && !filename.includes('/node_modules/')) {
        this.generation++
        this.current = undefined
      }
    })

    server.middlewares.use(async (req, res, next) => {
      const url = (req.url || '').split('?')[0]
      if (!url.startsWith('/ai/')) {
        next()
        return
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405)
        res.end()
        return
      }
      if (!this.isKnowledgeUrl(url)) {
        res.writeHead(404)
        res.end()
        return
      }

      try {
        const version = this.generation
        const { assets } = await this.getPublication()
        if (version !== this.generation) {
          res.writeHead(503, { 'Retry-After': '1' })
          res.end()
          return
        }

        const body = assets.get(url)
        if (!body) {
          res.writeHead(404)
          res.end()
          return
        }

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': url === '/ai/manifest.json'
            ? 'no-cache'
            : 'public, max-age=31536000, immutable',
        })
        res.end(req.method === 'HEAD' ? undefined : body)
      } catch (error) {
        server.config.logger.error(`AI knowledge data generation failed: ${String(error)}`)
        res.writeHead(503)
        res.end('Knowledge data is unavailable')
      }
    })
  }

  private isKnowledgeUrl(url: string): boolean {
    return url === '/ai/manifest.json' || /^\/ai\/objects\/[a-f0-9]{64}\.json$/.test(url)
  }

  private getPublication(): Promise<KnowledgePublication> {
    this.current ||= this.generate().catch(error => {
      this.current = undefined
      throw error
    })
    return this.current
  }
}

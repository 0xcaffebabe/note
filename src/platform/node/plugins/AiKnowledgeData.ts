import type { Plugin, ResolvedConfig } from 'vite'
import fs from 'node:fs/promises'
import path from 'node:path'
import CategoryService from '../build/CategoryService'
import BaseService from '../build/BaseService'
import generateDocCluster from '../scripts/generateDocCluster'
import { buildKnowledgeData } from '../build/AiKnowledgeData'
import { DocContentService } from '../../../core/service/DocContentService'
import { nodeMarkdown } from '../../../adapters/node/NodeMarkdownAdapter'
import { nodeDomParser } from '../../../adapters/node/NodeDomParser'
import { PUBLIC_SEARCH_CONFIG } from '../../../core/config/PublicSearchConfig'

/** Versioned data is emitted by this site build and never bundled into Note Bridge. */
export default function AiKnowledgeData(): Plugin {
  let config: ResolvedConfig
  let current: ReturnType<typeof buildKnowledgeData> | undefined
  let generation = 0
  const content = new DocContentService(nodeMarkdown, nodeDomParser)
  const generate = async () => {
    const categories = await CategoryService.getCategoryList()
    const files = await Promise.all(BaseService.listAllMdFile().map(async filename => {
      let raw = await fs.readFile(filename, 'utf8')
      if (filename === 'README.md') raw = (await fs.readFile('readme_template.md', 'utf8')).replace('{{SUMMARY}}', await fs.readFile('doc/SUMMARY.md', 'utf8'))
      return content.buildFileInfo(filename, raw, [])
    }))
    const graph = files.map(file => ({ id: file.id, links: content.extractKnowledgeLinks(file.content) }))
    const clusters = config.command === 'build'
      ? JSON.parse(await fs.readFile(path.resolve(config.root, config.build.outDir, 'docCluster.json'), 'utf8'))
      : await generateDocCluster.main(true)
    return buildKnowledgeData({ categories, files, graph, clusters, search: PUBLIC_SEARCH_CONFIG })
  }
  return {
    name: 'ai-knowledge-data',
    configResolved(value) { config = value },
    // All existing data buildStart hooks have settled before writeBundle.
    writeBundle: { sequential: true, async handler() {
      const { assets } = await generate()
      const root = path.resolve(config.root, config.build.outDir)
      // Publish immutable resources first and switch the manifest last.
      for (const [url, body] of assets) {
        const filename = path.join(root, url.slice(1))
        await fs.mkdir(path.dirname(filename), { recursive: true })
        await fs.writeFile(filename, body)
      }
      console.log(`ai-knowledge-data: published ${assets.size - 1} immutable resources`)
    } },
    configureServer(server) {
      server.watcher.on('all', (_event, filename) => {
        if (filename.endsWith('.md') && !filename.includes('/node_modules/')) { generation++; current = undefined }
      })
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (!url.startsWith('/ai/')) { next(); return }
        if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return }
        if (url !== '/ai/manifest.json' && !/^\/ai\/objects\/[a-f0-9]{64}\.json$/.test(url)) { res.writeHead(404); res.end(); return }
        try {
          const version = generation
          current ||= generate().catch(error => { current = undefined; throw error })
          const { assets } = await current
          // If a file changed during generation, request a coherent new manifest.
          if (version !== generation) { res.writeHead(503, { 'Retry-After': '1' }); res.end(); return }
          const body = assets.get(url)
          if (!body) { res.writeHead(404); res.end(); return }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': url === '/ai/manifest.json' ? 'no-cache' : 'public, max-age=31536000, immutable' })
          res.end(req.method === 'HEAD' ? undefined : body)
        } catch (error) { server.config.logger.error(`AI knowledge data generation failed: ${String(error)}`); res.writeHead(503); res.end('Knowledge data is unavailable') }
      })
    },
  }
}

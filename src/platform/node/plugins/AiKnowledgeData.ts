import type { Plugin, ResolvedConfig } from 'vite'
import path from 'node:path'
import { buildKnowledgeData } from '../build/AiKnowledgeData'
import { NodeKnowledgeSource } from '../build/knowledge/NodeKnowledgeSource'
import { publishKnowledgeAssets } from './knowledge/KnowledgeAssetPublisher'
import { KnowledgeDevServer } from './knowledge/KnowledgeDevServer'

/**
 * Vite 知识发布入口，只组装数据来源、快照构建和开发/生产输出。
 * 正文及知识网络随站点发布，Note Bridge 独立读取版本化产物。
 */
export default function AiKnowledgeData(): Plugin {
  let config: ResolvedConfig
  let source: NodeKnowledgeSource
  const generate = async () => buildKnowledgeData(await source.load())
  const development = new KnowledgeDevServer(generate)

  return {
    name: 'ai-knowledge-data',
    configResolved(value) {
      config = value
      source = new NodeKnowledgeSource(value)
    },
    // 此时其余 buildStart 钩子已经完成，生产环境的聚类文件可直接读取。
    writeBundle: {
      sequential: true,
      async handler() {
        const { assets } = await generate()
        const outputRoot = path.resolve(config.root, config.build.outDir)
        await publishKnowledgeAssets(outputRoot, assets)
        console.log(`ai-knowledge-data: published ${assets.size - 1} immutable resources`)
      },
    },
    configureServer(server) {
      development.install(server)
    },
  }
}

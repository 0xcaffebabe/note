import fs from 'node:fs/promises'
import path from 'node:path'
import type { ResolvedConfig } from 'vite'
import type DocFileInfo from '../../../../core/domain/DocFileInfo'
import type ClusterNode from '../../../../core/domain/ClusterNode'
import { PUBLIC_SEARCH_CONFIG } from '../../../../core/config/PublicSearchConfig'
import { DocContentService } from '../../../../core/service/DocContentService'
import { nodeMarkdown } from '../../../../adapters/node/NodeMarkdownAdapter'
import { nodeDomParser } from '../../../../adapters/node/NodeDomParser'
import BaseService from '../BaseService'
import CategoryService from '../CategoryService'
import generateDocCluster from '../../scripts/generateDocCluster'
import type { KnowledgeBuildInput } from './KnowledgeBuildInput'

/**
 * 读取站点构建所需的知识来源，集中处理首页模板、分类和聚类的环境差异。
 * 生产聚类由先前构建钩子生成，开发环境按需计算；正文始终来自当前站点源码。
 */
export class NodeKnowledgeSource {
  private readonly content = new DocContentService(nodeMarkdown, nodeDomParser)

  constructor(private readonly config: ResolvedConfig) {}

  /** 加载本次发布的原始数据；资源序列化与磁盘发布由后续阶段负责。 */
  public async load(): Promise<KnowledgeBuildInput> {
    const categories = await CategoryService.getCategoryList()
    const files = await Promise.all(BaseService.listAllMdFile().map(filename => this.readDocument(filename)))
    const graph = files.map(file => ({
      id: file.id,
      links: this.content.extractKnowledgeLinks(file.content),
    }))
    const clusters = await this.loadClusters()

    return {
      categories,
      files,
      graph,
      clusters,
      search: PUBLIC_SEARCH_CONFIG,
    }
  }

  private async readDocument(filename: string): Promise<DocFileInfo> {
    let raw = await fs.readFile(filename, 'utf8')
    if (filename === 'README.md') {
      const template = await fs.readFile('readme_template.md', 'utf8')
      const summary = await fs.readFile('doc/SUMMARY.md', 'utf8')
      raw = template.replace('{{SUMMARY}}', summary)
    }
    return this.content.buildFileInfo(filename, raw, [])
  }

  private async loadClusters(): Promise<ClusterNode[]> {
    if (this.config.command === 'build') {
      const filename = path.resolve(this.config.root, this.config.build.outDir, 'docCluster.json')
      return JSON.parse(await fs.readFile(filename, 'utf8'))
    }
    return generateDocCluster.main(true)
  }
}

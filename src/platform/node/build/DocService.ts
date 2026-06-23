import { DocBuildService } from '../../../core/service/DocBuildService'
import { DocContentService } from '../../../core/service/DocContentService'
import { nodeFileSystem } from '../../../adapters/node/NodeFileSystem'
import { nodeMarkdown } from '../../../adapters/node/NodeMarkdownAdapter'
import { nodeDomParser } from '../../../adapters/node/NodeDomParser'
import { jsYaml } from '../../../adapters/libs/JsYamlAdapter'
import GitService from './GitService'
import CategoryService from './CategoryService'
import generateDocCluster from '../scripts/generateDocCluster'
import CacheService from '../../../core/cache/CacheService'
import type { DocClusterPort } from '../../../core/ports/DocClusterPort'

// 构建期组合根: 把 node 适配器(fs/markdown/dom/yaml)与驱动(GitService 提交历史 /
// CategoryService 目录 / generateDocCluster 聚类驱动)装配进平台无关的 core DocBuildService。
// 文档生成的全部编排与塑形现都在 core; 本文件只剩"端口实现选择 + 装配", 不含业务逻辑。
//
// 聚类是一条重驱动(分词/读文件), 经 DocClusterPort 注入; lazy 箭头避免与 generateDocCluster
// 的循环依赖在模块初始化期触发(generateDocCluster 反过来调本实例的 buildTagMapping/resolveMetadata)。
const clusterPort: DocClusterPort = {
  getDocCluster: () => generateDocCluster.main(true),
  getDocClusterScatter: () => generateDocCluster.generateClusterScatter(),
  getDocTagPrediction: () => generateDocCluster.generateDocTagPrediction(),
}

export default new DocBuildService(
  new DocContentService(nodeMarkdown, nodeDomParser),
  nodeFileSystem,
  GitService,
  jsYaml,
  CategoryService,
  clusterPort,
  new CacheService(),
)

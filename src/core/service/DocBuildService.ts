import Cache from '../cache/Cache'
import Cacheable from '../cache/Cacheable'
import type { CachePort } from '../ports/CachePort'
import type { FileSystemPort } from '../ports/FileSystemPort'
import type { CommitHistoryPort } from '../ports/CommitHistoryPort'
import type { CategoryProviderPort } from '../ports/CategoryProviderPort'
import type { DocClusterPort } from '../ports/DocClusterPort'
import type { YamlPort } from '../ports/YamlPort'
import { DocContentService } from './DocContentService'
import { listFilesBySuffix } from '../fs/FileWalk'
import { countLinkDegrees, buildLinkNameMap } from '../algorithm/KnowledgeGraph'
import { buildRichnessTree } from '../category/RichnessTree'
import { orderByLastCommit } from '../statistic/StatTransforms'
import { foldTagMapping, TagAndFilename } from './doc/TagMapping'
import DocQualityCalculator from '../util/DocQualityCalculator'
import DocUtils from '../util/DocUtils'
import DocFileInfo from '../domain/DocFileInfo'
import CommitInfo from '../domain/CommitInfo'
import { KnowledgeNode, KnowledgeLinkNode } from '../domain/KnowledgeNode'
import ClusterNode from '../domain/ClusterNode'
import ClusterScatter from '../domain/ClusterScatterPoint'
import DocQuality from '../domain/doc/DocQuality'
import KnowledgeRichnessNode from '../domain/KnowledgeRichnessNode'
import { DocMetadata } from '../domain/doc/DocMetadata'
import SearchIndexSegment from '../domain/search/SearchIndexSegement'

const cache = Cache()

// 文档生成大脑(平台无关, 纯编排): 枚举 -> 读取 -> git -> 塑形 全程经端口/注入服务完成,
// 自身不 import 任何 npm 库或 node 适配器。构建期由 build/DocService 组合根用 node 适配器/驱动装配;
// 未来其他运行时只要实现这几个端口(FileSystem/CommitHistory/Yaml/CategoryProvider/DocCluster),
// 即可在该平台自行生成同一套文档数据。纯/确定性的子逻辑均已下沉到 core(DocContentService /
// KnowledgeGraph / RichnessTree / StatTransforms / TagMapping / DocQualityCalculator)。
export class DocBuildService implements Cacheable {
  constructor(
    private readonly content: DocContentService,
    private readonly fs: FileSystemPort,
    private readonly vcs: CommitHistoryPort,
    private readonly yaml: YamlPort,
    private readonly category: CategoryProviderPort,
    private readonly cluster: DocClusterPort,
    private readonly cache: CachePort,
  ) {}

  name(): string {
    return 'doc-build-service'
  }

  @cache
  public async getFileInfo(path: string): Promise<DocFileInfo> {
    const callResult = await Promise.all([this.vcs.getFileCommitList(path), this.fs.readFile(path)])
    return this.content.buildFileInfo(path, callResult[1].toString(), callResult[0])
  }

  public resolveMetadata(content: string): string {
    return this.content.resolveMetadata(content)
  }

  @cache
  public async buildTagMapping(): Promise<Map<string, string[]>> {
    const files = listFilesBySuffix(this.fs, 'md', 'doc')
    const taskList: Promise<TagAndFilename>[] = []
    // 读文件 + yaml 解析经端口完成; 反转聚合下沉 core/service/doc/TagMapping。
    for (let file of files) {
      taskList.push(
        this.fs.readFile(file).then(buffer => {
          const metadata = this.yaml.load(this.resolveMetadata(buffer.toString())) as DocMetadata
          if (!metadata) {
            return { tags: [], filename: file }
          }
          return { tags: metadata.tags, filename: file }
        })
      )
    }
    return foldTagMapping(await Promise.all(taskList))
  }

  public md2text(md: string): string {
    return this.content.md2text(md)
  }

  @cache
  public async getKnowledgeNode(path: string): Promise<KnowledgeNode> {
    return this.fs.readFile(path).then(buffer => {
      const links = this.content.extractKnowledgeLinks(buffer.toString())
      return { id: DocUtils.docUrl2Id(path), links }
    })
  }

  public async getPotentialKnowledgeNode(path: string, map: Map<string, KnowledgeLinkNode>): Promise<KnowledgeNode> {
    return this.fs.readFile(path).then(buffer => {
      const links = this.content.matchPotentialLinks(buffer.toString(), map)
      return { id: DocUtils.docUrl2Id(path), links }
    })
  }

  @cache
  public async getDocCluster(): Promise<ClusterNode[]> {
    return this.cluster.getDocCluster()
  }

  @cache
  public async getDocClusterScatter(): Promise<ClusterScatter> {
    return this.cluster.getDocClusterScatter()
  }

  public async getDocTagPrediction(): Promise<[string, string[]][]> {
    return this.cluster.getDocTagPrediction()
  }

  @cache
  public async generateKnowledgeNetwork(): Promise<KnowledgeNode[]> {
    const ignoreDoc = ['README', 'SUMMARY']
    const fileList = listFilesBySuffix(this.fs, 'md', 'doc')
    const taskList: Promise<KnowledgeNode>[] = []
    for (let file of fileList) {
      taskList.push(this.getKnowledgeNode(file))
    }
    return (await Promise.all(taskList)).filter(v => ignoreDoc.indexOf(v.id) == -1).filter(v => v.links?.length != 0)
  }

  @cache
  public async generateDocQualityData(): Promise<DocQuality[]> {
    const knowledgeNodes = await this.generateKnowledgeNetwork()
    // 内/外链度数统计已下沉 KnowledgeGraph(含已知入度 bug, 逐字保留)
    const { inLinks, outLinks } = countLinkDegrees(knowledgeNodes)

    const ignoreDoc = ['README', 'SUMMARY', '参考文献']
    const fileList = listFilesBySuffix(this.fs, 'md', 'doc')

    // 并行读取所有文件和提交历史(经端口), 按 docId 归集
    const fileContents = new Map<string, string>()
    const commitLists = new Map<string, CommitInfo[]>()
    const fileReadPromises = fileList.map(async file => {
      const content = (await this.fs.readFile(file)).toString()
      fileContents.set(DocUtils.docUrl2Id(file), content)
    })
    const commitPromises = fileList.map(async file => {
      const commitList = await this.vcs.getFileCommitList(file)
      commitLists.set(DocUtils.docUrl2Id(file), commitList)
    })
    await Promise.all([...fileReadPromises, ...commitPromises])

    // 输入装配已下沉 DocContentService(用注入的 cleanText/resolveMetadata, 口径一致)
    const inputDataList = this.content.buildQualityInputList(fileList, fileContents, commitLists, knowledgeNodes, inLinks, outLinks)

    return DocQualityCalculator.calculateBatchQuality(inputDataList)
      .filter(v => ignoreDoc.indexOf(v.id) == -1)
      .sort((a, b) => b.totalQuality - a.totalQuality)
  }

  public async generateDocListOrderByLastCommit(): Promise<[string, CommitInfo][]> {
    const fileList = listFilesBySuffix(this.fs, 'md', 'doc')
    const taskList: Promise<[string, CommitInfo]>[] = []
    for (let file of fileList) {
      taskList.push(this.vcs.getFileLastCommit(file).then(commit => [file, commit]))
    }
    const pairs = await Promise.all(taskList)
    return orderByLastCommit(pairs, ['README', 'SUMMARY'])
  }

  public async generateKnwoledgeRichness(): Promise<KnowledgeRichnessNode[]> {
    const cateList = (await this.category.getCategoryList())
      .filter(v => v.name.indexOf('首页') == -1 && v.name.indexOf('参考文献') == -1 && v.name.indexOf('MyBook') == -1)
    // 结构搭建 + 待读路径枚举已下沉 core/category/RichnessTree; 经 fs 端口读正文回填 size。
    const { roots, reads } = buildRichnessTree(cateList)
    await Promise.all(reads.map(r =>
      this.fs.readFile(r.path).then(data => { r.node.size = data.toString().length })
    ))
    return roots
  }

  public async generatePotentialKnowledgeNetwork(): Promise<KnowledgeNode[]> {
    const explicitKnowlegeNetwork = await this.generateKnowledgeNetwork()
    // 显式网络 -> name 索引(kwNodeMap)已下沉 KnowledgeGraph
    const kwNodeMap = buildLinkNameMap(explicitKnowlegeNetwork)
    const ignoreDoc = ['README', 'SUMMARY']
    const fileList = listFilesBySuffix(this.fs, 'md', 'doc')
    const taskList: Promise<KnowledgeNode>[] = []
    for (let file of fileList) {
      taskList.push(this.getPotentialKnowledgeNode(file, kwNodeMap))
    }
    return (await Promise.all(taskList)).filter(v => ignoreDoc.indexOf(v.id) == -1).filter(v => v.links?.length != 0)
  }

  public md2TextSegement(md: string): SearchIndexSegment[] {
    return this.content.md2TextSegement(md)
  }

  public stringify(html: string): string {
    return this.content.stringify(html)
  }

  public cleanText(text: string): string {
    return this.content.cleanText(text)
  }
}

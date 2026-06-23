import Content from '../domain/Content'
import Cacheable from '../cache/Cacheable'
import Cache from '../cache/Cache'
import type { CachePort } from '../ports/CachePort'
import ReadHistoryItem from '../domain/ReadHistoryItem'
import DocUtils from '../util/DocUtils'
import DocFileInfo from '../domain/DocFileInfo'
import { DocMetadata } from '../domain/doc/DocMetadata'
import DocSegement from '../domain/doc/DocSegement'
import DocQuality from '../domain/doc/DocQuality'
import MindNode from '../domain/mind/MindNode'
import { KnowledgeNode } from '../domain/KnowledgeNode'
import { RelatedLink } from '../domain/RelatedLink'
import type { Api } from '../data/Api'
import type DocRender from '../render/DocRender'
import type { TagService } from './TagService'
import type { KnowledgeNetworkService } from './KnowledgeNetworkService'
import type { StoragePort, DomParserPort, YamlPort } from '../ports'
import { DocReadHistoryService } from './doc/DocReadHistoryService'
import { DocQualityService } from './doc/DocQualityService'
import { DocMetadataService } from './doc/DocMetadataService'
import { DocLinkService } from './doc/DocLinkService'
import { DocRenderService } from './doc/DocRenderService'
import { DocGraphService } from './doc/DocGraphService'

const cache = Cache()
// 以下方法的参数包含整篇文档内容/HTML 用自定义键避免每次缓存查找都序列化大参数
const cacheByFileId = Cache((file: DocFileInfo) => file.id)
const cacheByDocId = Cache((_mdContent: string, docId: string) => docId)
const cacheByHtml = Cache((docHtml: string) => docHtml)

/**
 * 文档服务: 渲染/目录/阅读记录/关联内容/质量评分。
 * api / DocRender / Tag / Knowledge 服务与 Storage/Dom/Yaml 端口全部经构造注入。
 *
 * 实现已按职责拆入 core/service/doc/ 下的聚焦子服务(渲染/阅读记录/质量/图谱相似/tag元数据/链接),
 * 本类对外是不变的瘦门面: 构造函数签名、public 方法签名、@cache 装饰器位置全部保持不变,
 * public 方法仅委托到对应子服务。@cache 仍留在本类 public 方法上, 缓存作用域 id =
 * name()('doc-service') + 方法名, 与拆分前逐字节一致, 故记忆化行为不变。
 */
export class DocService implements Cacheable {
  private readonly readHistorySvc: DocReadHistoryService
  private readonly qualitySvc: DocQualityService
  private readonly metadataSvc: DocMetadataService
  private readonly linkSvc: DocLinkService
  private readonly renderSvc: DocRenderService
  private readonly graphSvc: DocGraphService

  constructor(
    private readonly api: Api,
    private readonly docRender: DocRender,
    private readonly tagService: TagService,
    private readonly knowledgeService: KnowledgeNetworkService,
    private readonly storage: StoragePort,
    private readonly dom: DomParserPort,
    private readonly yaml: YamlPort,
    private readonly cache: CachePort,
  ) {
    this.readHistorySvc = new DocReadHistoryService(this.storage)
    this.qualitySvc = new DocQualityService(this.api)
    this.metadataSvc = new DocMetadataService(this.yaml)
    this.linkSvc = new DocLinkService(this.dom)
    // 渲染链里"对另一被缓存公开方法的再调用"绑定回本类的 @cache 装饰方法,
    // 命中与拆分前相同的缓存作用域(同 id/同键)。
    this.renderSvc = new DocRenderService(
      this.docRender,
      this.tagService,
      this.knowledgeService,
      this.dom,
      this.api,
      {
        resolveMetadata: file => this.resolveMetadata(file),
        getDocFileInfo: id => this.getDocFileInfo(id),
        renderMd: file => this.renderMd(file),
        renderMdFromText: (md, docId) => this.renderMdFromText(md, docId),
        getContent: html => this.getContent(html),
      },
    )
    this.graphSvc = new DocGraphService(this.api, {
      getContentByDocId: id => this.getContentByDocId(id),
      calcQuanlityStr: id => this.calcQuanlityStr(id),
      resolveTagList: file => this.resolveTagList(file),
    })
  }

  name(): string {
    return 'doc-service'
  }

  /**
   * 懒加载文档质量数据
   */
  public ensureQualityLoaded() {
    return this.qualitySvc.ensureQualityLoaded()
  }

  @cache
  public async getDocFileInfo(id: string): Promise<DocFileInfo> {
    return this.renderSvc.getDocFileInfo(id)
  }

  // 取文档时一次性把正文末尾"关联内容(自动生成)"章节抽取为 relatedLinks 并从 content 剥离。
  // 仍以私有方法暴露在实例上(component 测试经 (docService as any).extractRelatedContent 直调)。
  private extractRelatedContent(file: DocFileInfo): void {
    this.renderSvc.extractRelatedContent(file)
  }

  @cacheByFileId
  public renderMdWithStructed(file: DocFileInfo): DocSegement[] {
    return this.renderSvc.renderMdWithStructed(file)
  }

  @cacheByFileId
  public renderMd(file: DocFileInfo): string {
    return this.renderSvc.renderMd(file)
  }

  @cacheByDocId
  public renderMdFromText(mdContent: string, docId: string): string {
    return this.renderSvc.renderMdFromText(mdContent, docId)
  }

  public setDocReadRecrod(doc: string, position: number) {
    return this.readHistorySvc.setDocReadRecrod(doc, position)
  }

  public setLastReadRecord(doc: string) {
    return this.readHistorySvc.setLastReadRecord(doc)
  }

  public getReadHistoryList(): ReadHistoryItem[] {
    return this.readHistorySvc.getReadHistoryList()
  }

  public getLastReadRecord(): string {
    return this.readHistorySvc.getLastReadRecord()
  }

  public getDocReadRecord(doc: string): number {
    return this.readHistorySvc.getDocReadRecord(doc)
  }

  // 不做缓存
  public buildSummaryDocInfo(file: DocFileInfo, knowledgeNetwork?: KnowledgeNode[]): string {
    return this.graphSvc.buildSummaryDocInfo(file, knowledgeNetwork)
  }

  public docUrl2Id(url: string): string {
    return DocUtils.docUrl2Id(url)
  }

  public docId2Url(id: string): string {
    return DocUtils.docId2Url(id)
  }

  @cache
  public async getContentByDocId(id: string): Promise<Content[]> {
    return this.renderSvc.getContentByDocId(id)
  }

  @cacheByHtml
  public getContent(docHtml: string): Content[] {
    return this.renderSvc.getContent(docHtml)
  }

  public getImageUrlList(docHtml: string): string[] {
    return this.linkSvc.getImageUrlList(docHtml)
  }

  public resolveLinkList(docHtml: string): { text: string, link: string }[] {
    return this.linkSvc.resolveLinkList(docHtml)
  }

  public resolveDocLinks(docHtml: string, currentDocId: string, excludeHrefs: string[] = []): RelatedLink[] {
    return this.linkSvc.resolveDocLinks(docHtml, currentDocId, excludeHrefs)
  }

  @cacheByFileId
  public resolveTagList(file: DocFileInfo): string[] {
    return this.metadataSvc.resolveTagList(file)
  }

  @cacheByFileId
  public resolveMetadata(file: DocFileInfo): DocMetadata {
    return this.metadataSvc.resolveMetadata(file)
  }

  public getDocQuality(id: string): DocQuality | null {
    return this.qualitySvc.getDocQuality(id)
  }

  public calcQuanlityStr(id: string): string {
    return this.qualitySvc.calcQuanlityStr(id)
  }

  @cache
  public async generateMindData(id: string): Promise<MindNode> {
    return this.graphSvc.generateMindData(id)
  }

  @cache
  public async getSimliarDoc(id: string): Promise<string[]> {
    return this.graphSvc.getSimliarDoc(id)
  }
}

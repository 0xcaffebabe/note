import DocFileInfo from '../domain/DocFileInfo'
import Cache from '../cache/Cache'
import type { CachePort } from '../ports/CachePort'
import Cacheable from '../cache/Cacheable'
import { StatisticInfo } from '../domain/StatisticInfo'
import DocUtils from '../util/DocUtils'
import { KnowledgeNode } from '../domain/KnowledgeNode'
import UrlUtils from '../util/UrlUtils'
import UrlConst from '../config/UrlConst'
import CommitInfo from '../domain/CommitInfo'
import Category from '../domain/Category'
import ClusterNode from '../domain/ClusterNode'
import ClusterScatter from '../domain/ClusterScatterPoint'
import DocQuality from '../domain/doc/DocQuality'
import KnowledgeRichnessNode from '../domain/KnowledgeRichnessNode'
import type { HttpPort } from '../ports'

// 数据源切换功能已移除: 全站仅从与本文档同源的根路径取数
const baseUrl = () => '/'

const cache = Cache()

/**
 * 数据访问层: 通过注入的 HttpPort 获取预生成的 JSON 数据。
 * 不再是单例 —— 由合成根(浏览器/构建/测试)构造并注入对应的 HttpPort 适配器。
 */
export class Api implements Cacheable {
  constructor(private readonly http: HttpPort, private readonly cache: CachePort) {}

  public name(): string {
    return 'api'
  }

  @cache
  public async getDocFileInfo(id: string): Promise<DocFileInfo> {
    if (!id) {
      throw Error('doc id不得为空')
    }
    id = baseUrl() + DocUtils.docId2Url(id) + '.json'
    const data = await this.http.fetch(id).then(r => r.json())
    if (!data) {
      throw Error('无法获取文档 ' + id)
    }
    return data
  }

  @cache
  public async getCategory(): Promise<DocFileInfo> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.summaryJson)).then(r => r.json())
  }

  @cache
  public async getCompiledCategory(): Promise<Category[]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.category)).then(r => r.json())
  }

  @cache
  public async getWordCloud(): Promise<[string, number][]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.wordcloudJson)).then(r => r.json())
  }

  @cache
  public async getDocCluster(): Promise<ClusterNode[]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.docClusterJson)).then(r => r.json())
  }

  @cache
  public async getDocClusterScatter(): Promise<ClusterScatter> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.docClusterScatterJson)).then(r => r.json())
  }

  @cache
  public async getKnowledgeRichness(): Promise<KnowledgeRichnessNode[]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.knowledgeRichnessJson)).then(r => r.json())
  }

  @cache
  public async getDocTagPrediction(): Promise<[string, string[]][]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.docTagPrediction)).then(r => r.json())
  }

  @cache
  public async getStatisticInfo(): Promise<StatisticInfo> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.statisticInfoUrl)).then(r => r.json())
  }

  @cache
  public async getCommitHeatmap(): Promise<[string, number][]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.yearCommitHeatmapUrl)).then(r => r.json())
  }

  @cache
  public async getHourCommitHeatmap(): Promise<[string, number][]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.hourCommitHeatmap)).then(r => r.json())
  }

  @cache
  public async getKnowledgeNetwork(): Promise<KnowledgeNode[]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.knowledgeNetworkJson)).then(r => r.json())
  }

  @cache
  public async getPotentialKnowledgeNetwork(): Promise<KnowledgeNode[]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.potentialKnowledgeNetwork)).then(r => r.json())
  }

  @cache
  public async getTagMapping(): Promise<[string, string[]][]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.tagMappingJson)).then(r => r.json())
  }

  @cache
  public async getDescCommitDocList(): Promise<[string, CommitInfo][]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.descCommitTimeDocList)).then(r => r.json())
  }

  @cache
  public async getCommitTotalTrend(): Promise<[string, number, number, number][]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.commitTotalTrend)).then(r => r.json())
  }

  @cache
  public async getDocQualityData(): Promise<DocQuality[]> {
    return this.http.fetch(UrlUtils.concatUrl(baseUrl(), UrlConst.docQualityJson)).then(r => r.json())
  }
}

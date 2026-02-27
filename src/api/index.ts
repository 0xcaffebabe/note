import { http } from '@/util/http'
import DocFileInfo from '@/dto/DocFileInfo'
import Cache from '@/decorator/Cache'
import Cacheable from '@/decorator/Cacheable'
import { StatisticInfo } from '@/dto/StatisticInfo'
import DocUtils from '@/util/DocUtils'
import {KnowledgeNode} from '@/dto/KnowledgeNode'
import DatasourceService from '@/service/DatasourceService'
import UrlUtils from '@/util/UrlUtils'
import UrlConst from '@/const/UrlConst'
import CommitInfo from '@/dto/CommitInfo'
import Category from '@/dto/Category'
import ClusterNode from '@/dto/ClusterNode'
import DocQuality from '@/dto/doc/DocQuality'
import KnowledgeRichnessNode from '@/dto/KnowledgeRichnessNode'
// import DocService from '@/service/DocService'

const baseUrl = () => {
  return DatasourceService.getCurrentDatasource().url
}

const cache = Cache()

class Api implements Cacheable{
  private static instance :Api
  public name(): string {
    return 'api'
  }

  private constructor(){}

  @cache
  public async getDocFileInfo(id: string): Promise<DocFileInfo>{
    if (!id) {
      throw Error("doc id不得为空")
    }
    id = baseUrl() + DocUtils.docId2Url(id) + ".json"
    const data = await http(id).then(r => r.json())
    if (!data) {
      throw Error('无法获取文档 ' + id)
    }
    return data
  }


  /**
   *
   * 获取电子书目录
   * @static
   * @memberof Api
   */
  @cache
  public async getCategory() : Promise<DocFileInfo>{
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.summaryJson)).then(r => r.json())
  }

  /**
   *
   * 获取电子书目录(编译过的)
   * @static
   * @memberof Api
   */
  @cache
  public async getCompiledCategory() : Promise<Category[]>{
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.category)).then(r => r.json())
  }


  /**
   *
   * 获取词云数据
   * @static
   * @return {*}  {Promise<[string, number][]>}
   * @memberof Api
   */
  @cache
  public async getWordCloud(): Promise<[string, number][]>{
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.wordcloudJson)).then(r => r.json())
  }

  @cache
  public async getDocCluster(): Promise<ClusterNode[]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.docClusterJson)).then(r => r.json())
  }

  @cache
  public async getKnowledgeRichness(): Promise<KnowledgeRichnessNode[]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.knowledgeRichnessJson)).then(r => r.json())
  }

  @cache
  public async getDocTagPrediction(): Promise<[string, string[]][]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.docTagPrediction)).then(r => r.json())
  }


  /**
   *
   * 获取统计信息
   * @return {*}  {Promise<StatisticInfo>}
   * @memberof Api
   */
  @cache
  public async getStatisticInfo(): Promise<StatisticInfo> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.statisticInfoUrl)).then(r => r.json())
  }

  @cache
  public async getCommitHeatmap(): Promise<[string, number][]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.yearCommitHeatmapUrl)).then(r => r.json())
  }

  /**
   *
   * 获取小时提交热力图
   * @return {*}  {Promise<[string, number][]>}
   * @memberof Api
   */
  @cache
  public async getHourCommitHeatmap(): Promise<[string, number][]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.hourCommitHeatmap)).then(r => r.json())
  }


  /**
   *
   * 获取显式知识网络数据
   * @return {*}  {Promise<KnowledgeNode[]>}
   * @memberof Api
   */
  @cache
  public async getKnowledgeNetwork(): Promise<KnowledgeNode[]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.knowledgeNetworkJson)).then(r => r.json())
  }

  @cache
  public async getPotentialKnowledgeNetwork(): Promise<KnowledgeNode[]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.potentialKnowledgeNetwork)).then(r => r.json())
  }

  @cache
  public async getTagMapping(): Promise<[string,string[]][]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.tagMappingJson)).then(r => r.json())
  }

  @cache
  public async getDescCommitDocList(): Promise<[string, CommitInfo][]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.descCommitTimeDocList)).then(r => r.json())
  }

  @cache
  public async getCommitTotalTrend(): Promise<[string, number, number, number][]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.commitTotalTrend)).then(r => r.json())
  }

  @cache
  public async getDocQualityData(): Promise<DocQuality[]> {
    return http(UrlUtils.concatUrl(baseUrl(), UrlConst.docQualityJson)).then(r => r.json())
  }

  public static getInstance(){
    if (!this.instance) {
      this.instance = new Api()
    }
    return this.instance;
  }
}

export default Api.getInstance()

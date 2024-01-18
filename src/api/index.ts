import axios from 'axios'
import DocFileInfo from '@/dto/DocFileInfo'
import Cache from '@/decorator/Cache'
import Cacheable from '@/decorator/Cacheable'
import { StatisticInfo } from '@/dto/StatisticInfo'
import DocUtils from '@/util/DocUtils'
import {KnowledgeLinkNode, KnowledgeNode} from '@/dto/KnowledgeNode'
import DatasourceService from '@/service/DatasourceService'
import UrlUtils from '@/util/UrlUtils'
import UrlConst from '@/const/UrlConst'
import CommitInfo from '@/dto/CommitInfo'
import YuequeDraft from '@/dto/YuqueDraft'
import Category from '@/dto/Category'
import ClusterNode from '@/dto/ClusterNode'
import DocQuality from '@/dto/doc/DocQuality'
import { SimilarItem } from '@/dto/doc/SimilarItem'
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
    const data = await axios.get(id)
    if (!data.data) {
      throw Error('无法获取文档 ' + id)
    }
    return data.data
  }


  /**
   *
   * 获取电子书目录
   * @static
   * @memberof Api
   */
  @cache
  public async getCategory() : Promise<DocFileInfo>{
    const data = await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.summaryJson))
    return data.data;
  }

  /**
   *
   * 获取电子书目录(编译过的)
   * @static
   * @memberof Api
   */
  @cache
  public async getCompiledCategory() : Promise<Category[]>{
    const data = await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.category))
    return data.data;
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
    const data = await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.wordcloudJson))
    return data.data
  }

  @cache
  public async getDocCluster(): Promise<ClusterNode[]> {
    const data = await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.docClusterJson))
    return data.data
  }

  @cache
  public async getKnowledgeRichness(): Promise<KnowledgeRichnessNode[]> {
    const data = await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.knowledgeRichnessJson))
    return data.data
  }

  @cache
  public async getDocTagPrediction(): Promise<[string, string[]][]> {
    const data = await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.docTagPrediction))
    return data.data
  }


  /**
   *
   * 获取统计信息
   * @return {*}  {Promise<StatisticInfo>}
   * @memberof Api
   */
  @cache
  public async getStatisticInfo(): Promise<StatisticInfo> {
    return this.requestDataUseJsDelivr(UrlConst.statisticInfoUrl)
  }

  @cache
  public async getCommitHeatmap(): Promise<[string, number][]> {
    return this.requestDataUseJsDelivr(UrlConst.yearCommitHeatmapUrl)
  }

  /**
   *
   * 获取小时提交热力图
   * @return {*}  {Promise<[string, number][]>}
   * @memberof Api
   */
  @cache
  public async getHourCommitHeatmap(): Promise<[string, number][]> {
    return this.requestDataUseJsDelivr(UrlConst.hourCommitHeatmap)
  }


  /**
   *
   * 获取显式知识网络数据
   * @return {*}  {Promise<KnowledgeNode[]>}
   * @memberof Api
   */
  @cache
  public async getKnowledgeNetwork(): Promise<KnowledgeNode[]> {
    return (await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.knowledgeNetworkJson))).data
  }

  @cache
  public async getPotentialKnowledgeNetwork(): Promise<KnowledgeNode[]> {
    return (await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.potentialKnowledgeNetwork))).data
  }

  @cache
  public async getTagMapping(): Promise<[string,string[]][]> {
    return (await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.tagMappingJson))).data;
  }

  @cache
  public async getDescCommitDocList(): Promise<[string, CommitInfo][]> {
    return (await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.descCommitTimeDocList))).data;
  }

  @cache
  public async getCommitTotalTrend(): Promise<[string, number, number, number][]> {
    return this.requestDataUseJsDelivr(UrlConst.commitTotalTrend)
  }

  @cache
  public async getDocQualityData(): Promise<DocQuality[]> {
    return (await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.docQualityJson))).data
  }

  @cache
  public async getTextSimilar(): Promise<SimilarItem[]> {
    const result :SimilarItem[] = (await axios.get(UrlUtils.concatUrl(baseUrl(), UrlConst.textSimilarJson))).data
    return result.sort((a, b) => (b.similar || 0) - (a.similar ||0))
  }

  /**
   *
   * 获取instapaper原始html数据
   * @return {*}  {Promise<string>}
   * @memberof Api
   */
  public async getInstapaperRawData(): Promise<string> {
    return (await axios.get("https://proxy.ismy.wang/api/instapaper/list")).data
  }

  public async getYuqueDraft(): Promise<YuequeDraft> {
    const data = (await axios.get("https://proxy.ismy.wang/api/yuque/draft")).data
    return {
      content: data.data.content,
      title: data.data.title,
      updateAt: data.data.content_updated_at
    }
  }

  private async requestDataUseJsDelivr(url: string): Promise<any> {
    const datasources = DatasourceService.getDatasourcesByMatch(v => v.id.indexOf("jsdelivr") != -1)
    for(let datasource of datasources) {
      try {
        return (await axios.get(UrlUtils.concatUrl(datasource.url, url))).data
      }catch(err: any) {
        console.error(err)
      }
    }
  }

  public static getInstance(){
    if (!this.instance) {
      this.instance = new Api()
    }
    return this.instance;
  }
}

export default Api.getInstance()
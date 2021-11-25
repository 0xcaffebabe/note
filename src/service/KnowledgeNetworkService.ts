
import api from "@/api";
import Cache from "@/decorator/Cache";
import Cacheable from "@/decorator/Cacheable";
import { KnowledgeLinkNode } from "@/dto/KnowledgeNode";
const cache  = Cache();

class KnowledgeNetworkService implements Cacheable{

  private static instance: KnowledgeNetworkService

  private links: KnowledgeLinkNode[] = []

  private constructor(){
    this.init();
  }

  private async init(){
    this.links = await this.fetchAllLinks()
  }

  public static getInstance():KnowledgeNetworkService {
    if (!this.instance) {
      this.instance = new KnowledgeNetworkService()
    }
    return this.instance
  }

  name(): string {
    return 'knowledge-network-service'
  }

  /**
   *
   * 获取知识网络所有平铺开的链接
   * @return {*}  {KnowledgeLinkNode[]}
   * @memberof KnowledgeNetworkService
   */
  public getAllLinks(): KnowledgeLinkNode[]{
    return JSON.parse(JSON.stringify(this.links));
  }

  /**
   *
   * 拉取计算知识网络所有平铺开的链接
   * @return {*}  {Promise<KnowledgeLinkNode[]>}
   * @memberof KnowledgeNetworkService
   */
  @cache
  private async  fetchAllLinks(): Promise<KnowledgeLinkNode[]> {
    const network = await api.getKnowledgeNetwork();
    return network.flatMap(v => v.links || [])
  }

}

export default KnowledgeNetworkService.getInstance()
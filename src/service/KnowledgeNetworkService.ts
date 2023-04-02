
import api from "@/api";
import Cache from "@/decorator/Cache";
import Cacheable from "@/decorator/Cacheable";
import { KnowledgeLinkNode, KnowledgeNode } from "@/dto/KnowledgeNode";
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
   * 获取某篇文章的知识链接流
   * @param {string} id
   * @return {*}  {string[][]}
   * @memberof KnowledgeNetworkService
   */
  public async getDocStream(_id: string): Promise<string[][]> {
    const network = await api.getKnowledgeNetwork();
    /*
      算法概要：
      1. 针对当前节点的入节点，不断递归，往上找它们的入边
      2. 针对当前节点的出节点，不断递归，往下找它们的出边
      递归终止条件：入节点或出节点已经遍历过
    */
   
   const travelSet = new Set<string>()
   const inputs: string[][] = []
   const outputs: string[][] = []
   function getNodeInput(id: string) {
     if (travelSet.has(id)) {
      return
     }
     travelSet.add(id)
     const input = network.filter(v => v.links?.some(v => v.id == id)).map(v => v.id)
     if (input.length != 0) {
       inputs.unshift(input)
       input.forEach(getNodeInput)
     }
    }
    function getNodeOutput(id: string) {
      if (travelSet.has(id)) {
        return
      }
      travelSet.add(id)
      const temp = network.filter(v => v.id == id)[0]
      if (!temp) {
        return
      }
      const output = temp.links?.map(v => v.id) || []
      if (output.length != 0) {
        outputs.push(output)
        output.forEach(getNodeOutput)
      }
    }
    getNodeInput(_id)
    travelSet.clear()
    getNodeOutput(_id)
    console.log([...inputs, [_id], ...outputs])
    return [...inputs, [_id], ...outputs]
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
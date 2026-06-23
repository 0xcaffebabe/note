import Cache from '../cache/Cache'
import type { CachePort } from '../ports/CachePort'
import Cacheable from '../cache/Cacheable'
import { KnowledgeLinkNode } from '../domain/KnowledgeNode'
import type { Api } from '../data/Api'

const cache = Cache()

export class KnowledgeNetworkService implements Cacheable {
  private links: KnowledgeLinkNode[] = []

  constructor(private readonly api: Api, private readonly cache: CachePort) {
    this.init()
  }

  private async init() {
    this.links = await this.fetchAllLinks()
  }

  name(): string {
    return 'knowledge-network-service'
  }

  /**
   * 获取知识网络所有平铺开的链接
   */
  public getAllLinks(): KnowledgeLinkNode[] {
    return JSON.parse(JSON.stringify(this.links))
  }

  /**
   * 获取某篇文章的知识链接流
   */
  public async getDocStream(_id: string): Promise<string[][]> {
    const network = await this.api.getKnowledgeNetwork()
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
    return [...inputs, [_id], ...outputs]
  }

  @cache
  private async fetchAllLinks(): Promise<KnowledgeLinkNode[]> {
    const network = await this.api.getKnowledgeNetwork()
    return network.flatMap(v => v.links || [])
  }
}

import Content from '../../domain/Content'
import DocUtils from '../../util/DocUtils'
import DocFileInfo from '../../domain/DocFileInfo'
import { cleanText } from '../../util/StringUtils'
import MindNode from '../../domain/mind/MindNode'
import { MindUtils } from '../../util/MindUtils'
import ClusterNode from '../../domain/ClusterNode'
import { KnowledgeNode } from '../../domain/KnowledgeNode'
import type { Api } from '../../data/Api'

/**
 * 跨方法调用回调: 图谱/相似/摘要会复用另外几个被缓存或落在别的子服务里的方法,
 * 由 DocService 注入(命中同一缓存作用域 / 同一份质量状态), 保持行为逐字节一致。
 */
export interface DocGraphCalls {
  /** -> DocService.getContentByDocId (@cache) */
  getContentByDocId(id: string): Promise<Content[]>
  /** -> DocService.calcQuanlityStr (质量子服务, 读懒加载状态) */
  calcQuanlityStr(id: string): string
  /** -> DocService.resolveTagList (@cacheByFileId) */
  resolveTagList(file: DocFileInfo): string[]
}

/**
 * 文档图谱 / 相似检索 / 摘要子服务。
 *
 * 从 DocService 原样搬出, 行为字节级保持:
 *  - generateMindData: 由文档 TOC 经 MindUtils.mindConvert 取根脑图节点;
 *  - getSimliarDoc: 在聚类树上"向上爬 round 级祖先, 再取该祖先全部后代(去自身)";
 *  - buildSummaryDocInfo(不缓存): 入度/出度 + 创建/更新时间 + 字数 + 质量 + tag 的 HTML 拼接。
 *
 * generateMindData/getSimliarDoc 的外层 @cache 仍由 DocService 负责;
 * buildSummaryDocInfo 原本就不缓存, 此处亦不缓存。
 */
export class DocGraphService {
  constructor(
    private readonly api: Api,
    private readonly calls: DocGraphCalls,
  ) {}

  public async generateMindData(id: string): Promise<MindNode> {
    const toc = await this.calls.getContentByDocId(id)
    const minds = MindUtils.mindConvert(toc)
    return minds[0]
  }

  public async getSimliarDoc(id: string): Promise<string[]> {
    const clusters = await this.api.getDocCluster()
    let node: ClusterNode | null = null
    function travel(root: ClusterNode, round: number[]): [ClusterNode, boolean] {
      if (DocUtils.docUrl2Id(root.name) == id) {
        return [root, true]
      }
      const ret: [ClusterNode, boolean] | null = null
      for (const i of root.children) {
        const r = travel(i, round)
        if (r[1] && round[0] > 0) {
          node = root
          round[0]--
          return r
        }
      }
      return ret || [root, false]
    }
    function all(root: ClusterNode): string[] {
      return [root.name, ...root.children.map(all).flatMap(v => v)].filter(v => v)
    }
    travel(clusters[0], [3])
    if (!node) {
      return []
    }
    return all(node).filter(v => DocUtils.docUrl2Id(v) != id)
  }

  // 不做缓存
  public buildSummaryDocInfo(file: DocFileInfo, knowledgeNetwork?: KnowledgeNode[]): string {
    let inDegree = 0
    let outDegree = 0

    if (knowledgeNetwork) {
      const currentNode = knowledgeNetwork.find(node => node.id === file.id)
      outDegree = currentNode?.links?.length || 0
      inDegree = [...new Set(knowledgeNetwork.filter(node =>
        node.links && node.links.some(link => link.id === file.id)
      ).map(v => v.id))].length
    }

    let connectDegree = ''
    if (knowledgeNetwork) {
      connectDegree = `<div>📈 入度: ${inDegree}, 出度: ${outDegree}</div>`
    }

    return [
      `<p>${file.name}(${file.id})</p>`,
      `<div>创建时间: ${new Date(file.createTime).toLocaleString()}</div>`,
      `<div>最后更新: ${new Date(file.commitList[0].date).toLocaleString()}</div>`,
      `<div>⏰${
        Math.ceil(
          (new Date().getTime() - new Date(file.commitList[0].date).getTime()) / (3600 * 24 * 1000)
        )
      }天前更新, ✏️${cleanText(file.content).length}字, ⚽${this.calls.calcQuanlityStr(file.id)}</div>`,
      `${connectDegree}`,
      `<div>${this.calls.resolveTagList(file) || ''}</div>`,
    ].join('\n')
  }
}

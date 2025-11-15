import { KnowledgeNode } from "@/dto/KnowledgeNode";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";

/**
 * 知识网络数据处理器
 * 基于本质原理：知识网络是知识实体之间关系的图谱化表示
 * 核心价值：通过关系可视化揭示知识间的内在关联性
 */
export class KnowledgeNetworkDataProcessor {
  /**
   * 根据节点数量映射节点颜色
   * @param size 节点数量
   * @returns 颜色值
   */
  static nodeColorMapping(size: number): string {
    if (size <= 20) {
      return '#84c0ff';
    }
    if (size > 20 && size <= 40) {
      return '#409eff';
    }
    return '#1D8CFF';
  }

  /**
   * 构建文档摘要信息
   * @param file 文档文件信息
   * @returns 文档摘要信息字符串
   */
  static buildSummaryDocInfo(file: DocFileInfo): string {
    return DocService.buildSummaryDocInfo(file);
  }

  /**
   * 创建图表节点数据
   * @param knowledgeNetwork 知识网络原始数据
   * @param docId 当前文档ID
   * @param stream 相关文档流
   * @returns 图表节点数组
   */
  static createNodes(
    knowledgeNetwork: KnowledgeNode[],
    docId: string,
    stream: string[]
  ) {
    const uniqueNodeIds = Array.from(
      new Set(
        knowledgeNetwork.flatMap((node) => [
          node.id,
          ...(node.links?.map((linkNode) => linkNode.id) || []),
        ])
      )
    );

    return uniqueNodeIds.map((nodeId) => {
      const relatedNodes = knowledgeNetwork.filter((node) => node.id === nodeId);
      
      return KnowledgeNetworkDataProcessor.createNodeData(nodeId, relatedNodes, docId, stream);
    });
  }

  /**
   * 创建单个节点数据
   * @param nodeId 节点ID
   * @param relatedNodes 关联节点数组
   * @param docId 当前文档ID
   * @param stream 相关文档流
   * @returns 节点数据对象
   */
  private static createNodeData(
    nodeId: string,
    relatedNodes: KnowledgeNode[],
    docId: string,
    stream: string[]
  ) {
    const isCurrentNode = nodeId === docId;
    const isStreamNode = stream.some((streamItem) => streamItem === nodeId);
    
    // 根据节点的扇出数进行颜色映射
    if (relatedNodes.length > 0) {
      return {
        name: nodeId,
        category: isCurrentNode ? 1 : isStreamNode ? 2 : 0,
        symbolSize: 20,
        draggable: true,
        itemStyle: {
          color: isCurrentNode 
            ? '#F56C6C' 
            : isStreamNode 
              ? '#95d475' 
              : KnowledgeNetworkDataProcessor.nodeColorMapping(20 * (1 + (relatedNodes[0].links?.length || 0) / 3))
        }
      };
    } else {
      // 默认节点渲染样式
      return {
        name: nodeId,
        category: isCurrentNode ? 1 : isStreamNode ? 2 : 0,
        symbolSize: 20,
        draggable: true,
        itemStyle: {
          color: isCurrentNode ? '#F56C6C' : isStreamNode ? '#95d475' : KnowledgeNetworkDataProcessor.nodeColorMapping(20)
        }
      };
    }
  }

  /**
   * 创建图表边数据
   * @param knowledgeNetwork 知识网络原始数据
   * @returns 图表边数组
   */
  static createLinks(knowledgeNetwork: KnowledgeNode[]) {
    const links: any[] = [];
    
    for (const node of knowledgeNetwork) {
      if (node.links) {
        for (const link of node.links) {
          links.push({
            target: node.id,
            source: link.id,
            value: decodeURI(link.headingId ? "#" + link.headingId : "-")
          });
        }
      }
    }
    
    return links;
  }

  /**
   * 根据度数过滤知识网络节点
   * @param knowledgeNetwork 原始知识网络
   * @param docId 当前文档ID
   * @param degree 过滤度数
   * @returns 过滤后的知识网络
   */
  static filterByDegree(knowledgeNetwork: KnowledgeNode[], docId: string, degree: number) {
    const direct: KnowledgeNode[] = knowledgeNetwork.filter(
      node => node.id === docId || node.links?.find(link => docId === link.id)
    );
    
    for (let i = 0; i < degree; i++) {
      const list = knowledgeNetwork.filter(node => 
        direct.some(d => d.id === node.id) || 
        node.links?.find(link => direct.some(d => d.id === link.id))
      );
      
      direct.push(...list);
      direct.push(...list.flatMap(node => node.links || []).filter(link => direct.some(d => d.id === link.id)));
    }
    
    return direct;
  }

  /**
   * 构建节点映射表
   * @param nodes 节点数组
   * @returns 节点名到索引的映射
   */
  static buildNodeMap(nodes: any[]) {
    return new Map(nodes.map((node, index) => [node.name, index]));
  }
  
  /**
   * 根据当前文档ID过滤知识网络(隐式网络)
   * @param knowledgeNetwork 原始知识网络
   * @param docId 当前文档ID
   * @returns 过滤后的知识网络
   */
  static filterByCurrentDoc(knowledgeNetwork: KnowledgeNode[], docId: string) {
    return knowledgeNetwork
      .filter(node => node.id === docId || node.links?.find(link => link.id === docId))
      .map(node => {
        if (node.id !== docId) {
          node.links = node.links?.filter(link => link.id === docId);
        }
        return node;
      });
  }
}
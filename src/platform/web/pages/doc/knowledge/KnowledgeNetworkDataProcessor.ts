import { KnowledgeNode } from "@/core/domain/KnowledgeNode";
import DocFileInfo from "@/core/domain/DocFileInfo";
import DocService from "@/platform/web/service/DocService";
import CategoryService from "@/platform/web/service/CategoryService";
import Category from "@/core/domain/Category";
import { COLOR_PALETTE } from "@/core/util/ColorGenerator";
import DocUtils from "@/core/util/DocUtils";
import * as KnowledgeGraph from "@/core/algorithm/KnowledgeGraph";

/**
 * 知识网络数据处理器
 * 基于本质原理：知识网络是知识实体之间关系的图谱化表示
 * 核心价值：通过关系可视化揭示知识间的内在关联性
 */
export class KnowledgeNetworkDataProcessor {
  // 缓存的顶级分类列表
  private static topLevelCategories: string[] = [];
  // 颜色映射缓存
  private static colorMappingCache: { [key: string]: string } = {};
  // 标记是否已初始化
  private static isInitialized: boolean = false;

  // static COLOR_PALETTE = ColorGen

  /**
   * 初始化顶级分类列表
   */
  static async initializeTopLevelCategories(): Promise<void> {
    if (this.isInitialized) {
      return; // 如果已经初始化，直接返回
    }

    try {
      const categories = await CategoryService.getCompiledCategoryList();
      this.topLevelCategories = categories.map(category => category.name);


      this.topLevelCategories.forEach((category, index) => {
        this.colorMappingCache[category] = COLOR_PALETTE[index % COLOR_PALETTE.length];
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize top level categories:', error);
    }
  }

  /**
   * 根据文档名称进行分类
   * @param nodeId 文档ID
   * @returns 文档分类
   */
  static getDocCategory(nodeId: string): string {
    return DocUtils.docCategory(nodeId);
  }

  /**
   * 根据文档分类映射节点颜色
   * @param category 文档分类
   * @returns 颜色值
   */
  static categoryColorMapping(name: string): string {
    // 如果已经初始化，则使用缓存的颜色映射
    if (this.isInitialized && this.colorMappingCache[name]) {
      return this.colorMappingCache[name];
    }

    // 如果该分类在顶级分类列表中，返回对应的颜色
    const topLevelCategoryIndex = this.topLevelCategories.findIndex(cat => cat === name);
    if (topLevelCategoryIndex !== -1 && this.isInitialized) {
      // 如果缓存中还没有颜色，则生成一个
      if (!this.colorMappingCache[name]) {
        this.colorMappingCache[name] = COLOR_PALETTE[topLevelCategoryIndex % COLOR_PALETTE.length];
      }
      return this.colorMappingCache[name];
    }

    // 如果以上都不匹配，使用哈希算法计算颜色
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const idx = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[idx];
  }

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
   * @param knowledgeNetwork 知识网络数据用于计算入度和出度
   * @returns 文档摘要信息字符串
   */
  static buildSummaryDocInfo(file: DocFileInfo, knowledgeNetwork?: KnowledgeNode[]): string {
    return DocService.buildSummaryDocInfo(file, knowledgeNetwork);
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
    const category = KnowledgeNetworkDataProcessor.getDocCategory(nodeId);
    const color = isCurrentNode
      ? '#000000' // 黑色 - 当前节点
      : KnowledgeNetworkDataProcessor.categoryColorMapping(category); // 使用文档分类颜色

    // 根据节点的扇出数进行颜色映射
    if (relatedNodes.length > 0) {
      return {
        name: nodeId,
        category: 0,
        symbolSize: 20,
        draggable: true,
        itemStyle: {
          color: color
        },
        // 保存分类信息用于图表配置
        docCategory: category
      };
    } else {
      // 默认节点渲染样式
      return {
        name: nodeId,
        category: 0,
        symbolSize: 20,
        draggable: true,
        itemStyle: {
          color: color
        },
        // 保存分类信息用于图表配置
        docCategory: category
      };
    }
  }

  /**
   * 创建图表边数据
   * @param knowledgeNetwork 知识网络原始数据
   * @returns 图表边数组
   */
  static createLinks(knowledgeNetwork: KnowledgeNode[]) {
    return KnowledgeGraph.createLinks(knowledgeNetwork);
  }

  /**
   * 根据度数过滤知识网络节点
   * @param knowledgeNetwork 原始知识网络
   * @param docId 当前文档ID
   * @param degree 过滤度数
   * @returns 过滤后的知识网络
   */
  static filterByDegree(knowledgeNetwork: KnowledgeNode[], docId: string, degree: number) {
    return KnowledgeGraph.filterByDegree(knowledgeNetwork, docId, degree);
  }

  /** 构建节点名到索引的映射 */
  static buildNodeMap(nodes: any[]) {
    return KnowledgeGraph.buildNodeMap(nodes);
  }

  /** 根据当前文档ID过滤知识网络(隐式网络) */
  static filterByCurrentDoc(knowledgeNetwork: KnowledgeNode[], docId: string) {
    return KnowledgeGraph.filterByCurrentDoc(knowledgeNetwork, docId);
  }
}
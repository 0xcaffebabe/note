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
   * 根据文档名称进行分类
   * @param nodeId 文档ID
   * @returns 文档分类
   */
  static getDocCategory(nodeId: string): string {
    const parts = nodeId.split('-');
    return parts.length > 0 ? parts[0] : 'other';
  }

  /**
   * 根据文档分类映射节点颜色
   * @param category 文档分类
   * @returns 颜色值
   */
  static categoryColorMapping(name: string): string {
    const COLOR_PALETTE = ["#9575CD", "#7986CB",
      "#64B5F6", "#4DB6AC", "#81C784",
      "#AED581", "#FFD54F", "#FFB74D", "#A1887F", "#90A4AE",
      "#9C27B0", "#673AB7", "#3F51B5", "#2196F3",
      "#00BCD4", "#009688", "#4CAF50", "#8BC34A"
    ];

    const colorMapping: { [key: string]: string } = {
      '算法与数据结构': COLOR_PALETTE[0],
      '数学': COLOR_PALETTE[1],
      '操作系统': COLOR_PALETTE[2],
      '软件工程': COLOR_PALETTE[3],
      '计算机系统': COLOR_PALETTE[4],
      '数字逻辑电路': COLOR_PALETTE[5],
      '计算机网络': COLOR_PALETTE[6],
      '编译原理': COLOR_PALETTE[7],
      'DSL': COLOR_PALETTE[8],
      '数据技术': COLOR_PALETTE[9],
      '中间件': COLOR_PALETTE[10],
      '音视频开发': COLOR_PALETTE[11],
      '开发工具': COLOR_PALETTE[12],
      '产品': COLOR_PALETTE[13],
      '其他': COLOR_PALETTE[14],
      '个人成长': COLOR_PALETTE[15],
      '通识': COLOR_PALETTE[16],
      '运维': COLOR_PALETTE[17],
      '编程语言': COLOR_PALETTE[18],
    };

    if (colorMapping[name]) {
      return colorMapping[name];
    }
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const idx = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[idx];
  }

  /**
   * 将HSL颜色转换为十六进制颜色
   * @param h 色相 (0-360)
   * @param s 饱和度 (0-100)
   * @param l 亮度 (0-100)
   * @returns 十六进制颜色值
   */
  private static hslToHex(h: number, s: number, l: number): string {
    // 将HSL转换为RGB
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1, -1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');   // 转换为2位十六进制
    };
    return `#${f(0)}${f(8)}${f(4)}`;
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
      ? '#F56C6C' // 红色 - 当前节点
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
    if (degree < 0) return [];

    // 构建邻接表，将图转换为无向图（因为不考虑方向）
    const adjacencyMap = new Map<string, Set<string>>();
    const nodeMap = new Map<string, KnowledgeNode>();

    // 填充邻接表和节点映射
    knowledgeNetwork.forEach(node => {
      nodeMap.set(node.id, node);
      if (!adjacencyMap.has(node.id)) {
        adjacencyMap.set(node.id, new Set<string>());
      }

      // 添加当前节点指向的节点
      if (node.links) {
        node.links.forEach(link => {
          adjacencyMap.get(node.id)!.add(link.id);

          // 由于图是无向的，也要添加反向连接
          if (!adjacencyMap.has(link.id)) {
            adjacencyMap.set(link.id, new Set<string>());
          }
          adjacencyMap.get(link.id)!.add(node.id);
        });
      }
    });

    // BFS算法
    const visited = new Set<string>();
    const queue: { nodeId: string, currentDegree: number }[] = [{ nodeId: docId, currentDegree: 0 }];
    visited.add(docId);

    // 记录需要返回的节点
    const resultNodes = new Set<string>();
    resultNodes.add(docId); // 添加起始节点

    while (queue.length > 0) {
      const { nodeId, currentDegree } = queue.shift()!;

      // 如果当前度数等于目标度数，将节点添加到结果集中
      if (currentDegree === degree) {
        resultNodes.add(nodeId);
        continue; // 不再继续扩展这个节点
      }

      // 如果当前度数已经超过目标度数，则跳过
      if (currentDegree > degree) {
        continue;
      }

      // 获取当前节点的所有邻居
      const neighbors = adjacencyMap.get(nodeId) || new Set<string>();

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, currentDegree: currentDegree + 1 });

          // 如果当前度数小于目标度数，则也将该节点添加到结果中（保持连接性）
          if (currentDegree < degree) {
            resultNodes.add(neighborId);
          }
        }
      }
    }

    // 将结果ID集合转换为知识节点数组，保留原有的连接信息
    // 但仅包括在结果中的节点的连接
    const result: KnowledgeNode[] = [];
    for (const id of resultNodes) {
      const originalNode = nodeMap.get(id);
      if (originalNode) {
        // 过滤掉不在结果中的连接节点
        const filteredLinks = originalNode.links?.filter(link => resultNodes.has(link.id)) || [];
        result.push({
          ...originalNode,
          links: filteredLinks
        });
      }
    }
    return result;
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
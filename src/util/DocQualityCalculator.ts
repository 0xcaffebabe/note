import DocQuality from "../dto/doc/DocQuality";
import { KnowledgeNode } from "../dto/KnowledgeNode";
import CommitInfo from "../dto/CommitInfo";

// 输入数据结构定义
export interface QualityInputData {
  contentLength: number;
  outLinksCount: number;
  inLinksCount: number;
  commitList: CommitInfo[];
  metadata: string;
  knowledgeNodes: KnowledgeNode[];
  docId: string;
}

// 质量计算配置
export interface QualityCalculationConfig {
  contentWeight: number;
  inboundLinkWeight: number;
  outboundLinkWeight: number;
  commitWeight: number;
  updateActivityWeight: number;
  pagerankWeight: number;
  maxContentScore: number;
  maxLinkScore: number;
  maxCommitScore: number;
  maxUpdateActivityScore: number;
  maxPagerankScore: number;
}

// 默认配置
export const DEFAULT_QUALITY_CONFIG: QualityCalculationConfig = {
  contentWeight: 0.25,
  inboundLinkWeight: 0.2,
  outboundLinkWeight: 0.15,
  commitWeight: 0.15,
  updateActivityWeight: 0.15,
  pagerankWeight: 0.1,
  maxContentScore: 10,
  maxLinkScore: 10,
  maxCommitScore: 10,
  maxUpdateActivityScore: 5,
  maxPagerankScore: 5
};

/**
 * 文档质量计算器
 * 封装所有文档质量计算逻辑
 */
export default class DocQualityCalculator {
  
  /**
   * 计算文档质量分数
   * @param inputData 输入数据
   * @param config 计算配置
   * @returns DocQuality 包含质量分数的对象
   */
  public static calculateQuality(
    inputData: QualityInputData,
    config: QualityCalculationConfig = DEFAULT_QUALITY_CONFIG
  ): DocQuality {
    const docQuality = new DocQuality();
    docQuality.id = inputData.docId;
    
    // 计算各项指标分数
    const contentScore = this.calculateContentScore(inputData.contentLength, config);
    const linkScore = this.calculateLinkScore(
      inputData.outLinksCount,
      inputData.inLinksCount,
      config
    );
    const commitScore = this.calculateCommitScore(inputData.commitList.length, config);
    const updateActivityScore = this.calculateUpdateActivityScore(inputData.commitList, config);
    const pagerankScore = this.calculatePageRankScore(inputData.docId, inputData.knowledgeNodes, config);
    
    // 综合计算最终质量分数
    docQuality.quality = (
      contentScore * config.contentWeight +
      linkScore * (config.inboundLinkWeight + config.outboundLinkWeight) +
      commitScore * config.commitWeight +
      updateActivityScore * config.updateActivityWeight +
      pagerankScore * config.pagerankWeight
    );
    
    // 分别保存各项指标分数
    docQuality.contentQuality = contentScore;
    docQuality.linkQuality = linkScore;
    docQuality.updateActivity = updateActivityScore;
    
    return docQuality;
  }
  
  /**
   * 计算内容质量分数
   * @param contentLength 内容长度
   * @param config 计算配置
   * @returns 内容质量分数
   */
  private static calculateContentScore(contentLength: number, config: QualityCalculationConfig): number {
    // 基础长度分数，限制最大值避免超长文档影响平衡
    let baseScore = Math.min(contentLength / 1000, config.maxContentScore);
    
    // 根据内容长度调整分数
    if (contentLength < 200) {
      baseScore *= 0.5; // 过短文档减分
    } else if (contentLength > 10000) {
      baseScore *= 1.1; // 长文档加分，但有上限
    }
    
    return baseScore;
  }
  
  /**
   * 计算链接质量分数
   * @param outboundLinks 外链数量
   * @param inboundLinks 内链数量
   * @param config 计算配置
   * @returns 链接质量分数
   */
  private static calculateLinkScore(
    outboundLinks: number,
    inboundLinks: number,
    config: QualityCalculationConfig
  ): number {
    // 外链和内链权重不同，内链通常更有价值
    const outboundScore = outboundLinks * config.outboundLinkWeight;
    const inboundScore = inboundLinks * config.inboundLinkWeight;
    
    // 计算总链接分数，限制最大值
    const totalLinkScore = outboundScore + inboundScore;
    return Math.min(totalLinkScore, config.maxLinkScore);
  }
  
  /**
   * 计算提交质量分数
   * @param commitCount 提交次数
   * @param config 计算配置
   * @returns 提交质量分数
   */
  private static calculateCommitScore(commitCount: number, config: QualityCalculationConfig): number {
    // 使用对数函数，避免提交次数过多影响平衡
    const baseScore = Math.log10(commitCount + 1) * 2;
    return Math.min(baseScore, config.maxCommitScore);
  }
  
  /**
   * 计算更新活跃度分数
   * @param commitList 提交历史列表
   * @param config 计算配置
   * @returns 更新活跃度分数
   */
  private static calculateUpdateActivityScore(commitList: CommitInfo[], config: QualityCalculationConfig): number {
    if (commitList.length === 0) return 0;
    
    const now = new Date();
    let recentScore = 0;
    
    for (const commit of commitList) {
      const commitDate = new Date(commit.date);
      const daysDiff = (now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // 越近的提交权重越高
      if (daysDiff <= 30) { // 一个月内
        recentScore += 1.0;
      } else if (daysDiff <= 90) { // 三个月内
        recentScore += 0.5;
      } else if (daysDiff <= 365) { // 一年内
        recentScore += 0.2;
      }
    }
    
    return Math.min(recentScore, config.maxUpdateActivityScore); // 限制活跃度分数上限
  }
  
  /**
   * 计算页面排名分数（简化版）
   * @param docId 当前文档ID
   * @param allNodes 所有知识节点
   * @param config 计算配置
   * @returns 页面排名分数
   */
  private static calculatePageRankScore(docId: string, allNodes: KnowledgeNode[], config: QualityCalculationConfig): number {
    // 实现简化版的PageRank算法
    const initialRank = 1.0;
    const damping = 0.85;
    const iterations = 10;
    
    let rank = new Map<string, number>();
    for (const node of allNodes) {
      rank.set(node.id, initialRank / allNodes.length);
    }
    
    for (let i = 0; i < iterations; i++) {
      const newRank = new Map<string, number>();
      for (const node of allNodes) {
        let rankScore = (1 - damping) / allNodes.length;
        for (const otherNode of allNodes) {
          if (otherNode.links.some(link => link.id === node.id)) {
            const outDegree = otherNode.links.length || 1;
            rankScore += damping * (rank.get(otherNode.id) || 0) / outDegree;
          }
        }
        newRank.set(node.id, rankScore);
      }
      rank = newRank;
    }
    
    return Math.min(rank.get(docId) || 0, config.maxPagerankScore);
  }
  
  /**
   * 批量计算文档质量
   * @param inputDataList 输入数据列表
   * @param config 计算配置
   * @returns DocQuality 数组
   */
  public static calculateBatchQuality(
    inputDataList: QualityInputData[],
    config: QualityCalculationConfig = DEFAULT_QUALITY_CONFIG
  ): DocQuality[] {
    return inputDataList.map(data => this.calculateQuality(data, config));
  }
}
/**
 * 知识断代指数: 衡量更新分布的最长空窗占整体时间跨度的比例。纯算法 + 阈值分级。
 * 对应 KnowledgeScatter.calculateKnowledgeGapIndex / getGapIndexLevelClass / getGapIndexInterpretation。
 */

export interface KnowledgeGap {
  /** 断代指数 = 最长空窗 / 时间跨度 (0~1) */
  index: number
  /** 最长空窗天数 */
  maxGap: number
  /** 空窗起点(距最老更新的天数) */
  gapStart: number
  /** 空窗终点(距最老更新的天数) */
  gapEnd: number
}

/**
 * @param spanDays 整体时间跨度(天)
 * @param freshnessDays 各文档"距最老更新"的天数序列
 */
export function computeKnowledgeGap(spanDays: number, freshnessDays: number[]): KnowledgeGap {
  const sorted = [...freshnessDays].sort((a, b) => a - b)
  let maxGap = 0, gapStart = 0, gapEnd = 0
  for (let i = 1; i < sorted.length; i++) {
    const g = sorted[i] - sorted[i - 1]
    if (g > maxGap) {
      maxGap = g
      gapStart = sorted[i - 1]
      gapEnd = sorted[i]
    }
  }
  const index = spanDays > 0 ? maxGap / spanDays : 0
  return { index, maxGap, gapStart, gapEnd }
}

/** 断代指数 → 等级样式类。 */
export function gapLevelClass(index: number): string {
  if (index < 0.25) return 'low-gap'
  if (index < 0.5) return 'medium-gap'
  if (index < 0.75) return 'high-gap'
  return 'critical-gap'
}

/** 断代指数 → 文字解释。 */
export function gapInterpretation(index: number): string {
  if (index < 0.25) return '更新分布均匀，知识体系连续性良好'
  if (index < 0.5) return '存在一定空窗期，部分时段更新停滞'
  if (index < 0.75) return '断层较明显，有较长时间未沉淀新内容'
  return '存在严重断层，大段时期知识更新停滞，建议补充'
}

/** 通用数学工具。纯函数。 */

/** 中位数: 空数组返回 0; 偶数个取中间两数均值。对应 KnowledgeScatter.median。 */
export function median(nums: number[]): number {
  if (!nums.length) {
    return 0
  }
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

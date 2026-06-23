
export function cloneDeep(obj: any) {
    return JSON.parse(JSON.stringify(obj))
}

/**
 * 趋势数据"绝对量 → 相对量": 对 [label, a, b, c] 行, 逐项与前一行求差(从尾向头, 避免覆盖待用前值)。
 * 就地修改并返回(调用方通常先 cloneDeep)。对应 CommitTotalTrend.buildOption。
 */
export function toRelativeTrend(rows: [string, number, number, number][]): [string, number, number, number][] {
  for (let i = rows.length - 1; i > 0; i--) {
    rows[i][1] -= rows[i - 1][1]
    rows[i][2] -= rows[i - 1][2]
    rows[i][3] -= rows[i - 1][3]
  }
  return rows
}

/**
 * 降序取前 N, 其余合并:返回 { top: 前N项(原对象), restTotal: 其余项 value 之和 }。
 * 纯数据聚合, 不含视觉(颜色由调用方决定)。对应 CodeFrequency.buildOption。
 */
export function topNAndRest<T>(items: T[], n: number, valueOf: (item: T) => number): { top: T[]; restTotal: number } {
  const sorted = [...items].sort((a, b) => valueOf(b) - valueOf(a))
  const top = sorted.slice(0, n)
  const restTotal = sorted.slice(n).reduce((sum, v) => sum + valueOf(v), 0)
  return { top, restTotal }
}

/**
 * 把 [小时字符串, 次数][] 补全为 0..23 的 [小时, 次数][](缺失补 0)。对应 HourCommitHeatmap.buildOption。
 */
export function fillHourBuckets(rawArr: [string, number][]): [number, number][] {
  const raw = new Map<string, number>(rawArr)
  const data: [number, number][] = []
  for (let i = 0; i < 24; i++) {
    data.push([i, raw.get(i.toString()) || 0])
  }
  return data
}

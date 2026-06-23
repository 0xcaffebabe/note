/**
 * 日期工具: 把散落在各组件里的日期差/相对时间/本地化格式化逻辑收归到 core。
 * 每个函数对应原组件里的具体口径, 保持行为逐字节一致(仅去重, 不改语义)。
 * 纯逻辑(仅用 Date/Math 内置), 无框架/浏览器依赖。
 */

const DAY_MS = 24 * 3600 * 1000

/** floor 口径的"距今天数"; 非法日期返回 NaN。(Banner / HomeQuickAccess) */
export function daysSince(date: string | number | Date): number {
  const diffMs = Date.now() - new Date(date).getTime()
  return Math.floor(diffMs / DAY_MS)
}

/**
 * 相对时间标签(天/月/年粒度): 今天 / N 天前 / N 个月前 / N 年前。
 * 非法日期返回空串。对应 Banner.vue 与 HomeQuickAccess.vue 中字节相同的 relativeDateLabel。
 */
export function relativeLabel(date: string): string {
  const days = daysSince(date)
  if (isNaN(days)) {
    return ''
  }
  if (days <= 0) {
    return '今天'
  }
  if (days < 30) {
    return `${days} 天前`
  }
  if (days < 365) {
    return `${Math.floor(days / 30)} 个月前`
  }
  return `${Math.floor(days / 365)} 年前`
}

/**
 * 更细粒度相对时间(含"周"): 今天 / N 天前 / N 周前 / N 个月前 / N 年前。
 * 对应 KnowledgeReviewer.vue 的 formatRelative(以毫秒比较, <1天为今天)。
 */
export function relativeLabelWithWeek(dateStr: string): string {
  const diff = new Date().getTime() - new Date(dateStr).getTime()
  if (diff < DAY_MS) return '今天'
  const days = Math.floor(diff / DAY_MS)
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 周前`
  if (days < 365) return `${Math.floor(days / 30)} 个月前`
  return `${Math.floor(days / 365)} 年前`
}

/** commitList 里最新一次提交距今的天数(ceil 口径)。对应 CategoryItemContent.calcLastUpdate。 */
export function ceilDaysSinceLatest(dates: string[]): number {
  const latest = dates
    .map(Date.parse)
    .sort((a, b) => a - b)
    .reverse()[0]
  return Math.ceil((new Date().getTime() - latest) / DAY_MS)
}

/** 本地化年月日(zh-CN 两位数), 非法/空日期返回空串。对应 HomeQuickAccess.absoluteDateLabel 与 KnowledgeScatter.formatDate。 */
export function localeDateCN(date: string | Date): string {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) {
    return ''
  }
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** 本地化日期(默认 locale), 空串/非法日期降级为占位符 '—'。对应 Statistic.formatDate。 */
export function localeDateOrDash(date: string): string {
  if (!date) {
    return '—'
  }
  const d = new Date(date)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

/** 本地化日期(默认 locale)。用于模板内联的 new Date(x).toLocaleDateString()。 */
export function localeDate(date: string | number | Date): string {
  return new Date(date).toLocaleDateString()
}

/** 本地化日期时间(默认 locale)。用于模板内联的 new Date(x).toLocaleString()。 */
export function localeDateTime(date: string | number | Date): string {
  return new Date(date).toLocaleString()
}

/** 按"距今天数"映射 Element-Plus badge 语义类型(越近越热)。对应 CategoryItemContent.calcUpdateType。 */
export function updateBadgeType(days: number): string {
  if (days <= 10) return 'danger'
  if (days <= 30) return 'warning'
  if (days <= 100) return 'success'
  if (days <= 300) return 'info'
  return 'primary'
}

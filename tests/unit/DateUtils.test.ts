import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  daysSince, relativeLabel, relativeLabelWithWeek, ceilDaysSinceLatest, localeDateCN, localeDateOrDash,
} from '@/core/util/DateUtils'

// 固定"现在"为 2026-06-21T00:00:00Z, 让相对时间断言确定
const NOW = new Date('2026-06-21T00:00:00Z').getTime()
beforeEach(() => vi.useFakeTimers().setSystemTime(NOW))
afterEach(() => vi.useRealTimers())

const daysAgo = (n: number) => new Date(NOW - n * 86400000).toISOString()

describe('daysSince', () => {
  it('整天数(floor), 非法日期为 NaN', () => {
    expect(daysSince(daysAgo(5))).toBe(5)
    expect(daysSince(daysAgo(0))).toBe(0)
    expect(Number.isNaN(daysSince('not-a-date'))).toBe(true)
  })
})

describe('relativeLabel (天/月/年, Banner/HomeQuickAccess 口径)', () => {
  it('今天/天/月/年 分档', () => {
    expect(relativeLabel(daysAgo(0))).toBe('今天')
    expect(relativeLabel(daysAgo(5))).toBe('5 天前')
    expect(relativeLabel(daysAgo(29))).toBe('29 天前')
    expect(relativeLabel(daysAgo(60))).toBe('2 个月前')
    expect(relativeLabel(daysAgo(400))).toBe('1 年前')
  })
  it('非法日期空串', () => {
    expect(relativeLabel('xxx')).toBe('')
  })
})

describe('relativeLabelWithWeek (含周, KnowledgeReviewer 口径)', () => {
  it('今天/天/周/月/年 分档', () => {
    expect(relativeLabelWithWeek(daysAgo(0))).toBe('今天')
    expect(relativeLabelWithWeek(daysAgo(3))).toBe('3 天前')
    expect(relativeLabelWithWeek(daysAgo(14))).toBe('2 周前')
    expect(relativeLabelWithWeek(daysAgo(60))).toBe('2 个月前')
    expect(relativeLabelWithWeek(daysAgo(400))).toBe('1 年前')
  })
})

describe('ceilDaysSinceLatest (取最新提交, ceil)', () => {
  it('取最大时间戳后 ceil 天数', () => {
    expect(ceilDaysSinceLatest([daysAgo(10), daysAgo(3), daysAgo(7)])).toBe(3)
  })
})

describe('localeDateCN / localeDateOrDash', () => {
  it('localeDateCN: 合法日期给字符串, 非法给空串', () => {
    expect(localeDateCN('2026-01-02')).not.toBe('')
    expect(localeDateCN('bad')).toBe('')
  })
  it('localeDateOrDash: 空/非法降级为 —', () => {
    expect(localeDateOrDash('')).toBe('—')
    expect(localeDateOrDash('bad')).toBe('—')
    expect(localeDateOrDash('2026-01-02')).not.toBe('—')
  })
})

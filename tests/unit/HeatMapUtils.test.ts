import { describe, it, expect } from 'vitest'
import HeatMapUtils from '@/pages/home/statistic/HeatMapUtils'

// 热力图(贡献日历)的纯数据装配工具。两个职责:
//   1) fillTimeRange: 把稀疏的「日期->次数」补齐成连续日序列, 缺失日补 0;
//      区间用 [start, end) 半开 —— 末日不含(已存在的 off-by-one), 单元素退化为 [];
//      同一天重复出现靠 Map 折叠(后者覆盖前者)。
//   2) generatePieces: 给 echarts visualMap 生成「恒为 6 段」的分段配色;
//      首段锁死在 0, 其余按 quotient=ceil(maxValue/2) 步进, isDark 切换两套品牌蓝调色板。
// 这层一旦错位, 日历会丢首/尾格、颜色档与数值对不上 —— 是视觉正确性的底座, 故逐分支锁定。
//
// 日期断言一律用 ISO 'YYYY-MM-DD' 字符串:源码 formatDate 走 toISOString(), 解析与回读均按 UTC,
// 与本机时区无关(已跨 TZ 验证), 不会因运行环境漂移。

describe('fillTimeRange 把稀疏日历补齐为连续日序列', () => {
  it('区间为半开 [start, end): 2024-01-01..2024-01-05 只到 01-04(锁定 off-by-one 现状)', () => {
    // 已知 BUG: 循环 time < end 导致末日(区间右端点)被排除, 贡献日历会少最后一格。
    //          锁定现状, 待修复(改为 <= end)后更新断言。
    const result = HeatMapUtils.fillTimeRange([
      ['2024-01-01', 1],
      ['2024-01-05', 9],
    ])
    expect(result).toEqual([
      ['2024-01-01', 1],
      ['2024-01-02', 0],
      ['2024-01-03', 0],
      ['2024-01-04', 0],
    ])
    // 末日 01-05 不在结果里(无论值多少)
    expect(result.map((r) => r[0])).not.toContain('2024-01-05')
    // 起止与跨度: 4 天 = (5-1) 天, 而非直觉的 5 天
    expect(result).toHaveLength(4)
  })

  it('中间缺失的日期补 0, 已有日期保留原值', () => {
    const result = HeatMapUtils.fillTimeRange([
      ['2024-02-10', 3],
      ['2024-02-13', 8], // 末日, 半开区间排除; 其值不会出现
    ])
    expect(result).toEqual([
      ['2024-02-10', 3],
      ['2024-02-11', 0],
      ['2024-02-12', 0],
    ])
  })

  it('单元素退化为空数组(start === end, 半开区间无任何天)', () => {
    expect(HeatMapUtils.fillTimeRange([['2024-03-10', 5]])).toEqual([])
  })

  it('同一天重复出现时靠 Map 折叠, 后写入的值覆盖先写入的', () => {
    // new Map(entries) 对相同 key 取最后一项, 故 01-01 取 2 而非 1
    const result = HeatMapUtils.fillTimeRange([
      ['2024-01-01', 1],
      ['2024-01-01', 2],
      ['2024-01-04', 7], // 末日被半开区间排除
    ])
    expect(result).toEqual([
      ['2024-01-01', 2],
      ['2024-01-02', 0],
      ['2024-01-03', 0],
    ])
  })

  it('跨月跨闰日仍连续递进(2024 为闰年, 含 02-29)', () => {
    const result = HeatMapUtils.fillTimeRange([
      ['2024-02-28', 1],
      ['2024-03-02', 4], // 末日排除, 结果到 03-01
    ])
    expect(result.map((r) => r[0])).toEqual([
      '2024-02-28',
      '2024-02-29', // 闰日不丢
      '2024-03-01',
    ])
  })

  it('已知日期落在区间内时, 其值被正确读取(非首尾)', () => {
    const result = HeatMapUtils.fillTimeRange([
      ['2024-05-01', 1],
      ['2024-05-03', 9], // 中间日有真实值
      ['2024-05-06', 2], // 末日排除
    ])
    expect(result).toEqual([
      ['2024-05-01', 1],
      ['2024-05-02', 0],
      ['2024-05-03', 9],
      ['2024-05-04', 0],
      ['2024-05-05', 0],
    ])
  })

  it('日期字符串与本机时区无关(toISOString 走 UTC, 不漂移)', () => {
    // Date 往返: 用解析回读校验首格就是输入的那天, 不靠本地化文本
    const result = HeatMapUtils.fillTimeRange([
      ['2024-12-30', 1],
      ['2025-01-02', 5],
    ])
    const firstDay = result[0][0]
    expect(new Date(firstDay).toISOString().slice(0, 10)).toBe('2024-12-30')
    // 跨年仍连续
    expect(result.map((r) => r[0])).toEqual(['2024-12-30', '2024-12-31', '2025-01-01'])
  })
})

describe('generatePieces 生成 echarts 分段配色(恒为 6 段)', () => {
  it('无论 maxValue 大小, 永远返回 6 段', () => {
    expect(HeatMapUtils.generatePieces(0)).toHaveLength(6)
    expect(HeatMapUtils.generatePieces(1)).toHaveLength(6)
    expect(HeatMapUtils.generatePieces(10)).toHaveLength(6)
    expect(HeatMapUtils.generatePieces(999)).toHaveLength(6)
  })

  it('首段锁死在 0: lte=gte=0 且带 label "0"', () => {
    const pieces = HeatMapUtils.generatePieces(10)
    expect(pieces[0]).toMatchObject({ lte: 0, gte: 0, label: '0' })
    // 只有首段有 label, 其余段无 label 字段
    for (let i = 1; i < pieces.length; i++) {
      expect(pieces[i]).not.toHaveProperty('label')
    }
  })

  it('第二段(i=1)从 gte=1 起步, 其余段 gte = quotient*(i-1)', () => {
    // maxValue=10 -> quotient = ceil(10/2) = 5
    const pieces = HeatMapUtils.generatePieces(10)
    expect(pieces[1]).toMatchObject({ gte: 1, lte: 5 }) // i=1 特例: gte=1
    expect(pieces[2]).toMatchObject({ gte: 5, lte: 10 }) // gte=5*(2-1), lte=5*2
    expect(pieces[3]).toMatchObject({ gte: 10, lte: 15 })
    expect(pieces[4]).toMatchObject({ gte: 15, lte: 20 })
    expect(pieces[5]).toMatchObject({ gte: 20, lte: 25 })
  })

  it('quotient = ceil(maxValue/2): 奇数向上取整(maxValue=5 -> 步长 3)', () => {
    const pieces = HeatMapUtils.generatePieces(5) // ceil(5/2)=3
    expect(pieces[1]).toMatchObject({ gte: 1, lte: 3 })
    expect(pieces[2]).toMatchObject({ gte: 3, lte: 6 })
    expect(pieces[3]).toMatchObject({ gte: 6, lte: 9 })
    expect(pieces[4]).toMatchObject({ gte: 9, lte: 12 })
    expect(pieces[5]).toMatchObject({ gte: 12, lte: 15 })
  })

  it('maxValue=1 -> quotient=1: 第二段 lte 与 gte 同为 1(最小非零档)', () => {
    const pieces = HeatMapUtils.generatePieces(1)
    expect(pieces[1]).toMatchObject({ gte: 1, lte: 1 })
    expect(pieces[5]).toMatchObject({ gte: 4, lte: 5 })
  })

  it('maxValue=0 边界: quotient=0, 末四段全部塌缩为 0(锁定退化现状)', () => {
    // 已知边界: maxValue=0 时 quotient=0, gte/lte 多为 0, 且第二段出现 gte(1) > lte(0) 的逆区间。
    //          锁定现状, 待修复(如对空数据做保护)后更新断言。
    const pieces = HeatMapUtils.generatePieces(0)
    expect(pieces[0]).toMatchObject({ lte: 0, gte: 0 })
    expect(pieces[1]).toMatchObject({ gte: 1, lte: 0 }) // 逆区间: gte > lte
    expect(pieces[2]).toMatchObject({ gte: 0, lte: 0 })
    expect(pieces[5]).toMatchObject({ gte: 0, lte: 0 })
  })

  it('默认浅色: 六段颜色为浅色品牌蓝梯度', () => {
    const pieces = HeatMapUtils.generatePieces(10) // isDark 默认 false
    expect(pieces.map((p) => p.color)).toEqual([
      '#eef4fb',
      '#cfe5ff',
      '#93c0f7',
      '#5b97ee',
      '#2f74e0',
      '#1b5bc0',
    ])
  })

  it('isDark=true 切换为深色调色板(同步骤同结构, 仅颜色不同)', () => {
    const light = HeatMapUtils.generatePieces(10, false)
    const dark = HeatMapUtils.generatePieces(10, true)
    expect(dark.map((p) => p.color)).toEqual([
      '#2a2d2e',
      '#16324f',
      '#1d4f82',
      '#2f74c0',
      '#3f93e6',
      '#6bb1f5',
    ])
    // 调色板互不相同, 但数值分档结构(gte/lte)与浅色完全一致
    light.forEach((lp, i) => {
      expect(dark[i].color).not.toBe(lp.color)
      expect(dark[i].gte).toBe(lp.gte)
      expect(dark[i].lte).toBe(lp.lte)
    })
  })
})

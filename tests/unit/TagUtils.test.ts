import { describe, it, expect } from 'vitest'
import TagUtils from '@/core/util/TagUtils'

// 标签的「类型」与「颜色」按 djb2 风格的 hashCode(tag) % 5 取索引，从两张等长表里取值。
// 这套测试守护三件事：
//   1) 确定性 —— 同一标签每次都映射到同一 type / 同一 color（UI 上同名标签颜色不能乱跳）。
//   2) type 与 color 必须共享同一索引 —— 二者都用 hashCode(tag) % 5，否则同标签会出现“类型/颜色错位”。
//   3) 空串与已知正向取值的基线（'' -> hash 0 -> idx 0 -> primary/#409EFF）。
// 另对 hashCode 的「负哈希」做回归守护（见下方）：索引经 Math.abs 归一到 [0,5)，负哈希标签也应落表。

const { calcTagType, calcTagColor } = TagUtils

// 与源同步：types/colors 两张表（顺序即索引语义）。改源需同步此处。
const types = ['primary', 'info', 'warning', 'success', 'danger']
const colors = ['#409EFF', '#909399', '#E6A23C', '#67C23A', '#F56C6C']

describe('TagUtils 确定性映射', () => {
  it('同一标签多次调用得到同一 type（颜色不能随机跳变）', () => {
    const tag = 'Java'
    const first = calcTagType(tag)
    expect(calcTagType(tag)).toBe(first)
    expect(calcTagType(tag)).toBe(first)
  })

  it('同一标签多次调用得到同一 color', () => {
    const tag = 'Vue'
    const first = calcTagColor(tag)
    expect(calcTagColor(tag)).toBe(first)
    expect(calcTagColor(tag)).toBe(first)
  })

  it('type 与 color 共享同一索引：取值在两表的相同下标', () => {
    // 对每个标签，type 在 types 的下标必须等于 color 在 colors 的下标，
    // 这样才能保证“同标签的类型与颜色”始终成对一致。
    for (const tag of ['a', 'abc', 'Vue', 'Java', 'test', 'tag', '前端', '数据结构']) {
      const ti = types.indexOf(calcTagType(tag))
      const ci = colors.indexOf(calcTagColor(tag))
      expect(ti).toBeGreaterThanOrEqual(0) // 这些标签哈希为正，应能正常落表
      expect(ci).toBe(ti) // 同一下标
    }
  })
})

describe('TagUtils 基线取值（正向哈希）', () => {
  // 这些值经 node 探针确认（hashCode(tag) % 5），用真实索引断言而非臆测。
  it("'' -> hash 0 -> idx 0 -> primary / #409EFF", () => {
    expect(calcTagType('')).toBe('primary')
    expect(calcTagColor('')).toBe('#409EFF')
  })

  it("'a' -> hash 97 -> idx 2 -> warning / #E6A23C", () => {
    expect(calcTagType('a')).toBe('warning')
    expect(calcTagColor('a')).toBe('#E6A23C')
  })

  it("'ab' -> hash 3105 -> idx 0 -> primary / #409EFF", () => {
    expect(calcTagType('ab')).toBe('primary')
    expect(calcTagColor('ab')).toBe('#409EFF')
  })

  it("'abc' -> hash 96354 -> idx 4 -> danger / #F56C6C", () => {
    expect(calcTagType('abc')).toBe('danger')
    expect(calcTagColor('abc')).toBe('#F56C6C')
  })

  it("'Java' -> hash 2301506 -> idx 1 -> info / #909399", () => {
    expect(calcTagType('Java')).toBe('info')
    expect(calcTagColor('Java')).toBe('#909399')
  })

  it("'test' -> hash 3556498 -> idx 3 -> success / #67C23A", () => {
    expect(calcTagType('test')).toBe('success')
    expect(calcTagColor('test')).toBe('#67C23A')
  })

  it('中文标签（正向哈希）也能正常落表：前端/数据结构', () => {
    // 探针：'前端' hash 684610 -> idx 0；'数据结构' hash 799106959 -> idx 4
    expect(calcTagType('前端')).toBe('primary')
    expect(calcTagColor('前端')).toBe('#409EFF')
    expect(calcTagType('数据结构')).toBe('danger')
    expect(calcTagColor('数据结构')).toBe('#F56C6C')
  })

  it('每个正向标签的返回值都是合法的表内成员', () => {
    for (const tag of ['', 'a', 'ab', 'abc', 'Java', 'test', '前端', '数据结构']) {
      expect(types).toContain(calcTagType(tag))
      expect(colors).toContain(calcTagColor(tag))
    }
  })
})

describe('TagUtils 负哈希也能正常落表（回归）', () => {
  // 修复前 BUG: hashCode 返回 32 位有符号整数，可能为负；旧实现直接用 hashCode(tag) % 5 作索引，
  // 负哈希 -> 负余数（JS 的 % 保留被除数符号）-> 负下标 -> types/colors 取到 undefined。
  // 修复：用 Math.abs(hashCode(tag) % 5) 保证索引落在 [0, 5)，负哈希标签也能拿到合法 type/color。
  // 探针确认：'计算机网络' hash = -379484529 -> Math.abs(-4) = 4 -> types[4]='danger' / colors[4]='#F56C6C'。
  it("'计算机网络' 负哈希 -> 索引归一到 4 -> danger / #F56C6C", () => {
    expect(calcTagType('计算机网络')).toBe('danger')
    expect(calcTagColor('计算机网络')).toBe('#F56C6C')
  })

  it("'计算机网络' 的返回值是合法的表内成员（不再是 undefined）", () => {
    expect(types).toContain(calcTagType('计算机网络'))
    expect(colors).toContain(calcTagColor('计算机网络'))
  })

  it('负哈希分支同样是确定性的（同标签每次都是同一个值）', () => {
    // 同名标签的类型/颜色不能随机跳变。
    expect(calcTagType('计算机网络')).toBe(calcTagType('计算机网络'))
    expect(calcTagColor('计算机网络')).toBe(calcTagColor('计算机网络'))
  })

  it("负哈希标签的 type 与 color 仍共享同一索引", () => {
    const ti = types.indexOf(calcTagType('计算机网络'))
    const ci = colors.indexOf(calcTagColor('计算机网络'))
    expect(ti).toBeGreaterThanOrEqual(0)
    expect(ci).toBe(ti)
  })
})

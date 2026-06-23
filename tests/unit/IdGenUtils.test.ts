import { describe, it, expect } from 'vitest'
import IdGenUtils from '@/core/util/IdGenUtils'

// 短 id 用于 mermaid 容器、节点等 DOM 唯一标识; 长度/字符集/唯一性退化会导致选择器冲突
describe('IdGenUtils.uuid', () => {
  it('固定为 6 位(两段各 3 位 base36 零填充)', () => {
    for (let i = 0; i < 50; i++) expect(IdGenUtils.uuid()).toHaveLength(6)
  })
  it('仅含 base36 字符 [0-9a-z]', () => {
    for (let i = 0; i < 50; i++) expect(IdGenUtils.uuid()).toMatch(/^[0-9a-z]{6}$/)
  })
  it('大批量生成唯一率极高(空间 46656^2 ≈ 21.8 亿, 容忍极偶发碰撞)', () => {
    // 不断言完全无碰撞(随机生成本就可能极偶发撞), 而是断言高唯一率:
    // 退化的生成器(常量/极小范围)唯一率会断崖式下跌, 这里足以捕获
    const N = 1000
    const set = new Set<string>()
    for (let i = 0; i < N; i++) set.add(IdGenUtils.uuid())
    expect(set.size).toBeGreaterThanOrEqual(N - 5)
  })
})

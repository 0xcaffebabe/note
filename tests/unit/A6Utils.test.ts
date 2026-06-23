import { describe, it, expect } from 'vitest'
import { median } from '@/core/util/MathUtils'
import { computeKnowledgeGap, gapLevelClass, gapInterpretation } from '@/core/util/KnowledgeGapUtils'
import { indent, applyTemplateVariables, cleanTemplateLines, contentsToOutline, categoriesToOutline } from '@/core/util/LlmTemplateUtils'
import DocUtils from '@/core/util/DocUtils'

describe('MathUtils.median', () => {
  it('奇偶与空', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(median([])).toBe(0)
  })
})

describe('KnowledgeGapUtils', () => {
  it('computeKnowledgeGap 取最长空窗与指数', () => {
    const r = computeKnowledgeGap(100, [0, 10, 60, 70])
    expect(r.maxGap).toBe(50) // 10→60
    expect(r.gapStart).toBe(10)
    expect(r.gapEnd).toBe(60)
    expect(r.index).toBe(0.5)
  })
  it('span=0 时指数为 0', () => {
    expect(computeKnowledgeGap(0, [1, 2]).index).toBe(0)
  })
  it('分级与解释阈值', () => {
    expect(gapLevelClass(0.1)).toBe('low-gap')
    expect(gapLevelClass(0.3)).toBe('medium-gap')
    expect(gapLevelClass(0.6)).toBe('high-gap')
    expect(gapLevelClass(0.9)).toBe('critical-gap')
    expect(gapInterpretation(0.1)).toContain('均匀')
    expect(gapInterpretation(0.9)).toContain('严重')
  })
})

describe('LlmTemplateUtils', () => {
  it('indent / applyTemplateVariables / cleanTemplateLines', () => {
    expect(indent(3)).toBe('   ')
    expect(applyTemplateVariables('a {{x}} {{x}} {{y}}', { x: '1', y: '2' })).toBe('a 1 1 2')
    expect(cleanTemplateLines('  a  \n  b  ')).toBe('a\nb')
  })
  it('contentsToOutline 按 level 缩进', () => {
    const out = contentsToOutline([{ name: 'A', level: 0, chidren: [{ name: 'B', level: 1 }] }])
    expect(out).toContain('- A')
    expect(out).toContain(' - B')
  })
  it('categoriesToOutline 按递归层缩进', () => {
    const out = categoriesToOutline([{ name: 'X', chidren: [{ name: 'Y' }] }], 0)
    expect(out).toContain('- X')
    expect(out).toContain(' - Y')
  })
})

describe('DocUtils.docCategory', () => {
  it('取 id 首段', () => {
    expect(DocUtils.docCategory('运维-Docker')).toBe('运维')
    expect(DocUtils.docCategory('java')).toBe('java')
  })
})

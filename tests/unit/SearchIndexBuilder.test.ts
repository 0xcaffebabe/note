import { describe, it, expect } from 'vitest'
import { stripDocPrefix, buildIndexItems } from '@/core/service/SearchIndexBuilder'
import type SearchIndexSegment from '@/core/domain/search/SearchIndexSegement'

// ⚠️ 这是 P1-1 下沉的唯一闸门: generateIndex 不进 dist(只喂 Algolia 推送脚本), 双 build diff 不覆盖。
// objectID 是 Algolia 主键, 任何偏移即破坏线上索引/触发全量 reindex。下方逐字锁定既有行为。

describe('stripDocPrefix doc 前缀剥离(逐字保留既有行为)', () => {
  it("'doc/a/b.md' -> 'a/b.md'", () => {
    expect(stripDocPrefix('doc/a/b.md')).toBe('a/b.md')
  })
  it("⚠️ './doc/a/b.md' -> './a/b.md'(只换首个 'doc/', 残留 './')", () => {
    expect(stripDocPrefix('./doc/a/b.md')).toBe('./a/b.md')
  })
  it("⚠️ 'docx/y.md' -> 'docx/y.md'(条件 startsWith('doc') 命中, 但无 'doc/' 子串可换)", () => {
    expect(stripDocPrefix('docx/y.md')).toBe('docx/y.md')
  })
  it("⚠️ 'doc/doc/x.md' -> 'doc/x.md'(只换首个 'doc/')", () => {
    expect(stripDocPrefix('doc/doc/x.md')).toBe('doc/x.md')
  })
  it("不以 doc 开头者原样返回", () => {
    expect(stripDocPrefix('java/x.md')).toBe('java/x.md')
  })
})

describe('buildIndexItems url===objectID===stripDocPrefix, segments/now 注入', () => {
  const md2Seg = (md: string): SearchIndexSegment[] => [{ id: 'seg', txt: md }]
  it('组装索引项: url/objectID 同为剥前缀后文件名', () => {
    const out = buildIndexItems(
      [{ file: 'doc/a.md', content: '# H\ntext' }, { file: './doc/b.md', content: 'b' }],
      { md2Seg, now: () => 'T0' },
    )
    expect(out[0]).toEqual({ url: 'a.md', objectID: 'a.md', segments: [{ id: 'seg', txt: '# H\ntext' }], createTime: 'T0' })
    expect(out[1].url).toBe('./b.md')
    expect(out[1].objectID).toBe('./b.md')
    expect(out[0].url).toBe(out[0].objectID)
  })
  it('空输入 -> 空数组', () => {
    expect(buildIndexItems([], { md2Seg, now: () => 'T' })).toEqual([])
  })
})

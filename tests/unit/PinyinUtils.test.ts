import { describe, it, expect } from 'vitest'
import { Pinyin } from '@/core/util/Pinyin'
import { tinyPinyin } from '@/adapters/libs/TinyPinyinAdapter'
const pinyin = new Pinyin(tinyPinyin)

// 拼音索引是 CategoryService 目录/文档搜索的匹配底座(buildIndex + indexFull/indexFirst)
// 这里既守护正确的全拼/首字母匹配, 也回归"末字拼音被丢弃"的历史缺陷
const norm = (s: string) => s.replace(/-/g, '').toUpperCase()

describe('convertToPinyin 全路径展开', () => {
  it('多字串保留每个字的拼音(回归: 末字曾被丢弃)', () => {
    const r = pinyin.convertToPinyin('你好')
    expect(r).toHaveLength(1)
    expect(norm(r[0])).toBe('NIHAO') // 修复前为 'NI', 丢掉 好
  })
  it('单字也产出完整拼音(回归: 单字曾得空串)', () => {
    const r = pinyin.convertToPinyin('好')
    expect(r).toHaveLength(1)
    expect(norm(r[0])).toBe('HAO') // 修复前为 ''
  })
  it('多音字展开为多个变体, 且后续字不丢', () => {
    // 重 = ZHONG / CHONG, 构 = GOU
    const r = pinyin.convertToPinyin('重构').map(norm).sort()
    expect(r).toEqual(['CHONGGOU', 'ZHONGGOU'])
  })
  it('自定义分隔符生效', () => {
    expect(pinyin.convertToPinyin('你好', '/')).toEqual(['NI/HAO'])
  })
})

describe('全拼匹配 fullPinyinContains', () => {
  it('完整全拼命中', () => {
    expect(pinyin.fullPinyinContains('你好', 'nihao')).toBe(true)
  })
  it('全拼子串命中(末字片段, 回归保护)', () => {
    expect(pinyin.fullPinyinContains('你好', 'hao')).toBe(true)
  })
  it('大小写无关(内部统一大写)', () => {
    expect(pinyin.fullPinyinContains('你好', 'NiHao')).toBe(true)
  })
  it('多音字任一变体命中即可', () => {
    expect(pinyin.fullPinyinContains('重', 'zhong')).toBe(true)
    expect(pinyin.fullPinyinContains('重', 'chong')).toBe(true)
  })
  it('不匹配返回 false', () => {
    expect(pinyin.fullPinyinContains('你好', 'xyz')).toBe(false)
  })
})

describe('首字母匹配 firstLetterPinyinContains', () => {
  it('首字母串命中', () => {
    expect(pinyin.firstLetterPinyinContains('你好', 'nh')).toBe(true)
  })
  it('多音字首字母任一变体命中', () => {
    expect(pinyin.firstLetterPinyinContains('重构', 'zg')).toBe(true)
    expect(pinyin.firstLetterPinyinContains('重构', 'cg')).toBe(true)
  })
  it('不匹配返回 false', () => {
    expect(pinyin.firstLetterPinyinContains('你好', 'xx')).toBe(false)
  })
})

describe('预计算索引 buildIndex 与即时匹配语义一致', () => {
  it('buildIndex 同时产出全拼与首字母变体', () => {
    expect(pinyin.buildIndex('你好')).toEqual({ full: ['NIHAO'], first: ['NH'] })
    expect(pinyin.buildIndex('重构')).toEqual({
      full: ['ZHONGGOU', 'CHONGGOU'],
      first: ['ZG', 'CG'],
    })
  })
  it('indexFullContains 与 fullPinyinContains 同结论(多样本 parity)', () => {
    for (const [text, kw] of [
      ['你好', 'nihao'], ['你好', 'hao'], ['你好', 'zzz'], ['重构', 'gou'], ['重构', 'q'],
    ] as [string, string][]) {
      expect(Pinyin.indexFullContains(pinyin.buildIndex(text), kw))
        .toBe(pinyin.fullPinyinContains(text, kw))
    }
  })
  it('indexFirstLetterContains 与 firstLetterPinyinContains 同结论(多样本 parity)', () => {
    for (const [text, kw] of [
      ['你好', 'nh'], ['你好', 'n'], ['重构', 'zg'], ['重构', 'cg'], ['重构', 'xx'],
    ] as [string, string][]) {
      expect(Pinyin.indexFirstLetterContains(pinyin.buildIndex(text), kw))
        .toBe(pinyin.firstLetterPinyinContains(text, kw))
    }
  })
  // parity 两侧同源于 buildIndex/convertToPinyin, 易共错; 这里对索引路径做独立字面校验
  it('索引路径独立校验(多音字末字保留)', () => {
    expect(Pinyin.indexFullContains(pinyin.buildIndex('重构'), 'chonggou')).toBe(true)
    expect(Pinyin.indexFullContains(pinyin.buildIndex('重构'), 'zhonggou')).toBe(true)
    expect(Pinyin.indexFirstLetterContains(pinyin.buildIndex('重构'), 'cg')).toBe(true)
  })
})

describe('PinyinUtils 边界与已知缺陷', () => {
  it('空串产出空索引(不产生可被任意串命中的空项)', () => {
    expect(pinyin.convertToPinyin('')).toEqual([])
    expect(pinyin.buildIndex('')).toEqual({ full: [], first: [] })
  })
  it('[BUG] 中英混排: 拉丁字符保留小写而中文转大写, 全拼匹配对拉丁段大小写不对称', () => {
    // 存储侧 'abc' 为小写(abcYING), 而查询侧被统一 toUpperCase, 故拉丁段两种大小写都匹配不到
    expect(pinyin.convertToPinyin('abc英')).toEqual(['a-b-c-YING'])
    expect(pinyin.fullPinyinContains('abc英', 'abc')).toBe(false)
    expect(pinyin.fullPinyinContains('abc英', 'ABC')).toBe(false)
    expect(pinyin.fullPinyinContains('abc英', 'ying')).toBe(true) // 中文段不受影响
  })
})

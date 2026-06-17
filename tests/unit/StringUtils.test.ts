import { describe, it, expect } from 'vitest'
import { cleanText, html2text, getMidString, octal2Chinese } from '@/util/StringUtils'

// 文本清洗用于搜索分词/相似度等环节; 锁定其对中文、标点、空白与空值的处理口径
describe('cleanText', () => {
  it('剔除标点与空白, 保留中文与字母数字', () => {
    expect(cleanText('你好, world! 123')).toBe('你好world123')
  })
  it('空值安全返回空串', () => {
    expect(cleanText('')).toBe('')
    expect(cleanText(undefined)).toBe('')
    expect(cleanText(null)).toBe('')
  })
  it('换行与制表符被清除', () => {
    expect(cleanText('a\nb\tc')).toBe('abc')
  })
  // [BUG] 第一条正则因 '\\]' 后的 ']' 提前闭合字符类而几乎失效, 下列符号未被剔除。
  // 上面的 '剔除标点' 样本恰好只用到被后续 unicode 区间正则覆盖的符号(,! 空格), 掩盖了该缺陷。
  // 暂不修原因: cleanText 同时供 运行时字数显示 / 构建期统计 / 聚类 TF-IDF 使用, 改清洗口径会改动
  // 已部署的统计与聚类产物(且需配合搜索索引重建), 应作为一次专门改动并重建产物, 而非随手修。
  it('[BUG] 这些标点本应被剔除却被漏掉: - @ [ ] { } _ ~', () => {
    expect(cleanText('a-b@c[d]e_f{g}h~i')).toBe('a-b@c[d]e_f{g}h~i')
  })
})

describe('html2text', () => {
  it('剥离所有标签只留文本', () => {
    expect(html2text('<p>hi <b>x</b></p>')).toBe('hi x')
  })
  it('无标签时原样返回', () => {
    expect(html2text('plain text')).toBe('plain text')
  })
  // 贪婪 /<[^>]+>/ : 正文里的游离 '<' 与后续 '>' 之间会被整段当作标签删除
  it('正文含游离 < 时贪婪吞掉到下一个 >', () => {
    expect(html2text('<p>a < b</p>')).toBe('a ') // ' b</p>' 被当作标签删除
  })
})

describe('getMidString 取两标记之间文本', () => {
  it('取左右标记之间', () => {
    expect(getMidString('start[mid]end', '[', ']')).toBe('mid')
  })
  it('左标记为空: 从头取到右标记', () => {
    expect(getMidString('abc]def', '', ']')).toBe('abc')
  })
  it('右标记为空: 从左标记取到结尾', () => {
    expect(getMidString('abc[def', '[', '')).toBe('def')
  })
  it('标记缺失时返回整串', () => {
    expect(getMidString('plain', '<', '>')).toBe('plain')
  })
})

describe('octal2Chinese 还原八进制转义中文', () => {
  it('三组八进制字节解码为中文字符', () => {
    // \344\275\240 = 你 的 UTF-8 字节(八进制)
    expect(octal2Chinese('\\344\\275\\240')).toBe('你')
  })
  it('无八进制序列时原样返回', () => {
    expect(octal2Chinese('hello')).toBe('hello')
  })
  // 仅按"三组八进制"成块解码, 末尾不足三组的字节保持原样(/(\\d{3}){3}/ 分组所致)
  it('尾部不足整字(非 3 字节倍数)的八进制保持原样', () => {
    expect(octal2Chinese('\\344\\275\\240\\345')).toBe('你\\345')
  })
})

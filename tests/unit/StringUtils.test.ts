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
  // 旧实现的密集字符类有缺陷(漏放 - @ [ ] { } _ ~ 等), 已改为 /[^\p{L}\p{N}]/gu 白名单。
  // 注: 这是一次有意的清洗口径变更, 会同步改动字数显示/构建统计/聚类 TF-IDF 产物(需重建)。
  it('剔除所有非字母数字标点(含此前漏放的 - @ [ ] { } _ ~)', () => {
    expect(cleanText('a-b@c[d]e_f{g}h~i')).toBe('abcdefghi')
  })
  it('剔除箭头/弯引号/补充平面 emoji 等符号, 保留两侧文字', () => {
    expect(cleanText('a→b')).toBe('ab')
    expect(cleanText('it’s')).toBe('its')
    expect(cleanText('x😀y')).toBe('xy')
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

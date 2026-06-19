import { describe, it, expect, vi } from 'vitest'

// 守护 WordCloudService 的两个纯函数: cleanText / isStopWord —— 词云统计的预处理底座。
// 词频统计前要先 cleanText 去掉代码/标记/标点(只留 CJK + ascii 词), 再 jieba 分词, 再用 isStopWord 滤掉无意义词。
// 一旦这两步行为漂移, 词云结果会静默变脏(混入符号/漏掉/多算停用词), 因此锁定其当前真实行为。
//
// cleanText 用了一段非常密集的多区间 unicode 正则, 人眼极易看错(范围 ,-. 是区间, [\\]^_ 段里多个字符其实被"漏放"成保留),
// 故本套用例的断言全部基于对真实源码的逐字符探测结果, 而非凭正则字面推断。带 "已知 BUG" 注释的用例锁定的是当前缺陷现状, 待修复后再更新。

// 这两个静态方法不依赖 jieba / fs, 但模块顶层会 import nodejieba(原生模块)与 fs。
// 在网络/原生边界把它们 mock 掉, 让纯逻辑测试既快又不依赖原生 binding。
vi.mock('nodejieba', () => ({ default: { cut: vi.fn(() => []) } }))

import WordCloudService from '@/build/WordCloudService'

describe('WordCloudService.cleanText 基本清洗(保留 CJK + ascii 词)', () => {
  it('纯 CJK 文本原样保留', () => {
    expect(WordCloudService.cleanText('我爱编程')).toBe('我爱编程')
  })

  it('ascii 单词在去掉空白后被拼接保留', () => {
    expect(WordCloudService.cleanText('Hello World Test')).toBe('HelloWorldTest')
  })

  it('CJK 与 ascii 混排: 去掉空格后两者都保留并相连', () => {
    expect(WordCloudService.cleanText('Docker 是 container 引擎')).toBe('Docker是container引擎')
  })

  it('数字保留, 但点号被去掉(版本号会被粘连)', () => {
    expect(WordCloudService.cleanText('version 1.2.3 build')).toBe('version123build')
  })

  it('空串返回空串', () => {
    expect(WordCloudService.cleanText('')).toBe('')
  })

  it('纯空白(空格/Tab/换行)全部清除为空串', () => {
    expect(WordCloudService.cleanText('   \t\n  ')).toBe('')
  })
})

describe('WordCloudService.cleanText 去除空白与换行', () => {
  it('换行被剥离, 行与行被直接拼接', () => {
    expect(WordCloudService.cleanText('第一行\n第二行')).toBe('第一行第二行')
  })
  it('Tab 被剥离', () => {
    expect(WordCloudService.cleanText('a\tb')).toBe('ab')
  })
  it('全角空格(U+3000)也被清除', () => {
    // 全角空格落在 ⺀-㏿ 区间, 被最后一段 unicode 正则剥离
    expect(WordCloudService.cleanText('中　文')).toBe('中文')
  })
})

describe('WordCloudService.cleanText 去除常见 markdown / 代码 / URL 噪声', () => {
  it('代码围栏与代码符号被清掉, 仅留标识符与未覆盖的花括号', () => {
    // 已知行为: 反引号/分号/括号/加号被去掉, 但 { } 因不在任一删除区间内而被保留(见下方字符级用例)
    const out = WordCloudService.cleanText('```js\nconst a = 1;\nfunction foo() { return a + 1 }\n```')
    expect(out).toBe('jsconsta1functionfoo{returna1}')
  })

  it('URL 中的 :/ ? & = . 被剥离, 只剩字母数字粘连', () => {
    expect(WordCloudService.cleanText('see https://example.com/path?q=1 for more'))
      .toBe('seehttpsexamplecompathq1formore')
  })

  it('中文全角标点(，。、：；！)被清除', () => {
    expect(WordCloudService.cleanText('你好，世界！这是 测试。')).toBe('你好世界这是测试')
    expect(WordCloudService.cleanText('问题：答案；列表、项目。')).toBe('问题答案列表项目')
  })

  it('中文书名号/方括号类(《》【】「」)被清除', () => {
    expect(WordCloudService.cleanText('【重要】《标题》「引用」')).toBe('重要标题引用')
  })
})

describe('WordCloudService.cleanText 字符级保留 / 删除(逐字探测锁定密集正则现状)', () => {
  // 把单个字符夹在 A...B 中间, 观察其是否被删除。结果完全来自对真实源码的探测。
  const removed = ['|', '`', '!', '#', '$', '%', '&', '*', '(', ')', '+', '=', ',', '.', '/', ':', ';', '<', '>', '?', "'", '"']
  for (const c of removed) {
    it(`删除标点 ${JSON.stringify(c)}`, () => {
      expect(WordCloudService.cleanText('A' + c + 'B')).toBe('AB')
    })
  }

  // 已知 BUG: 这一批字符按字符类字面意图本应被删除, 但因密集正则的区间/转义写法把它们漏放成"保留",
  // 导致词云里可能混入这些符号。(锁定现状, 待修复后更新断言)
  const keptBug = ['_', '-', '^', '~', '{', '}', '[', ']', '\\', '@']
  for (const c of keptBug) {
    it(`已知 BUG: 本应删除却被保留的字符 ${JSON.stringify(c)}（锁定现状, 待修复后更新断言）`, () => {
      expect(WordCloudService.cleanText('A' + c + 'B')).toBe('A' + c + 'B')
    })
  }

  it('已知 BUG: 弯引号 ’(U+2019) 写在字符类首位却仍被保留（锁定现状, 待修复后更新断言）', () => {
    // 该字符落在 General Punctuation(U+2000-206F), 不在任何删除区间内, 因此未被清掉
    expect(WordCloudService.cleanText('A’B')).toBe('A’B')
  })

  it('数学运算符区间(∀ U+2200 / ∈ U+2208)被删除', () => {
    expect(WordCloudService.cleanText('∀x∈S')).toBe('xS')
  })

  it('已知 BUG: 箭头 →(U+2192) 落在 Arrows 区间外未被覆盖, 故被保留（锁定现状, 待修复后更新断言）', () => {
    expect(WordCloudService.cleanText('A→B')).toBe('A→B')
  })

  it('已知 BUG: 增补平面 emoji(😀 U+1F600)超出 BMP 删除区间, 被保留（锁定现状, 待修复后更新断言）', () => {
    expect(WordCloudService.cleanText('测试😀表情')).toBe('测试😀表情')
  })
})

describe('WordCloudService.isStopWord 长度规则', () => {
  it('空串视为停用词(length<=1)', () => {
    expect(WordCloudService.isStopWord('')).toBe(true)
  })
  it('单个汉字一律视为停用词, 即使本身有意义(如 "编")', () => {
    expect(WordCloudService.isStopWord('编')).toBe(true)
  })
  it('单个 ascii 字符视为停用词', () => {
    expect(WordCloudService.isStopWord('a')).toBe(true)
  })
  it('emoji "😀" 的 string.length 为 2(代理对), 故不被长度规则当作停用词', () => {
    expect('😀'.length).toBe(2)
    expect(WordCloudService.isStopWord('😀')).toBe(false)
  })
})

describe('WordCloudService.isStopWord 词表成员判定', () => {
  it('停用词表中的代词/助词命中(如 "我们" / "的")', () => {
    expect(WordCloudService.isStopWord('我们')).toBe(true)
    expect(WordCloudService.isStopWord('的')).toBe(true)
  })
  it('停用词表中的"无意义词汇"命中(如 "大小" / "务器")', () => {
    expect(WordCloudService.isStopWord('大小')).toBe(true)
    expect(WordCloudService.isStopWord('务器')).toBe(true)
  })
  it('不在词表且长度>1 的实义词不被判为停用词(如 "编程")', () => {
    expect(WordCloudService.isStopWord('编程')).toBe(false)
  })
  it('多字非停用词短语返回 false(如 "双字测试")', () => {
    expect(WordCloudService.isStopWord('双字测试')).toBe(false)
  })
  it('大小写敏感: 表内为中文, 英文 "docker" 不在表内返回 false', () => {
    expect(WordCloudService.isStopWord('docker')).toBe(false)
  })
})

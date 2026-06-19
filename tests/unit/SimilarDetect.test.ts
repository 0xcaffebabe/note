/**
 * similarDetect.ts 纯函数单测
 *
 * 背景: 该脚本原本在模块顶层直接调用 main(), 一旦被 import 就会触发
 *       fs 扫描 + writeFile。本次重构加入了 CLI 入口守卫(isCliEntry),
 *       使得 main 只在 `npx tsx src/scripts/similarDetect.ts` 直接执行时运行,
 *       被 import(如本测试)时不产生任何文件写入。三个纯函数被导出以便单测:
 *         - similar:   基于编辑距离(Levenshtein)的相似度
 *         - cleanText: 文本清洗(去若干标点/空白)
 *         - extractText: markdown -> 纯文本(去元数据/代码块)
 *
 * 注意: 这里只刻画"当前真实行为", 不修复已知 BUG。
 *   - similar 对空输入返回的是裸数字 0(不是字符串比率)
 *   - similar 的 f=0 因 `f = f || 3` 会被改写成 3
 *   - similar 的 f<0(且非 0)会让 toFixed 抛 RangeError
 *   - cleanText 的字符类正则实际上并不能删除大部分标点(! " $ % 等保留)
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { similar, cleanText, extractText } from '@/scripts/similarDetect'

describe('similar 相似度(编辑距离)', () => {
  it('完全相同的字符串返回 "1.000"(默认 3 位小数的字符串)', () => {
    const r = similar('你好世界', '你好世界')
    expect(r).toBe('1.000')
    expect(typeof r).toBe('string')
  })

  it('等长但完全不同返回 "0.000"', () => {
    expect(similar('aaa', 'bbb')).toBe('0.000')
  })

  it('等长仅一字符不同: 4 字符差 1 -> "0.750"', () => {
    expect(similar('abcd', 'abce')).toBe('0.750')
  })

  it('长度不同时分母取较长串: "abc" vs "abcdef" -> "0.500"', () => {
    expect(similar('abc', 'abcdef')).toBe('0.500')
  })

  it('正常情况返回字符串类型(toFixed 的产物)', () => {
    expect(typeof similar('abc', 'abd')).toBe('string')
  })

  // 已知 BUG: 空输入走 `if (!s || !t) return 0` 这条早退分支,
  // 返回的是裸数字 0 而非字符串比率, 与正常路径的返回类型不一致。
  describe('空输入刻画(返回裸数字 0 而非比率字符串)', () => {
    it('s 为空 -> 数字 0', () => {
      const r = similar('', 'abc')
      expect(r).toBe(0)
      expect(typeof r).toBe('number')
    })
    it('t 为空 -> 数字 0', () => {
      const r = similar('abc', '')
      expect(r).toBe(0)
      expect(typeof r).toBe('number')
    })
    it('两者都空 -> 数字 0', () => {
      expect(similar('', '')).toBe(0)
    })
  })

  describe('精度参数 f 的刻画', () => {
    it('f=2 时保留两位小数: "0.75"', () => {
      expect(similar('abcd', 'abce', 2)).toBe('0.75')
    })
    it('f=5 时保留五位小数: "0.75000"', () => {
      expect(similar('abcd', 'abce', 5)).toBe('0.75000')
    })
    // 已知 BUG: `f = f || 3` 把传入的 0 当成 falsy 改写为 3,
    // 所以 f=0 拿不到整数比率, 仍是三位小数。
    it('f=0 被 `f || 3` 改写为 3 -> "0.750"(不是整数)', () => {
      expect(similar('abcd', 'abce', 0)).toBe('0.750')
    })
    // 已知 BUG: f 为负数(非 0)时 `f || 3` 保留负值, toFixed(负) 抛 RangeError。
    it('f<0 时 toFixed 抛 RangeError', () => {
      expect(() => similar('abcd', 'abce', -1)).toThrow(RangeError)
    })
  })
})

describe('cleanText 文本清洗', () => {
  it('删除空白字符(空格/制表/换行)', () => {
    expect(cleanText('hello world')).toBe('helloworld')
    expect(cleanText('a\tb\nc')).toBe('abc')
  })

  it('删除 # 号', () => {
    expect(cleanText('###')).toBe('')
    expect(cleanText('foo#bar')).toBe('foobar')
  })

  it('删除 - 短横线', () => {
    expect(cleanText('---')).toBe('')
    expect(cleanText('foo-bar-baz')).toBe('foobarbaz')
  })

  it('删除 | 竖线', () => {
    expect(cleanText('|||')).toBe('')
    expect(cleanText('a|b|c')).toBe('abc')
  })

  it('保留中文与字母数字', () => {
    expect(cleanText('保留中文123abc')).toBe('保留中文123abc')
  })

  it('组合: markdown 标题行去 # 与空格与 -', () => {
    expect(cleanText('# 标题 - 一些 文本!')).toBe('标题一些文本!')
  })

  // 已知 BUG: 第一段字符类正则 [’!"#$%&...] 实际并不能删除其中大部分标点
  // (字符类内的 `,-.` 形成了意料之外的范围匹配, 字面标点未被命中),
  // 所以下列标点都被"保留"。真正可靠删除的只有后续 .replace 处理的 # - | 和 \s。
  describe('字符类正则失效刻画(以下标点未被删除)', () => {
    it('感叹号 ! 未被删除', () => {
      expect(cleanText('!!!')).toBe('!!!')
    })
    it('逗号 , 未被删除', () => {
      expect(cleanText('a,b,c')).toBe('a,b,c')
    })
    it('美元符 $ 未被删除', () => {
      expect(cleanText('$5')).toBe('$5')
    })
    it('直双引号 " 未被删除', () => {
      expect(cleanText('"x"')).toBe('"x"')
    })
    it('中文右单引号 ’ 未被删除(尽管它排在字符类首位)', () => {
      expect(cleanText('’test’')).toBe('’test’')
    })
  })

  it('空字符串返回空字符串(不抛错)', () => {
    expect(cleanText('')).toBe('')
  })
})

describe('extractText markdown -> 纯文本', () => {
  it('标题 + 段落: 取文本并用换行连接顶层块', () => {
    expect(extractText('# Title\n\nHello world')).toBe('Title\nHello world')
  })

  it('过滤掉代码块(PRE 标签整体丢弃)', () => {
    // 代码块对应 <pre>, 被 filter(tagName != 'PRE') 排除, 只剩 "after"
    expect(extractText('```\ncode block\n```\n\nafter')).toBe('after')
  })

  it('去除 markdown 顶部 --- 元数据块', () => {
    expect(extractText('---\ntitle: meta\n---\n# Real\n\nbody')).toBe('Real\nbody')
  })

  it('列表: 取各列表项文本(首尾含换行的当前真实输出)', () => {
    // <ul> 单个顶层块, textContent 在各 <li> 间夹换行, 形如 "\na\nb\nc\n"
    expect(extractText('- a\n- b\n- c')).toBe('\na\nb\nc\n')
  })
})

describe('模块导入不应产生文件写入(CLI 守卫生效)', () => {
  it('import 本模块后仓库根目录不会出现 textSimilar.json', () => {
    // 仅靠"本测试文件能 import 这三个函数并通过"即可证明 import 未触发 main();
    // 这里再额外断言一次: 项目根目录未被写入产物文件。
    const jsonPath = path.resolve(process.cwd(), 'textSimilar.json')
    expect(fs.existsSync(jsonPath)).toBe(false)
  })
})

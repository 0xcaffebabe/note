import { describe, it, expect } from 'vitest'

// 守护 build 期 DocService 的几个纯/确定性方法, 它们是搜索索引与元数据流水线的根基:
//  - resolveMetadata: 从 markdown 抽取 front-matter 内层 yaml(供 js-yaml 解析 tag/质量分等)
//  - md2TextSegement: 把一篇文档切成 {id(锚点 slug), txt(该标题段正文)} 的搜索片段
//  - md2text / cleanText: markdown/HTML 转可读纯文本, 去代码围栏/空行
// 这些函数一旦行为漂移, 锚点跳转、站内搜索命中、聚类输入都会静默劣化, 故在此锁定现状。
//
// 说明: DocService 是单例, 模块加载时即 new JSDOM(); md2*/stringify 复用静态 DOM。
// 因依赖 DOMParser/document, 本套件放在 component(jsdom) 工程。所测方法均无 @cache、
// 无网络/文件副作用(纯入参→出参), 故无需 mock 或清缓存; 仍对每个用例使用不同输入以防意外。
import docService from '@/platform/node/build/DocService'

describe('DocService.resolveMetadata 抽取 front-matter 内层 yaml', () => {
  it('内容未以 --- 开头时返回空串(无元数据)', () => {
    // trim 后不以 --- 开头 -> 直接短路返回 ''
    expect(docService.resolveMetadata('hello world no dashes')).toBe('')
    expect(docService.resolveMetadata('  \n正文先行\n---\ntitle: x\n---')).toBe('')
  })

  it('合法 front-matter 返回去掉首尾围栏后的内层 yaml', () => {
    const md = '---\ntitle: hello\ntags:\n  - a\n  - b\n---\nbody text'
    const meta = docService.resolveMetadata(md)
    // 断言形状/子串而非整段空白: 应含 yaml 键值、去掉了 --- 围栏、且不含正文
    expect(meta).toContain('title: hello')
    expect(meta).toContain('- a')
    expect(meta).toContain('- b')
    expect(meta).not.toContain('---')
    expect(meta).not.toContain('body text')
  })

  it('yaml 值内部的 --- 应被保留(只剥离首尾围栏, 不贪婪吞值)', () => {
    // 实现按行边界锚定剥离首尾围栏分隔符, 不会再删掉值里出现的 ---,
    // 故 "title: x---y" 原样保留, 不会被压成 "title: xy"。
    const md = '---\ntitle: x---y\nfoo: bar\n---\nbody'
    const meta = docService.resolveMetadata(md)
    expect(meta).toContain('title: x---y') // 值内 --- 完整保留
    expect(meta).not.toContain('title: xy') // 不再发生数据丢失
    expect(meta).toContain('foo: bar')
  })

  it('只有起始围栏、缺少结束围栏时返回空串', () => {
    // 正则 ^---[\s\S]+?^---$ 找不到第二个 --- 行, match 为 null -> ''
    const md = '---\ntitle: hello\nno closing fence here'
    expect(docService.resolveMetadata(md)).toBe('')
  })

  it('存在两段围栏块时只取最开头的第一块', () => {
    // 非贪婪匹配到第一个闭合的 ---...--- , 第二块(second)不应混入
    const md = '---\ntitle: first\n---\nmiddle\n---\ntitle: second\n---\ntail'
    const meta = docService.resolveMetadata(md)
    expect(meta).toContain('title: first')
    expect(meta).not.toContain('second')
    expect(meta).not.toContain('middle')
  })
})

describe('DocService.md2TextSegement 按标题切分搜索片段', () => {
  it('每个标题产出一个 {id, txt}: id 为 slug 锚点, txt 为该标题到下一标题间的正文', () => {
    const md = '# 标题一\n这是第一段正文\n\n## 标题二\n第二段正文内容'
    const segs = docService.md2TextSegement(md)
    expect(segs).toHaveLength(2)
    expect(segs[0].id).toBe('标题一')
    expect(segs[0].txt).toContain('这是第一段正文')
    expect(segs[1].id).toBe('标题二')
    expect(segs[1].txt).toContain('第二段正文内容')
    // 段间文本应只归属各自标题, 不串段
    expect(segs[0].txt).not.toContain('第二段正文内容')
  })

  it('英文标题 slug 转小写并以连字符连接空白, 中文保留原字', () => {
    const md = '# Hello World\nbody1\n\n## API 设计\nbody2'
    const segs = docService.md2TextSegement(md)
    expect(segs[0].id).toBe('hello-world')
    expect(segs[1].id).toBe('api-设计')
  })

  it('最后一个标题的正文取到文档末尾(tail)', () => {
    const md = '# 第一\n正文A\n\n# 末尾标题\n这是最后一个标题后面的全部内容'
    const segs = docService.md2TextSegement(md)
    expect(segs).toHaveLength(2)
    expect(segs[1].id).toBe('末尾标题')
    expect(segs[1].txt).toContain('这是最后一个标题后面的全部内容')
  })

  it('开头的 front-matter 被剥离, 不会进入任何片段正文', () => {
    const md = '---\ntitle: x\n---\n# 唯一标题\n正文'
    const segs = docService.md2TextSegement(md)
    expect(segs).toHaveLength(1)
    expect(segs[0].id).toBe('唯一标题')
    expect(segs[0].txt).toContain('正文')
    // 元数据键不应出现在搜索正文里
    expect(segs[0].txt).not.toContain('title')
  })

  it('重复标题通过 Slugger 去重: 第二次出现 id 追加 -1 后缀', () => {
    const md = '## 标题二\n第二段正文内容\n\n## 标题二\n重复标题的正文'
    const segs = docService.md2TextSegement(md)
    expect(segs).toHaveLength(2)
    expect(segs[0].id).toBe('标题二')
    expect(segs[1].id).toBe('标题二-1')
    expect(segs[1].txt).toContain('重复标题的正文')
  })

  it('没有任何标题时返回空数组', () => {
    expect(docService.md2TextSegement('只有正文 没有任何标题')).toEqual([])
  })
})

describe('DocService.md2text 将 markdown 转为可读纯文本', () => {
  it('去除标题/粗体等标记只留文字内容', () => {
    const text = docService.md2text('# Hi\n\nhello **world**')
    expect(text).toContain('Hi')
    expect(text).toContain('hello world') // 粗体标记被去掉, 文字保留
    expect(text).not.toContain('#')
    expect(text).not.toContain('**')
  })
})

describe('DocService.cleanText 清洗文本: 去 tab / 代码围栏行 / 空行', () => {
  it('删除 tab、丢弃含 ``` 的行与空行, 其余按行保留', () => {
    const cleaned = docService.cleanText('line1\n\tline2\n```\ncode\n```\n\nline3')
    expect(cleaned).toContain('line1')
    expect(cleaned).toContain('line2')
    expect(cleaned).toContain('code') // 围栏标记行被删, 围栏内的代码文本仍保留
    expect(cleaned).toContain('line3')
    expect(cleaned).not.toContain('\t')
    expect(cleaned).not.toContain('```') // 所有含围栏标记的行已剔除
    // 空行被过滤: 结果不含连续换行
    expect(cleaned).not.toMatch(/\n\s*\n/)
  })

  it('整行包含内联 ``` 也会被整行丢弃(基于 indexOf 判断)', () => {
    // 实现用 v.indexOf("```") == -1 过滤, 故只要行内出现 ``` 整行都被删
    const cleaned = docService.cleanText('inline ```backtick``` here\nkeepme')
    expect(cleaned).toBe('keepme')
  })

  it('空字符串返回空字符串', () => {
    expect(docService.cleanText('')).toBe('')
  })
})

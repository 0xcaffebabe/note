import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sharedCache } from '@/platform/web/app/sharedCache'

// DocService 的"关联内容/站内链接"抽取是关联面板(RelatedContent/其他链接分组)的数据源:
//  - extractRelatedContent: 取文档时把正文末尾的 `## 关联内容` 章节抽成 relatedLinks 并从 content 剥离,
//    一旦剥错(边界判定/幂等防护出问题)会导致正文目录/脑图里多出该章节 或正文被误删一段。
//  - resolveDocLinks: 从渲染后的 HTML 里挑"指向其他文档的站内 .html 链接", 排除外链/锚点/自链/已在关联内容里的,
//    去重错误或漏排自链会让面板自我引用或重复。
//  - extractLinkContext: 截链接所在块前后各 36 字做上下文, 截断处补省略号; 越界/找不到锚文本时降级。
// 这些方法 import 时会经由单例链(DocService->TagService/KnowledgeNetworkService->api)自初始化,
// 故必须在 import 前用 vi.hoisted()+vi.mock('@/platform/web/api') 把网络边界全部 mock 成可控空数据, 让各 init() 顺利完成。
// extractRelatedContent / extractLinkContext 为私有方法, 经由对象上的方法引用直接调用以聚焦其分支。

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    // getDocFileInfo 是 DocService.getDocFileInfo 的网络源, 各用例按需 mockResolvedValueOnce
    getDocFileInfo: vi.fn(),
    // 以下方法由 import 时构造的各单例 init() 调用, 返回空集合即可让初始化完成
    getDocQualityData: vi.fn().mockResolvedValue([]),
    getTagMapping: vi.fn().mockResolvedValue([]),
    getDocTagPrediction: vi.fn().mockResolvedValue([]),
    getKnowledgeNetwork: vi.fn().mockResolvedValue([]),
    getDocCluster: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('@/platform/web/api', () => ({ default: apiMock }))

import docService from '@/platform/web/service/DocService'
import DocFileInfo from '@/core/domain/DocFileInfo'

// 直接调用私有方法(用例聚焦其分支, 不绕 getDocFileInfo 的缓存)
const extractRelatedContent = (file: any) =>
  (docService as any).extractRelatedContent(file)
const resolveDocLinks = (html: string, currentDocId: string, exclude?: string[]) =>
  (docService as any).resolveDocLinks(html, currentDocId, exclude)

function mkFile(content: string, id = 'probe-doc'): any {
  const f = new DocFileInfo()
  f.id = id
  f.content = content
  return f
}

// 单例间共享缓存且方法被 @cache 记忆, 每例前清空避免跨例命中
beforeEach(() => sharedCache.clear())

describe('DocService.extractRelatedContent 关联内容章节抽取与剥离', () => {
  it('抽取 ## 关联内容 各链接为 {href,path,desc} 并从正文剥离 + 去尾部空行', () => {
    const file = mkFile([
      '# Title',
      '正文段落',
      '',
      '## 关联内容',
      '',
      '- [/前端/Vue.md](/前端/Vue.md) Vue 框架',
      '- [/后端/Spring.md](/后端/Spring.md) Spring',
      '',
      '',
    ].join('\n'))

    extractRelatedContent(file)

    // href 由 docId2HtmlPath 生成(.html 路径), path 保留链接原始文本(.md), desc 为链接后的说明
    expect(file.relatedLinks).toEqual([
      { href: '/前端/Vue.html', path: '/前端/Vue.md', desc: 'Vue 框架' },
      { href: '/后端/Spring.html', path: '/后端/Spring.md', desc: 'Spring' },
    ])
    // 章节连同尾部空行一并剥离, 只剩前面的正文
    expect(file.content).toBe('# Title\n正文段落')
    expect(file.content).not.toMatch(/关联内容/)
  })

  it('章节边界: 遇到同级标题即终止, 之后的内容保留', () => {
    const file = mkFile([
      '# Doc',
      '## 关联内容',
      '- [/a/b.md](/a/b.md) desc',
      '## 其他章节',
      '保留这段',
    ].join('\n'))

    extractRelatedContent(file)

    expect(file.relatedLinks).toEqual([{ href: '/a/b.html', path: '/a/b.md', desc: 'desc' }])
    // 同级 `## 其他章节` 起的内容应原样保留
    expect(file.content).toBe('# Doc\n## 其他章节\n保留这段')
  })

  it('章节边界: 遇到更高级标题(级别数更小)即终止', () => {
    const file = mkFile([
      '### 关联内容',
      '- [/a/b.md](/a/b.md) d',
      '## 更高级标题',
      'tail',
    ].join('\n'))

    extractRelatedContent(file)

    expect(file.relatedLinks).toEqual([{ href: '/a/b.html', path: '/a/b.md', desc: 'd' }])
    // 比 ### 更高级的 ## 标题处终止, 其后保留
    expect(file.content).toBe('## 更高级标题\ntail')
  })

  it('章节边界: 无后续标题时一直延伸到文末', () => {
    const file = mkFile(['# Doc', '正文', '## 关联内容', '- [/a/b.md](/a/b.md) d'].join('\n'))

    extractRelatedContent(file)

    expect(file.relatedLinks).toEqual([{ href: '/a/b.html', path: '/a/b.md', desc: 'd' }])
    expect(file.content).toBe('# Doc\n正文')
  })

  it('幂等防护: 再次执行不重复抽取/不再改动正文(relatedLinks 已定义时直接返回)', () => {
    const file = mkFile('## 关联内容\n- [/a/b.md](/a/b.md) d\n')

    extractRelatedContent(file)
    const linksAfter1 = JSON.stringify(file.relatedLinks)
    const contentAfter1 = file.content

    extractRelatedContent(file) // 第二次

    expect(file.relatedLinks).toHaveLength(1)
    expect(JSON.stringify(file.relatedLinks)).toBe(linksAfter1)
    expect(file.content).toBe(contentAfter1)
  })

  it('无 关联内容 章节: relatedLinks 为空数组, content 原样不动', () => {
    const file = mkFile('# Just a doc\nno related here')

    extractRelatedContent(file)

    expect(file.relatedLinks).toEqual([])
    expect(file.content).toBe('# Just a doc\nno related here')
  })

  it('正文出现"关联内容"字样但非标题: 不匹配标题正则, 不抽取也不剥离', () => {
    const file = mkFile('# Doc\n这里提到关联内容这个词但不是标题')

    extractRelatedContent(file)

    expect(file.relatedLinks).toEqual([])
    expect(file.content).toBe('# Doc\n这里提到关联内容这个词但不是标题')
  })

  it('空 content: relatedLinks 为空, content 仍为空串(早退分支)', () => {
    const file = mkFile('')

    extractRelatedContent(file)

    expect(file.relatedLinks).toEqual([])
    expect(file.content).toBe('')
  })

  it('畸形链接(resloveDocUrl 因非法百分号编码抛错)被跳过, 合法链接仍抽取', () => {
    // `/bad%.md` 含非法百分号编码, decodeURI 抛 URIError -> 该行被 catch 跳过
    const file = mkFile([
      '## 关联内容',
      '- [bad](/bad%.md) wont parse',
      '- [/ok/x.md](/ok/x.md) ok',
    ].join('\n'))

    extractRelatedContent(file)

    expect(file.relatedLinks).toEqual([{ href: '/ok/x.html', path: '/ok/x.md', desc: 'ok' }])
  })

  it('非链接行(不匹配列表链接正则)被忽略, 章节整体仍被剥离', () => {
    const file = mkFile([
      '# Doc',
      '## 关联内容',
      '这是一行普通文字不是链接',
      '- [/a/b.md](/a/b.md) d',
    ].join('\n'))

    extractRelatedContent(file)

    expect(file.relatedLinks).toEqual([{ href: '/a/b.html', path: '/a/b.md', desc: 'd' }])
    expect(file.content).toBe('# Doc')
  })

  it('集成: getDocFileInfo 返回时已填充 relatedLinks 并剥离正文', async () => {
    const f = new DocFileInfo()
    f.id = '前端-React'
    f.metadata = 'tags:\n  - 前端'
    f.content = ['# React', '正文内容', '## 关联内容', '- [/前端/Vue.md](/前端/Vue.md) 同类框架'].join('\n')
    apiMock.getDocFileInfo.mockResolvedValueOnce(f)

    const result = await docService.getDocFileInfo('前端-React')

    expect(result.relatedLinks).toEqual([
      { href: '/前端/Vue.html', path: '/前端/Vue.md', desc: '同类框架' },
    ])
    expect(result.content).toBe('# React\n正文内容')
  })
})

describe('DocService.resolveDocLinks 站内文档链接抽取', () => {
  it('仅保留站内 .html 链接, 外链/mailto/纯锚点一律丢弃', () => {
    const html = [
      '<p>正文 <a href="/后端/Spring.html">Spring</a> 说明</p>',
      '<p>外链 <a href="https://x.com">ext</a></p>',
      '<p>邮件 <a href="mailto:a@b.c">m</a></p>',
      '<p>纯锚点 <a href="#sec">anchor</a></p>',
    ].join('\n')

    const r = resolveDocLinks(html, 'current-doc', [])

    expect(r).toHaveLength(1)
    expect(r[0].href).toBe('/后端/Spring.html')
    // path 由 docId2Url(docId) 生成, 无前导斜杠
    expect(r[0].path).toBe('后端/Spring.md')
    expect(r[0].desc).toBe('')
  })

  it('带 ?query 与 #anchor 的 .html 仍识别为站内链接', () => {
    const r = resolveDocLinks('<p><a href="/a/b.html?x=1">q</a></p>', 'cur', [])
    expect(r).toHaveLength(1)
    expect(r[0].href).toBe('/a/b.html')
  })

  it('丢弃指向当前文档自身的链接', () => {
    const html = '<p><a href="/me/self.html">self</a> 和 <a href="/other/x.html">other</a></p>'
    const r = resolveDocLinks(html, 'me-self', [])
    expect(r).toHaveLength(1)
    expect(r[0].href).toBe('/other/x.html')
  })

  it('按 docId 去重: 同一文档多次出现(含带锚点)只保留首个', () => {
    const html = '<p><a href="/a/b.html">one</a> <a href="/a/b.html#x">two</a></p>'
    const r = resolveDocLinks(html, 'cur', [])
    expect(r).toHaveLength(1)
    expect(r[0].context!.text).toBe('one') // 保留首次出现
  })

  it('honor excludeHrefs: 已在关联内容里的 href 被排除', () => {
    const html = '<p><a href="/a/b.html">x</a> <a href="/c/d.html">y</a></p>'
    const r = resolveDocLinks(html, 'cur', ['/a/b.html'])
    expect(r).toHaveLength(1)
    expect(r[0].href).toBe('/c/d.html')
  })

  it('无 a 标签 / 无站内链接 返回空数组', () => {
    expect(resolveDocLinks('<p>no links here</p>', 'cur', [])).toEqual([])
    expect(resolveDocLinks('<p><a href="https://x.com">e</a></p>', 'cur', [])).toEqual([])
  })

  it('多条不同站内链接全部保留且各带上下文', () => {
    const html = '<p>看 <a href="/a/b.html">甲</a> 和 <a href="/c/d.html">乙</a></p>'
    const r = resolveDocLinks(html, 'cur', [])
    expect(r.map((v: any) => v.href)).toEqual(['/a/b.html', '/c/d.html'])
    expect(r[0].context).toBeDefined()
    expect(r[1].context).toBeDefined()
  })
})

describe('DocService.extractLinkContext 链接上下文截取(经 resolveDocLinks 触发)', () => {
  it('短块: before/after 不补省略号, text 为锚文本', () => {
    const r = resolveDocLinks('<p>短<a href="/a/b.html">L</a>尾</p>', 'cur', [])
    expect(r[0].context).toEqual({ before: '短', text: 'L', after: '尾' })
  })

  it('长块: 前后超出 radius=36 截断处补省略号(…)', () => {
    const before = '前'.repeat(50)
    const after = '后'.repeat(50)
    const html = `<p>${before}<a href="/a/b.html">链接文本</a>${after}</p>`
    const r = resolveDocLinks(html, 'cur', [])
    const ctx = r[0].context!
    expect(ctx.text).toBe('链接文本')
    expect(ctx.before.startsWith('…')).toBe(true)
    expect(ctx.after.endsWith('…')).toBe(true)
    // before 取链接前 36 字 + 前导省略号 => 37 字符
    expect(ctx.before).toHaveLength(37)
    expect(ctx.after).toHaveLength(37)
  })

  it('恰好 radius=36 字: 不补省略号(边界为严格大于)', () => {
    const before = '前'.repeat(36)
    const r = resolveDocLinks(`<p>${before}<a href="/a/b.html">L</a></p>`, 'cur', [])
    const ctx = r[0].context!
    expect(ctx.before).toBe(before)
    expect(ctx.before.startsWith('…')).toBe(false)
    expect(ctx.after).toBe('')
  })

  it('37 字: 越过 radius 即补前导省略号', () => {
    const before = '前'.repeat(37)
    const r = resolveDocLinks(`<p>${before}<a href="/a/b.html">L</a></p>`, 'cur', [])
    expect(r[0].context!.before.startsWith('…')).toBe(true)
    expect(r[0].context!.before).toHaveLength(37) // … + 后 36 字
  })

  it('锚文本为空(或全空白): 取不到中心文本 -> context 为 undefined', () => {
    // text 为空时 `!text` 命中早退分支, 返回 undefined(不给上下文)
    const empty = resolveDocLinks('<p>some text <a href="/a/b.html"></a> more</p>', 'cur', [])
    expect(empty[0].context).toBeUndefined()

    const ws = resolveDocLinks('<p>text <a href="/a/b.html">   </a> end</p>', 'cur', [])
    expect(ws[0].context).toBeUndefined()
  })

  it('锚点不在 p/li 等块内: 退回 parentElement 仍能取上下文', () => {
    const r = resolveDocLinks('<a href="/a/b.html">bare</a>', 'cur', [])
    expect(r[0].context).toEqual({ before: '', text: 'bare', after: '' })
  })

  it('块内多空白被折叠为单空格再截取', () => {
    const html = '<li>说明   文字\n  <a href="/a/b.html">链接</a>   后续</li>'
    const r = resolveDocLinks(html, 'cur', [])
    const ctx = r[0].context!
    expect(ctx.text).toBe('链接')
    expect(ctx.before).toBe('说明 文字 ') // 连续空白折叠为单空格
    expect(ctx.after).toBe(' 后续')
  })
})

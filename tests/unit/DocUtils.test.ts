import { describe, it, expect } from 'vitest'
import DocUtils from '@/core/util/DocUtils'

// docId <-> .html 路径 的双向转换是整个 .html 静态化路由的命门 用例锁死往返一致性
describe('DocUtils docId <-> path', () => {
  it('docId2HtmlPath: 运维-Docker -> /运维/Docker.html', () => {
    expect(DocUtils.docId2HtmlPath('运维-Docker')).toBe('/运维/Docker.html')
  })
  it('docId2Url: 运维-Docker -> /运维/Docker.md(无前导斜杠的 .md)', () => {
    expect(DocUtils.docId2Url('运维-Docker')).toBe('运维/Docker.md')
  })
  it('htmlUrl2Id: /运维/Docker.html -> 运维-Docker', () => {
    expect(DocUtils.htmlUrl2Id('/运维/Docker.html')).toBe('运维-Docker')
  })
  it('html 路径 <-> id 往返稳定', () => {
    const id = '运维-Docker'
    expect(DocUtils.htmlUrl2Id(DocUtils.docId2HtmlPath(id))).toBe(id)
  })
  it('名称内含连字符用 @@ 转义 不与层级分隔符冲突', () => {
    // id 中的 @@ 代表段内真实的 '-'
    expect(DocUtils.docId2Url('a@@b-c')).toBe('a-b/c.md')
    expect(DocUtils.htmlUrl2Id('/a-b/c.html')).toBe('a@@b-c')
  })
  it('htmlUrl2Id 丢弃 query 与 hash', () => {
    expect(DocUtils.htmlUrl2Id('/运维/Docker.html?headingId=x#y')).toBe('运维-Docker')
  })
  it('空入参返回空串', () => {
    expect(DocUtils.docId2HtmlPath('')).toBe('')
    expect(DocUtils.htmlUrl2Id('')).toBe('')
  })
})

describe('DocUtils.docUrl2Id / resloveDocUrl', () => {
  it('docUrl2Id 去掉 .md 与 #锚点', () => {
    expect(DocUtils.docUrl2Id('/软件工程/架构/软件架构.md#依赖关系规则')).toBe('软件工程-架构-软件架构')
  })
  it('resloveDocUrl 拆出 headingId', () => {
    expect(DocUtils.resloveDocUrl('/软件工程/架构/软件架构.md#依赖关系规则')).toEqual({
      id: '软件工程-架构-软件架构',
      headingId: '依赖关系规则',
    })
  })
  it('resloveDocUrl 无锚点时只返回 id', () => {
    expect(DocUtils.resloveDocUrl('/运维/Docker.md')).toEqual({ id: '运维-Docker' })
  })
})

describe('DocUtils.routeDocId', () => {
  it('兼容旧 /doc/:doc 参数', () => {
    expect(DocUtils.routeDocId({ params: { doc: '运维-Docker' } })).toBe('运维-Docker')
  })
  it('从 :docPath(.html) 参数解析', () => {
    expect(DocUtils.routeDocId({ params: { docPath: '运维/Docker.html' } })).toBe('运维-Docker')
  })
  it('docPath 含连字符时按 @@ 转义还原', () => {
    expect(DocUtils.routeDocId({ params: { docPath: 'a-b/c.html' } })).toBe('a@@b-c')
  })
  it('两者都无返回空串', () => {
    expect(DocUtils.routeDocId({ params: {} })).toBe('')
  })
})

describe('DocUtils 边界与历史地址兼容', () => {
  it('docUrl2Id 剥离 ./doc 与 /doc 历史前缀', () => {
    expect(DocUtils.docUrl2Id('./doc/运维/Docker.md')).toBe('运维-Docker')
    expect(DocUtils.docUrl2Id('/doc/运维/Docker.md')).toBe('运维-Docker')
    expect(DocUtils.docUrl2Id('运维/Docker.md')).toBe('运维-Docker')
  })
  it('docId2Url 丢弃 id 上挂的 query 段', () => {
    expect(DocUtils.docId2Url('运维-Docker?x=1')).toBe('运维/Docker.md')
  })
  it('htmlUrl2Id 对 .html 后缀大小写不敏感', () => {
    expect(DocUtils.htmlUrl2Id('/运维/Docker.HTML')).toBe('运维-Docker')
  })
  it('docId2Url 空入参返回空串', () => {
    expect(DocUtils.docId2Url('')).toBe('')
  })
  it('docId<->.html 与 .md 两条路径的 @@ 转义双向往返一致', () => {
    const id = 'a@@b-c'
    expect(DocUtils.htmlUrl2Id(DocUtils.docId2HtmlPath(id))).toBe(id)
    expect(DocUtils.docUrl2Id(DocUtils.docId2Url(id))).toBe(id)
  })
})

// 原为「已知缺陷」特征测试, 源码已修复(docUrl2Id 改为按段精确判 doc + 锚定/大小写不敏感剥 .md):
// 这里改为锁定修复后的「正确行为」, 若回归会失败。
describe('DocUtils.docUrl2Id 前缀与 .md 处理(修复后)', () => {
  it('首段以 "doc" 开头但非 "doc" 段不被误丢(docker 保留)', () => {
    expect(DocUtils.docUrl2Id('docker/x.md')).toBe('docker-x') // 修复前曾误成 'x'
    expect(DocUtils.docUrl2Id('doc/a/b.md')).toBe('a-b') // 真正的 doc 前缀仍被剥离
  })
  it('.md 剥离大小写不敏感(.MD 也去掉)', () => {
    expect(DocUtils.docUrl2Id('/x/y.MD')).toBe('x-y') // 修复前曾保留为 'x-y.MD'
  })
  it('.md 剥离锚定到结尾(只去结尾那个 .md)', () => {
    expect(DocUtils.docUrl2Id('/x/a.md.note.md')).toBe('x-a.md.note') // 修复前曾误成 'x-a.note.md'
  })
  it('结尾 .md 在 #锚点之前时仍正确剥离(切锚点先于剥 .md)', () => {
    expect(DocUtils.docUrl2Id('/x/y.md#sec')).toBe('x-y')
  })
})

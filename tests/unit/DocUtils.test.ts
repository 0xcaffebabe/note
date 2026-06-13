import { describe, it, expect } from 'vitest'
import DocUtils from '@/util/DocUtils'

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
  it('两者都无返回空串', () => {
    expect(DocUtils.routeDocId({ params: {} })).toBe('')
  })
})

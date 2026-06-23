import { describe, it, expect } from 'vitest'
import { StaticHtmlService } from '@/core/service/doc/StaticHtmlService'
import { nodeMarkdown } from '@/adapters/node/NodeMarkdownAdapter'
import { nodeDomParser } from '@/adapters/node/NodeDomParser'
import DocFileInfo from '@/core/domain/DocFileInfo'

// 守护从 DocBuildMove 下沉到 core StaticHtmlService 的静态 html 生成。
// buildStaticHtml 的逐字节行为另由 tests/unit/DocBuildMove.test.ts(经 generalHtmlContent 委托)
// 全面锁定; 此处补 renderSummaryLinks 与端口装配冒烟。
const svc = new StaticHtmlService(nodeMarkdown, nodeDomParser)

describe('StaticHtmlService.renderSummaryLinks', () => {
  it('渲染 SUMMARY 并把 ./xx.md 链接重写为 /xx.html', () => {
    const html = svc.renderSummaryLinks('* [a](./foo/bar.md)\n')
    expect(html).toContain('/foo/bar.html')
    expect(html).not.toContain('bar.md')
  })
})

describe('StaticHtmlService.buildStaticHtml 端口装配冒烟', () => {
  it('注入 title/description/static-content, .md 链接改写为 .html', () => {
    const info = new DocFileInfo()
    info.name = 'My Doc'
    info.content = '# Hello\n\n[x](a.md)'
    const tpl = '<!DOCTYPE html><html><head><title>Site</title></head><body></body></html>'
    const out = svc.buildStaticHtml(tpl, info)
    expect(out).toContain('<title>My Doc</title>')
    expect(out).toContain("<div class='content static-content'>")
    expect(out).toContain('<a href="a.html">x</a>')
    expect(out).toContain('<meta property="og:site_name" content="Site">')
  })
})

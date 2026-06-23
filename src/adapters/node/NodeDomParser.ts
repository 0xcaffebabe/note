// DomParserPort 的 node 实现: 用 jsdom。语义对齐浏览器 DOMParser.parseFromString(html,'text/html'):
// 把片段包进 <body> 后返回 Document, 使 querySelector('body > ul > li') 等选择器行为一致。
import type { DomParserPort } from '../../core/ports/DomParserPort'
import { JSDOM } from 'jsdom'

export class NodeDomParser implements DomParserPort {
  parse(html: string): Document {
    return new JSDOM(`<!DOCTYPE html><body>${html}</body></html>`).window.document as unknown as Document
  }
}

export const nodeDomParser = new NodeDomParser()

// DomParserPort 的浏览器实现: 复用单个 DOMParser 实例。
// jsdom 测试环境下全局 DOMParser 同样可用, 故组件测试无需额外适配。
import type { DomParserPort } from '@/core/ports'

export class BrowserDomParser implements DomParserPort {
  private parser = new DOMParser()
  parse(html: string): Document {
    return this.parser.parseFromString(html, 'text/html')
  }
}

export const browserDomParser = new BrowserDomParser()

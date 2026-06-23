// HTML 解析端口: core 的渲染后处理/目录抽取/链接抽取需要把 HTML 字符串解析成
// 可查询的 DOM 文档。core 只依赖 W3C DOM 的 Document 类型(lib.dom 仅类型层,
// 不构成运行时框架/库依赖); 浏览器适配器用 DOMParser、node 适配器用 jsdom 实现。

export interface DomParserPort {
  /** 把 HTML 片段解析为 Document (等价 new DOMParser().parseFromString(html, 'text/html')) */
  parse(html: string): Document
}

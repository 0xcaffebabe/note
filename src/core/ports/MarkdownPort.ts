// Markdown 引擎端口: core 的文档渲染逻辑(自定义 link/code/image/heading/callout 渲染、
// 站内链接解析、图片代理、标题锚点等业务规则)留在 core, 仅通过本端口驱动底层 md 引擎,
// 不直接 import marked。适配器用 marked(并注册 KaTeX 扩展)实现本端口。
//
// 类型只描述 core 用到的 marked 子集, 结构上与 marked.Renderer/Token 兼容,
// 使 core 无需安装 marked 即可编译。

export interface MdLinkToken { href?: string | null; text?: string | null }
export interface MdCodeToken { lang?: string | null; text: string }
export interface MdImageToken { href?: string | null; text?: string | null }
/** inline token 列表: core 只把 heading.tokens 透传给 parseInline, 不读其内部结构, 故用不透明列表。 */
export type MdInlineTokens = readonly unknown[]
export interface MdHeadingToken { depth: number; raw: string; tokens: MdInlineTokens }
/** 块级 token(table/blockquote): core 仅透传给原渲染器, 不读字段。用具名索引类型替代 any 以保留边界。 */
export interface MdBlockToken { readonly [key: string]: unknown }

export interface MdRenderer {
  link?: (token: MdLinkToken) => string
  code?: (token: MdCodeToken) => string
  image?: (token: MdImageToken) => string
  heading?: (token: MdHeadingToken) => string
  table?: (token: MdBlockToken) => string
  blockquote?: (token: MdBlockToken) => string
  /** 文本节点渲染: 覆写为原样透传(text=>text.text)可生成"不转义实体"的纯文本流(静态首屏直出用) */
  text?: (token: { text: string }) => string
  /** 渲染器内部解析器, heading 自定义渲染需用它把 inline tokens 转 HTML */
  readonly parser: { parseInline(tokens: MdInlineTokens): string }
}

export interface MarkdownPort {
  /** 新建一个带默认实现的渲染器, 调用方可覆写其 link/code/... 方法 */
  createRenderer(): MdRenderer
  /** 用给定渲染器解析 markdown 为 HTML */
  parse(markdown: string, opts: { renderer: MdRenderer; breaks?: boolean }): string
  /** 用默认渲染器把 markdown 解析为 HTML(等价 marked(md)) */
  render(markdown: string): string
}

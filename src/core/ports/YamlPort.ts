// YAML 解析端口: core 解析文档 frontmatter 元数据需要它, 不直接依赖 js-yaml。
// 适配器用 js-yaml 实现。

export interface YamlPort {
  load(content: string): unknown
}

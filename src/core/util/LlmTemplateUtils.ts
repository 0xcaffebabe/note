/**
 * LLM 模板渲染的纯工具: 变量替换、空白清理、目录/大纲树转缩进文本。
 * 从 LLM.vue 的 renderTemplate/handleModeChange/updateTemplateContent 三处重复中抽出。
 */

interface OutlineNode {
  name: string
  level?: number
  chidren?: OutlineNode[]
}

/** n 个空格缩进。 */
export function indent(n: number): string {
  return ' '.repeat(Math.max(0, n))
}

/** 把 {{key}} 占位符按 values 全局替换。 */
export function applyTemplateVariables(template: string, values: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}

/** 逐行去首尾空白, 重新拼接(清理模板渲染后的多余空白)。 */
export function cleanTemplateLines(text: string): string {
  return text
    .split('\n')
    .map(v => v.replace(/(^\s*)|(\s*$)/g, ''))
    .join('\n')
}

/** 文档目录树 → 缩进大纲(缩进按节点自身 level)。对应 LLM.contents2String。 */
export function contentsToOutline(contents: OutlineNode[]): string {
  if (!contents || contents.length === 0) {
    return ''
  }
  return contents
    .map(v => indent(v.level ?? 0) + '- ' + v.name + '\n' + contentsToOutline(v.chidren || []))
    .join('\n')
}

/** 分类树 → 缩进大纲(缩进按递归层级)。对应 LLM.categories2String。 */
export function categoriesToOutline(categories: OutlineNode[], level: number): string {
  if (!categories || categories.length === 0) {
    return ''
  }
  return categories
    .map(v => indent(level) + '- ' + v.name + '\n' + categoriesToOutline(v.chidren || [], level + 1))
    .join('\n')
}

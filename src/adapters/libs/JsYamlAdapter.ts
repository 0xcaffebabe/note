// YamlPort 的实现: 委托 js-yaml。浏览器与 node 通用。
import type { YamlPort } from '@/core/ports'
import { loadAll, YAMLException } from 'js-yaml'

function loadCompatibleDocuments(content: string): unknown[] {
  let source = content
  let lines: string[] | undefined
  let indentation = ''
  const adjustedLines = new Set<number>()
  while (true) {
    try {
      return loadAll(source)
    } catch (error) {
      // v4 允许流式集合的续行/结束符不缩进；只修正 v5 指出的行，保留其他文本及 tab。
      if (!(error instanceof YAMLException) || error.reason !== 'deficient indentation' || !error.mark) {
        throw error
      }
      if (!lines) {
        lines = content.split('\n')
        const maxIndent = lines.reduce((max, line) => Math.max(max, line.match(/^ */)![0].length), 0)
        indentation = ' '.repeat(maxIndent + 1)
      }
      const line = error.mark.line
      // 每行最多调整一次，且不能把文档边界隐藏到流式集合中。
      if (line < 0 || line >= lines.length || adjustedLines.has(line) || /^(---|\.\.\.)([ \t\r]|$)/.test(lines[line])) {
        throw error
      }
      lines[line] = indentation + lines[line]
      adjustedLines.add(line)
      source = lines.join('\n')
    }
  }
}

export class JsYamlAdapter implements YamlPort {
  load(content: string): unknown {
    // v5 的 load 不再接受空流；loadAll 保留无 frontmatter / 仅注释时返回 undefined 的行为。
    const documents = loadCompatibleDocuments(content)
    if (documents.length > 1) {
      throw new YAMLException('expected a single document in the stream, but found more')
    }
    return documents[0]
  }
}

export const jsYaml = new JsYamlAdapter()

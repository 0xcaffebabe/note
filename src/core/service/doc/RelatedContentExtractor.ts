import type DocFileInfo from '../../domain/DocFileInfo'
import DocUtils from '../../util/DocUtils'

/**
 * 从 Markdown 中移出生成的“关联内容”段落，供阅读器与知识发布共用。
 * 原地更新 content/relatedLinks；已提取的文件不重复处理，以保持正文及章节编号一致。
 */
export function extractRelatedContent(file: DocFileInfo): void {
  if (file.relatedLinks !== undefined) {
    return
  }
  file.relatedLinks = []
  if (!file.content || !/关联内容/.test(file.content)) {
    return
  }
  const lines = file.content.split('\n')
  const start = lines.findIndex((line) => /^#{2,3}\s*关联内容/.test(line))
  if (start === -1) {
    return
  }
  const level = lines[start].match(/^(#+)/)![1].length
  let end = lines.length
  for (let index = start + 1; index < lines.length; index++) {
    const heading = lines[index].match(/^(#{1,6})\s/)
    if (heading && heading[1].length <= level) {
      end = index
      break
    }
  }
  for (const line of lines.slice(start + 1, end)) {
    const link = line.match(/^-\s*\[([^\]]+)\]\(([^)]+)\)\s*(.*)$/)
    if (!link) {
      continue
    }
    try {
      const { id } = DocUtils.resloveDocUrl(link[2].trim())
      file.relatedLinks.push({
        href: DocUtils.docId2HtmlPath(id),
        path: link[1].trim(),
        desc: link[3].trim(),
      })
    } catch {
      // 无效关联链接只跳过当前引用，不影响正文内容。
    }
  }
  lines.splice(start, end - start)
  while (lines.length && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }
  file.content = lines.join('\n')
}

// 标签映射(平台无关, 纯逻辑): 把每篇文档的 tags 反转聚合为 tag -> 文件名列表。
// 提取自 build/DocService.buildTagMapping —— 读文件与 yaml 解析留驱动, 此处只做反转。

export interface TagAndFilename {
  tags: string[]
  filename: string
}

/**
 * 反转聚合: [{tags, filename}] -> Map<tag, filename[]>。
 * 保持插入顺序(tag 按首见序、同 tag 内 filename 按出现序), 下游据此塑形。
 */
export function foldTagMapping(entries: TagAndFilename[]): Map<string, string[]> {
  const tagMap = new Map<string, string[]>()
  for (let entry of entries) {
    for (let tag of entry.tags || []) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, [])
      }
      tagMap.get(tag)?.push(entry.filename)
    }
  }
  return tagMap
}

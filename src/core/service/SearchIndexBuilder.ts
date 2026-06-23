import SearchIndexSegment from '../domain/search/SearchIndexSegement'
import SearchIndexItem from '../domain/search/SearchIndexItem'

// 搜索索引塑形(平台无关, 纯逻辑): doc 前缀剥离 + 索引项组装。
// 提取自 build/SearchService.generateIndex —— 文件枚举/读取/md 分段(md2Seg)与时钟(now)由驱动注入。
// ⚠️ 该路径只喂 Algolia 推送(updateSearchIndex 脚本), 不进 dist; objectID 是主键, 字节敏感,
// 由 tests/unit/SearchIndexBuilder.test.ts 特征化测把关(双 build diff 不覆盖此处)。

/**
 * doc 前缀剥离。⚠️ 逐字保留既有(含"看似 bug")行为:
 *  - 条件用 startsWith('doc')(子串前缀, 'docx' 也命中条件)与 startsWith('./doc');
 *  - 命中后 replace('doc/','') 只替换首个 'doc/'(非锚定), 故 './doc/x' -> './x'(残留 './')、
 *    'doc/doc/x' -> 'doc/x'(只去首个); 不命中条件者原样返回。
 */
export function stripDocPrefix(file: string): string {
  if (file.startsWith('doc') || file.startsWith('./doc')) {
    file = file.replace('doc/', '')
  }
  return file
}

/**
 * 由 (文件名, 正文) 列表构建索引项。url===objectID===stripDocPrefix(file); segments/createTime 经注入。
 * 保持原两段 map 求值顺序(先全量剥前缀, 再逐项 md2Seg + now)。
 */
export function buildIndexItems(
  entries: { file: string; content: string }[],
  deps: { md2Seg: (md: string) => SearchIndexSegment[]; now: () => string },
): SearchIndexItem[] {
  return entries
    .map(v => ({ file: stripDocPrefix(v.file), content: v.content }))
    .map(v => ({
      url: v.file,
      objectID: v.file,
      segments: deps.md2Seg(v.content),
      createTime: deps.now(),
    } as SearchIndexItem))
}

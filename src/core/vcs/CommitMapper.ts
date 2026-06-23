import CommitInfo from '../domain/CommitInfo'
import type { VcsLogEntry } from '../ports/VersionControlPort'

// 把 VCS 日志条目映射为领域 CommitInfo(平台无关)。message 只取首行(标题)。
export function logEntryToCommitInfo(v: VcsLogEntry): CommitInfo {
  return {
    date: v.date,
    author: v.author_name,
    message: v.message.split("\n")[0],
    hash: v.hash,
    insertions: v.diff?.insertions,
    deletions: v.diff?.deletions,
  } as CommitInfo
}

// 需从各统计里剔除的提交(批量整理/无意义大改等噪声)。逐字保留, 不排序不去重。
export const IGNORE_COMMITS = ['30588a462801b5266eb892031f254c0ee99322c2', '75b476d27b17e66b2aeb2de677900355a4439eec', '1fdb2124651cb796a587fd8fc3f238f96e29cb6c']

/** 日志条目 -> CommitInfo[], 并剔除 IGNORE_COMMITS。提取自 build/GitService(5 处重复)。 */
export function mapVcsLog(entries: ReadonlyArray<VcsLogEntry>): CommitInfo[] {
  return entries.map(logEntryToCommitInfo).filter(c => IGNORE_COMMITS.indexOf(c.hash) == -1)
}

/** 只剔除 IGNORE_COMMITS, 保留原始 VcsLogEntry(不映射)。供需要原始字段的分支用。 */
export function filterIgnoredRaw(entries: ReadonlyArray<VcsLogEntry>): VcsLogEntry[] {
  return entries.map(v => v).filter(c => IGNORE_COMMITS.indexOf(c.hash) == -1)
}

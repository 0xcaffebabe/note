import CommitInfo from '../domain/CommitInfo'

// 提交历史端口: core 的文档编排需要"某文件的提交列表/末次提交"这一较高层能力
// (已映射成 CommitInfo, 含 ignoreCommits 过滤等构建口径)。驱动层(build/GitService)实现。
export interface CommitHistoryPort {
  getFileCommitList(path: string): Promise<CommitInfo[]>
  getFileLastCommit(path: string): Promise<CommitInfo>
}

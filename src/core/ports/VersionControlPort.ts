// 版本控制端口: 构建期读取 git 提交历史与快照。
// 结构化字段(VcsLogEntry)只覆盖消费方实际读取的属性, 不泄漏 simple-git 的具体类型。
export interface VcsLogEntry {
  hash: string
  date: string
  message: string
  author_name: string
  diff?: { insertions: number; deletions: number }
}

export interface VcsLogResult {
  all: ReadonlyArray<VcsLogEntry>
}

export interface VersionControlPort {
  /** 等价 simple-git 的 git.log(options) */
  log(options?: Record<string, unknown>): Promise<VcsLogResult>
  /** 等价 simple-git 的 git.show(ref) */
  show(ref: string): Promise<string>
}

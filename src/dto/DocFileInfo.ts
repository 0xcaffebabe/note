import CommitInfo from "./CommitInfo"

export default class DocFileInfo {
  // 文档名称
  name: string = ''
  // 文档ID
  id: string = ''
  content: string = ''
  commitList: CommitInfo[] = []
  // commitList默认最多只展示10个 用此字段标志是否有更多
  hasMoreCommit: boolean = false
  totalCommits: number = 0
  metadata: string = ''
  createTime: string = ''
}
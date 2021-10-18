
export default class CommitInfo {
  date: string = ''
  author: string = ''
  message: string = ''
  hash: string = ''
  // 增加行数
  insertions: number = 0
  // 删除行数
  deletions: number = 0
}
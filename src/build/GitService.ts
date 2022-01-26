import BaseService from "./BaseService";
import CommitInfo from '../dto/CommitInfo'
import simpleGit, {DefaultLogFields, ListLogLine, SimpleGit} from 'simple-git';
import GitChangeItem from "../dto/git/GitChangeItem";
import { octal2Chinese } from "../util/StringUtils";
const git: SimpleGit = simpleGit();

const ignoreCommits = ['30588a462801b5266eb892031f254c0ee99322c2', '75b476d27b17e66b2aeb2de677900355a4439eec', '1fdb2124651cb796a587fd8fc3f238f96e29cb6c']

class GitService extends BaseService {


  /**
   *
   * 获取文件的所有提交记录
   * @param {string} path
   * @return {*}  {Promise<CommitInfo[]>}
   * @memberof GitService
   */
  public async getFileCommitList(path: string): Promise<CommitInfo[]> {
    const resp = await git.log({
      file :path
    })
    return resp.all.map(this.convert).filter(c => ignoreCommits.indexOf(c.hash) == -1)
  }


  /**
   *
   * 获取文件最近的一次提交记录
   * @param {string} path
   * @return {*}  {Promise<CommitInfo>}
   * @memberof GitService
   */
  public async getFileLastCommit(path: string): Promise<CommitInfo> {
    const commitList = await this.getFileCommitList(path)
    const commit = commitList[0];
    if (!commit) {
      return {
        date: '1999-02-17 12:00:00',
        hash: '',
        message: 'unknow commit',
        author: 'unknow',
        insertions: 0,
        deletions: 0
      }
    }
    return commit
  }


  /**
   *
   * 获取所有提交记录（包装提交） 顺序为倒序
   * @return {*}  {Promise<CommitInfo[]>}
   * @memberof GitService
   */
  public async listAllCommit(): Promise<CommitInfo[]>{
    const resp = await git.log({
      '--stat': '4096'
    })
    return resp.all.map(this.convert).filter(c => ignoreCommits.indexOf(c.hash) == -1)
  }


  /**
   *
   * 获取所有提交记录（原始提交） 顺序为倒序
   * @return {*}  {(Promise<ReadonlyArray<DefaultLogFields & ListLogLine>>)}
   * @memberof GitService
   */
  public async listAllRawCommit(): Promise<Array<DefaultLogFields & ListLogLine>> {
    const resp = await git.log({
      '--stat': '4096'
    })
    return resp.all.map(v => v).filter(c => ignoreCommits.indexOf(c.hash) == -1)
  }


  /**
   *
   * 查看特定提交下特定文件的快照
   * @param {string} hash
   * @param {string} path
   * @return {*}  {Promise<string>}
   * @memberof GitService
   */
  public async gitShow(hash: string, path: string): Promise<string> {
    if (!hash || !path) {
      return ''
    }
    return await git.show(`${hash}:${path}`)
  }

  public async gitShowUseHash(hash: string): Promise<Map<string, GitChangeItem[]>> {
    if (!hash) {
      return new Map()
    }
    const resp = octal2Chinese(await git.show(hash))
    let splitArr = resp.split("\n")
    const result: GitChangeItem[] = []
    let currentFile = ""
    let insertions = []
    let deletions = []
    /* 
    解析git show 原始结果，算法概要：
    1. 扫描每一行，存为line
    2. 如果发现line 以 'diff --git' 开头, 并且line往后数四行或者五行是一个有效的分割段(如 @@ -31,70 +31,155 @@), 则解析当前line 提取出文件名 作为currentFile
    3. 如果发现line 以 '-' 开头, 并且不是如 +++ b/src/util/BatchPromiseHelper.ts 这种类型用来表示当前操作文件的行, 则根据是以 + 还是 - 开头决定将本行存为增加还是删除
    4. 当每次的 currentFile 发生变化, 则记录为一项 changeItem
    
    */
    for(let i = 0;i<splitArr.length;i++){
      const line = splitArr[i]
      if (line.startsWith("diff --git") &&  this.isValidCommitSegementHeadWithIndex(i, splitArr)) {
        if (currentFile) {
          result.push({
            filename: currentFile, insertions, deletions
          })
        }
        currentFile = line.split(" ")[2].replace("a/", "").replace(/"/g, '')
        insertions = []
        deletions = []
      }
      if (line.startsWith("-") && !this.isGitDiffFileDesc(line, currentFile)) {
        deletions.push(line.replace("-", ""))
      }
      if (line.startsWith("+") && !this.isGitDiffFileDesc(line, currentFile)) {
        insertions.push(line.replace("+", ""))
      }
    }
    if (currentFile) {
      result.push({
        filename: currentFile, insertions, deletions
      })
    }
    // 合并同一个文件的 changeItem
    const map = new Map<string, GitChangeItem[]>()
    for(let i of result) {
      if (map.has(i.filename)) {
        map.get(i.filename)?.push(i)
      }else {
        map.set(i.filename, [i])
      }
    }
    return map
  }

  public async findFirstCommit(): Promise<CommitInfo> {
    const resp = await git.log()
    const commitList =  resp.all.map(this.convert).filter(c => ignoreCommits.indexOf(c.hash) == -1)
    return commitList[commitList.length - 1]
  }

  public async findRecentYearsCommits(): Promise<CommitInfo[]> {
    const resp = await git.log({
      '--since': "1 years ago"
    })
    return resp.all.map(this.convert).filter(c => ignoreCommits.indexOf(c.hash) == -1)
  }

  private convert(v: DefaultLogFields & ListLogLine) : CommitInfo {
    return {
      date: v.date,
      author: v.author_name,
      message: v.message,
      hash: v.hash,
      insertions: v.diff?.insertions,
      deletions: v.diff?.deletions,
    } as CommitInfo
  }

  private isValidCommitSegementHead(line: string): boolean {
    if (!line) {
      return false
    }
    return line.startsWith("@@") && line.indexOf("@@", 3) != -1
  }

  private isValidCommitSegementHeadWithIndex(index: number, splitArr: string[]): boolean {
    return (index + 4 < splitArr.length && this.isValidCommitSegementHead(splitArr[index + 4])) ||
            (index + 5 < splitArr.length && this.isValidCommitSegementHead(splitArr[index + 5]))
  }

  private isGitDiffFileDesc(line: string, currentFile: string): boolean {
    return line.indexOf(currentFile) != -1 && (line.startsWith("+++ ") || line.startsWith("--- "))
  }
}

export default new GitService()
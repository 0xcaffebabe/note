import BaseService from "./BaseService";
import CommitInfo from '../dto/CommitInfo'
import simpleGit, {DefaultLogFields, ListLogLine, SimpleGit} from 'simple-git';
import GitChangeItem from "../dto/git/GitChangeItem";
import { octal2Chinese } from "../util/StringUtils";
import Cacheable from "@/decorator/Cacheable";
import Cache from "../decorator/Cache";

const git: SimpleGit = simpleGit();

const ignoreCommits = ['30588a462801b5266eb892031f254c0ee99322c2', '75b476d27b17e66b2aeb2de677900355a4439eec', '1fdb2124651cb796a587fd8fc3f238f96e29cb6c']
const cache = Cache()

class GitService extends BaseService implements Cacheable{

  name(): string {
    return 'build::doc-service';
  }

  /**
   *
   * 获取文件的所有提交记录
   * @param {string} path
   * @return {*}  {Promise<CommitInfo[]>}
   * @memberof GitService
   */
  @cache
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
    return parseGitShow(resp)
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
      message: v.message.split("\n")[0],
      hash: v.hash,
      insertions: v.diff?.insertions,
      deletions: v.diff?.deletions,
    } as CommitInfo
  }

}

/**
 * 解析 `git show <hash>` 的原始文本(已先经 octal2Chinese 解码), 提取每个文件的增删行。
 * 纯字符串处理, 无副作用, 单测入口。算法概要：
 * 1. 扫描每一行，存为 line
 * 2. 如果发现 line 以 'diff --git' 开头, 并且 line 往后数四行或者五行是一个有效的分割段(如 @@ -31,70 +31,155 @@), 则解析当前 line 提取出文件名 作为 currentFile
 * 3. 如果发现 line 以 '-'/'+' 开头, 并且不是如 +++ b/src/util/BatchPromiseHelper.ts 这种用来表示当前操作文件的行, 则根据是以 + 还是 - 开头决定将本行存为增加还是删除
 * 4. 当每次的 currentFile 发生变化, 则记录为一项 changeItem; 最终合并同一文件名的多个 changeItem 到同一 Map 键下
 */
export function parseGitShow(resp: string): Map<string, GitChangeItem[]> {
  let splitArr = resp.split("\n")
  const result: GitChangeItem[] = []
  let currentFile = ""
  let insertions: string[] = []
  let deletions: string[] = []
  for(let i = 0;i<splitArr.length;i++){
    const line = splitArr[i]
    if (line.startsWith("diff --git")) {
      // 先收尾上一个文件块
      if (currentFile) {
        result.push({
          filename: currentFile, insertions, deletions
        })
      }
      insertions = []
      deletions = []
      // 仅当窗口内存在有效 hunk 头才切换到本块文件; 否则(纯重命名/模式变更/二进制等)
      // 重置 currentFile, 避免本块后续的 +/- 行被错误并入上一个文件
      currentFile = isValidCommitSegementHeadWithIndex(i, splitArr)
        ? line.split(" ")[2].replace("a/", "").replace(/"/g, '')
        : ""
      continue
    }
    // 不在任何文件块内的行直接忽略
    if (!currentFile) {
      continue
    }
    // '--- '/'+++ ' 是 diff 的文件描述头(无论是否含当前文件名), 不计入增删
    if (line.startsWith("--- ") || line.startsWith("+++ ") || isGitDiffFileDesc(line, currentFile)) {
      continue
    }
    if (line.startsWith("-")) {
      // 仅剥离行首单个 '-' 标记, 保留正文中的其余 '-'
      deletions.push(line.slice(1))
    } else if (line.startsWith("+")) {
      // 仅剥离行首单个 '+' 标记, 保留正文中的其余 '+'
      insertions.push(line.slice(1))
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

export function isValidCommitSegementHead(line: string): boolean {
  if (!line) {
    return false
  }
  return line.startsWith("@@") && line.indexOf("@@", 3) != -1
}

export function isValidCommitSegementHeadWithIndex(index: number, splitArr: string[]): boolean {
  return (index + 4 < splitArr.length && isValidCommitSegementHead(splitArr[index + 4])) ||
          (index + 5 < splitArr.length && isValidCommitSegementHead(splitArr[index + 5]))
}

export function isGitDiffFileDesc(line: string, currentFile: string): boolean {
  return line.indexOf(currentFile) != -1 && (line.startsWith("+++ ") || line.startsWith("--- "))
}

export default new GitService()
import BaseService from "./BaseService";
import CommitInfo from '../../../core/domain/CommitInfo'
import { simpleGitVcs } from '../../../adapters/node/SimpleGitVcs'
import type { VcsLogEntry } from '../../../core/ports/VersionControlPort'
import { mapVcsLog, filterIgnoredRaw } from "../../../core/vcs/CommitMapper";
import GitChangeItem from "../../../core/domain/git/GitChangeItem";
import { parseGitShow } from "../../../core/vcs/GitDiffParse";
import { octal2Chinese } from "../../../core/util/StringUtils";
import Cacheable from "../../../core/cache/Cacheable";
import Cache from "../../../core/cache/Cache";
import CacheService from "../../../core/cache/CacheService";
import type { CachePort } from "../../../core/ports/CachePort";



// ignoreCommits 黑名单 + 映射/过滤已下沉 core/vcs/CommitMapper(mapVcsLog/filterIgnoredRaw)。
const cache = Cache()

class GitService extends BaseService implements Cacheable{

  constructor(private readonly cache: CachePort) {
    super()
  }

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
    const resp = await simpleGitVcs.log({
      file :path
    })
    return mapVcsLog(resp.all)
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
    const resp = await simpleGitVcs.log({
      '--stat': '4096'
    })
    return mapVcsLog(resp.all)
  }


  /**
   *
   * 获取所有提交记录（原始提交） 顺序为倒序
   * @return {*}  {(Promise<ReadonlyArray<VcsLogEntry>>)}
   * @memberof GitService
   */
  public async listAllRawCommit(): Promise<Array<VcsLogEntry>> {
    const resp = await simpleGitVcs.log({
      '--stat': '4096'
    })
    return filterIgnoredRaw(resp.all)
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
    return await simpleGitVcs.show(`${hash}:${path}`)
  }

  public async gitShowUseHash(hash: string): Promise<Map<string, GitChangeItem[]>> {
    if (!hash) {
      return new Map()
    }
    const resp = octal2Chinese(await simpleGitVcs.show(hash))
    return parseGitShow(resp)
  }

  public async findFirstCommit(): Promise<CommitInfo> {
    const resp = await simpleGitVcs.log()
    const commitList = mapVcsLog(resp.all)
    return commitList[commitList.length - 1]
  }

  public async findRecentYearsCommits(): Promise<CommitInfo[]> {
    const resp = await simpleGitVcs.log({
      '--since': "1 years ago"
    })
    return mapVcsLog(resp.all)
  }

}

// git-diff 纯文本解析已迁至 core/vcs/GitDiffParse(平台无关, 可被任意运行时复用)。
// 本服务经 VersionControlPort 取到 git show 文本+解码后, 调用 parseGitShow。

export default new GitService(new CacheService())
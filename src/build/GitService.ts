import BaseService from "./BaseService";
import CommitInfo from '../dto/CommitInfo'
import simpleGit, {DefaultLogFields, ListLogLine, SimpleGit} from 'simple-git';
const git: SimpleGit = simpleGit();

class GitService extends BaseService {


  /**
   *
   * 获取文件的所有提交记录
   * @static
   * @param {string} path
   * @return {*}  {Promise<CommitInfo[]>}
   * @memberof GitService
   */
  public static async getFileCommitList(path: string): Promise<CommitInfo[]> {
    const resp = await git.log({
      file :path
    })
    return resp.all.map(this.convert)
  }


  /**
   *
   * 获取文件最近的一次提交记录
   * @static
   * @param {string} path
   * @return {*}  {Promise<CommitInfo>}
   * @memberof GitService
   */
  public static async getFileLastCommit(path: string): Promise<CommitInfo> {
    const commitList = await this.getFileCommitList(path)
    return commitList[0];
  }

  public static async listAllCommit(): Promise<CommitInfo[]>{
    const resp = await git.log({
      '--stat': '4096'
    })
    return resp.all.map(this.convert)
  }

  public static async findFirstCommit(): Promise<CommitInfo> {
    const resp = await git.log()
    const commitList =  resp.all.map(this.convert)
    return commitList[commitList.length - 1]
  }

  public static async findRecentYearsCommits(): Promise<CommitInfo[]> {
    const resp = await git.log({
      '--since': "1 years ago"
    })
    return resp.all.map(this.convert)
  }

  private static convert(v: DefaultLogFields & ListLogLine) : CommitInfo {
    return {
      date: v.date,
      author: v.author_name,
      message: v.message,
      hash: v.hash,
      insertions: v.diff?.insertions,
      deletions: v.diff?.deletions,
    } as CommitInfo
  }
}

export default GitService
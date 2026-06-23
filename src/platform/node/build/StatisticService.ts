import { StatisticInfo, CommitStatistic, WordStatistic, CodeFrequencyItem } from "../../../core/domain/StatisticInfo";
import BaseService from "./BaseService";
import GitService from "./GitService";
import { nodeFileSystem } from '../../../adapters/node/NodeFileSystem'
import type { FileBytes } from '../../../core/ports/FileSystemPort'
import { cleanText } from "../../../core/util/StringUtils";
import BatchPromiseHelper from "../../../core/util/BatchPromiseHelper";
import { countCodeFrequency, aggregateTrend, bucketCommitHours, countCommitsByDay, flattenChangeItems, sumMarkdownDelta, computeCommitStatistic, computeWordStatistic, countMarkdownFiles, countImageFiles } from "../../../core/statistic/StatTransforms";


class StatisticService extends BaseService {

  public static async generateStatistic(): Promise<StatisticInfo> {
    const info = new StatisticInfo()
    info.generateTime = new Date().toISOString()
    const filelist = this.listAllFile('doc')
    const result = await Promise.all([this.getRepositorySize(), this.getCommitStatistic(), this.getWordStatistic(), this.getCodeFrequency(), this.getFirstCommitDate()])
    info.repositorySize = result[0]
    info.commit = result[1]
    info.word = result[2]
    info.codeFrequency = result[3]
    info.firstCommitDate = result[4]
    info.chapterCount = countMarkdownFiles(filelist)
    info.imageCount = countImageFiles(filelist)
    return info
  }

  /**
   *
   * 生成年度提交热力图数据
   * @static
   * @return {*}  {Promise<[string, number][]>}
   * @memberof StatisticService
   */
  public static async generateYearsCommitHeatmap(): Promise<[string, number][]> {
    const commitList = (await  GitService.findRecentYearsCommits()).reverse();
    return countCommitsByDay(commitList.map(i => i.date))
  }


  /**
   *
   * 生成提交小时热力图数据
   * @static
   * @return {*}  {Promise<[string, number][]>}
   * @memberof StatisticService
   */
  public static async generateCommitHourHeatmap(): Promise<[string, number][]> {
    const commitList = await GitService.listAllCommit();
    return bucketCommitHours(commitList.map(i => i.date))
  }


  /**
   *
   * 生成提交总量趋势数据
   * @static
   * @memberof StatisticService
   * @returns [日期, 当日总字数, 当日总行数][]
   */
  public static async generateCommitTotalTrend(): Promise<[string, number, number, number][]> {
    const commitList = await GitService.listAllRawCommit()
    commitList.reverse()

    // [日期, 新增字数, 新增行数, 新增提交次数]
    const resp:[string, number, number, number][] = []
    for(let commit of commitList) {

      const i = await GitService.gitShowUseHash(commit.hash)
        .then(map => sumMarkdownDelta(flattenChangeItems(map), cleanText))
        .then(total => {
          console.log(`提交总量趋势 ${commit.hash} ${commit.date}:${total}`)
          return [commit.date, total[0], total[1], 1] as [string, number, number, number]
        })
        .catch(err => [commit.date, 0, 0, 0] as [string, number, number, number])
      resp.push(i)
    }
    return aggregateTrend(resp)
  }

  private static async getRepositorySize(): Promise<number> {
    const statList = await Promise.all(this.listAllFile('./').map(v => nodeFileSystem.stat(v)))
    return statList
      .map(v => v.size)
      .reduce((a: number, b: number) => a + b, 0)
  }

  private static async getCommitStatistic(): Promise<CommitStatistic> {
    const commitList = await GitService.listAllCommit()
    return computeCommitStatistic(commitList, new Date().getTime())
  }

  private static async getWordStatistic(): Promise<WordStatistic> {
    const firstCommit = await GitService.findFirstCommit()
    const filelist = this.listAllMdFile()
    const taskList: Promise<FileBytes>[] = []
    for (let i of filelist) {
      if (i.startsWith('doc') || i.startsWith('./doc')) {
        taskList.push(nodeFileSystem.readFile(i))
      }
    }
    const contents = (await Promise.all(taskList)).map(v => v.toString())
    return computeWordStatistic(contents, firstCommit.date, new Date().getTime(), cleanText)
  }

  private static async getFirstCommitDate(): Promise<string> {
    return (await GitService.findFirstCommit()).date
  }

  private static async getCodeFrequency(): Promise<CodeFrequencyItem[]> {
    const filelist = this.listAllMdFile()
    const taskList: Promise<FileBytes>[] = []
    for(let i of filelist) {
      if (i.startsWith('doc') || i.startsWith('./doc')) {
        taskList.push(nodeFileSystem.readFile(i))
      }
    }
    const contents = (await Promise.all(taskList)).map(v => v.toString())
    return countCodeFrequency(contents)
  }

}

export default StatisticService
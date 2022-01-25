import { StatisticInfo, CommitStatistic, WordStatistic, CodeFrequencyItem } from "../dto/StatisticInfo";
import BaseService from "./BaseService";
import GitService from "./GitService";
import fs from 'fs'
import { cleanText } from "../util/StringUtils";
import BatchPromiseHelper from "../util/BatchPromiseHelper";
import GitChangeItem from "@/dto/git/GitChangeItem";

const imageSuffix = ['png', 'jpg', 'svg', 'jpeg', 'jiff', 'bmp']

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
    info.chapterCount = filelist.filter(v => v.endsWith('.md') || v.endsWith('.MD')).length
    info.imageCount = filelist.filter(v => {
      for(let item of imageSuffix) {
        if (v.endsWith('.' + item) || v.endsWith('.' + item.toUpperCase())) {
          return true
        }
      }
      return false
    }).length
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
    const map = new Map<string, number>()
    for(let i of commitList) {
      const date = new Date(i.date).toISOString().split('T')[0]
      if (map.has(date)) {
        map.set(date, map.get(date)! + 1)
      }else {
        map.set(date, 1)
      }
    }
    return Array.from(map)
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
    const map = new Map<string, number>()
    for(let i of commitList) {
      // GMT+8
      const hour = ((new Date(i.date).getUTCHours() + 8) % 24).toString()
      if (map.has(hour)) {
        map.set(hour, map.get(hour)! + 1)
      }else {
        map.set(hour, 1)
      }
    }
    return Array.from(map).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  }


  /**
   *
   * 生成提交总量趋势数据
   * @static
   * @memberof StatisticService
   * @returns [日期, 当日总字数, 当日总行数][]
   */
  public static async generateCommitTotalTrend(): Promise<[string, number, number][]> {
    const commitList = await GitService.listAllRawCommit()
    commitList.reverse()

    function flatGitShowList(map: Map<string, GitChangeItem[]>): GitChangeItem[]{
      const result = []
      for(let entries of map) {
        result.push(...entries[1])
      }
      return result
    }
    // [日期, 新增字数, 新增行数]
    const helper = new BatchPromiseHelper<[string, number, number]>()
    for(let commit of commitList) {

      helper.join(
          GitService.gitShowUseHash(commit.hash)
            .then( map => 
              flatGitShowList(map)
              .filter(v => v.filename.endsWith('.md'))
              .map(v => [cleanText(v.insertions.join()).length - cleanText(v.deletions.join()).length, v.insertions.length - v.deletions.length])
              .reduce((a,b) => [a[0] + b[0], a[1] + b[1]])
            )
            .then(total => {
              console.log(`提交总量趋势 ${commit.hash} ${commit.date}:${total}`)
              return [commit.date, total[0], total[1]] as [string, number, number]
            })
            .catch(err => [commit.date, 0, 0] as [string, number, number])
      )
    }
    const resp = await helper.all()
    // 聚合日期
    const map = new Map<string, [number,number]>()
    for(let i of resp) {
      const date = i[0].split("T")[0]
      if (map.has(date)) {
        const data = map.get(date)!
        data[0] = data[0] + i[1]
        data[1] = data[1] + i[2]
      }else {
        map.set(date, [i[1], i[2]])
      }
    }
    const result: [string, number, number][] = []
    map.forEach((v, k) => {
      result.push([k, ...v])
    })
    // 排序
    result.sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    // 计算当日的总数
    for(let i = 1;i<result.length;i++){
      const current = result[i]
      const previous = result[i-1]
      current[1] += previous[1]
      current[2] += previous[2]
    }
    return result
  }

  private static async getRepositorySize(): Promise<number> {
    const statList = await Promise.all(this.listAllFile('./').map(v => fs.promises.stat(v)))
    return statList
      .map(v => v.size)
      .reduce((a: number, b: number) => a + b, 0)
  }

  private static async getCommitStatistic(): Promise<CommitStatistic> {
    const currentDate = new Date()
    const commitList = await GitService.listAllCommit()
    const minDate = commitList.map(v => v.date).map(Date.parse).sort()[0]
    const pastDays = Math.ceil((currentDate.getTime() - minDate) / (3600 * 24 * 1000))
    return {
      commitPerDay: parseFloat((commitList.length / pastDays).toFixed(2)),
      linePerDay: Math.ceil(commitList.map(v => v.insertions - v.deletions).filter(Boolean).reduce((a, b) => a + b, 0) / pastDays)
    }
  }

  private static async getWordStatistic(): Promise<WordStatistic> {
    const firstCommit = await GitService.findFirstCommit()
    const pastDays = Math.ceil((new Date().getTime() - Date.parse(firstCommit.date)) / (3600 * 24 * 1000))
    const filelist = this.listAllMdFile()
    const taskList: Promise<Buffer>[] = []
    for (let i of filelist) {
      if (i.startsWith('doc') || i.startsWith('./doc')) {
        taskList.push(fs.promises.readFile(i))
      }
    }
    const totalWords = (await Promise.all(taskList))
      .map(v => v.toString())
      .map(cleanText)
      .map(v => v.length)
      .reduce((a, b) => a + b, 0)
    return {
      total: totalWords,
      wordPerDay: Math.ceil(totalWords / pastDays)
    }
  }

  private static async getFirstCommitDate(): Promise<string> {
    return (await GitService.findFirstCommit()).date
  }

  private static async getCodeFrequency(): Promise<CodeFrequencyItem[]> {
    const filelist = this.listAllMdFile()
    const taskList: Promise<Buffer>[] = []
    for(let i of filelist) {
      if (i.startsWith('doc') || i.startsWith('./doc')) {
        taskList.push(fs.promises.readFile(i))
      }
    }
    const langMap = new Map<string, number>();

    (await Promise.all(taskList))
      .map(v => v.toString())
      .map(v => v.split('\n'))
      .flatMap(v => v)
      .filter(v => v.indexOf('```') != -1)
      .map(v => {
        if (v.indexOf('```') != -1) {
          return v.replace(/`/g, '')
        }
        return ''
      })
      .map(v => v.trim())
      .filter(v => v)
      .filter(v => v.length < 12)
      .forEach(v => {
        if (langMap.has(v)) {
          langMap.set(v, langMap.get(v)! + 1)
        }else{
          langMap.set(v, 1)
        }
      })
      return Array.from(langMap)
                  .sort((a,b) => a[1] - b[1])
                  .reverse()
                  .map(v => {
                    return {
                      lang: v[0],
                      frequency: v[1]
                    } as CodeFrequencyItem
                  })
  }

}

export default StatisticService
import { StatisticInfo, CommitStatistic, WordStatistic, CodeFrequencyItem } from "../dto/StatisticInfo";
import BaseService from "./BaseService";
import GitService from "./GitService";
import fs from 'fs'
import { cleanText } from "../util/StringUtils";
import BatchPromiseHelper from "../util/BatchPromiseHelper";
import GitChangeItem from "@/dto/git/GitChangeItem";

const imageSuffix = ['png', 'jpg', 'svg', 'jpeg', 'jiff', 'bmp', 'webp']

/**
 *
 * 统计单篇文本中各语言代码围栏的行数 (围栏状态机)
 * 提取自 getCodeFrequency 内部的 convertLangCount, 行为保持一致:
 *  - 遇到带语言名的 ``` 行时压入 [lang, 0] 并进入该语言块
 *  - 遇到不带语言名的 ``` 行时关闭当前块
 *  - 块内每行使最近一次压入项的计数 +1 (围栏行本身不计)
 * @export
 * @param {string} text
 * @return {[string, number][]}
 */
export function convertLangCount(text: string): [string, number][] {
  const arr = text.split("\n").map(v => v.trim()).filter(v => v.length != 0)
  let result: [string, number][] = []

  var lines = 0
  var currentLang = ""
  for(let line of arr) {
    const lang = line.replace(/`/g, '').trim()
    if (line.indexOf("```") != -1 && lang) {
      result.push([lang, lines])
      currentLang = lang
    } else if (line.indexOf("```") != -1 && !lang) {
      lines = 0
      currentLang = ""
    }else if (currentLang) {
      result[result.length - 1][1]++
    }
  }
  return result
}

/**
 *
 * 跨多篇文本统计代码语言频率
 * 提取自 getCodeFrequency: 围栏计数 -> 长度<12 过滤 -> 小写化 -> 别名归一 -> 按语言累加 -> 频率降序
 * @export
 * @param {string[]} contents
 * @return {CodeFrequencyItem[]}
 */
export function countCodeFrequency(contents: string[]): CodeFrequencyItem[] {
  const langMap = new Map<string, number>();
  const alias: any = {'js': 'javascript', 'sh': 'shell', 'py': 'python', 'rb': 'ruby', 'yaml': 'yml', 'el': 'erlang', 'erl': 'erlang'};

  contents
    .map(convertLangCount)
    .flatMap(v => v)
    .filter(v => v[0].length < 12)
    .map(v => {v[0] = v[0].toLowerCase(); return v})
    .map(v => {
      if (alias[v[0]]) {
        v[0] = alias[v[0]]
      }
      return v
    })
    .forEach(v => {
      if (langMap.has(v[0])) {
        langMap.set(v[0], langMap.get(v[0])! + v[1])
      }else{
        langMap.set(v[0], v[1])
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

/**
 *
 * 把逐提交的 [日期, 字数, 行数, 提交次数] 聚合为逐日累计趋势
 * 提取自 generateCommitTotalTrend: 按日折叠 -> 按时间排序 -> 逐日累加 (running cumulative)
 * @export
 * @param {[string, number, number, number][]} perCommit ISO 日期时间 + 当次增量
 * @return {[string, number, number, number][]} [日期, 累计字数, 累计行数, 累计提交次数][]
 */
export function aggregateTrend(perCommit: [string, number, number, number][]): [string, number, number, number][] {
  // 聚合日期
  const map = new Map<string, [number,number, number]>()
  for(let i of perCommit) {
    const date = i[0].split("T")[0]
    if (map.has(date)) {
      const data = map.get(date)!
      data[0] = data[0] + i[1]
      data[1] = data[1] + i[2]
      data[2] = data[2] + i[3]
    }else {
      map.set(date, [i[1], i[2], i[3]])
    }
  }
  const result: [string, number, number, number][] = []
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
    current[3] += previous[3]
  }
  return result
}

/**
 *
 * 按 GMT+8 小时把提交时间分桶 (UTCHours+8)%24, 结果按小时升序
 * 提取自 generateCommitHourHeatmap
 * @export
 * @param {string[]} dates 提交时间字符串
 * @return {[string, number][]}
 */
export function bucketCommitHours(dates: string[]): [string, number][] {
  const map = new Map<string, number>()
  for(let d of dates) {
    // GMT+8
    const hour = ((new Date(d).getUTCHours() + 8) % 24).toString()
    if (map.has(hour)) {
      map.set(hour, map.get(hour)! + 1)
    }else {
      map.set(hour, 1)
    }
  }
  return Array.from(map).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
}

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

    function flatGitShowList(map: Map<string, GitChangeItem[]>): GitChangeItem[]{
      const result = []
      for(let entries of map) {
        result.push(...entries[1])
      }
      return result
    }
    // [日期, 新增字数, 新增行数, 新增提交次数]
    const resp:[string, number, number, number][] = []
    for(let commit of commitList) {

      const i = await GitService.gitShowUseHash(commit.hash)
        .then( map => 
          flatGitShowList(map)
          .filter(v => v.filename.endsWith('.md'))
          .map(v => [cleanText(v.insertions.join()).length - cleanText(v.deletions.join()).length, v.insertions.length - v.deletions.length])
          .reduce((a,b) => [a[0] + b[0], a[1] + b[1]])
        )
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
    const contents = (await Promise.all(taskList)).map(v => v.toString())
    return countCodeFrequency(contents)
  }

}

export default StatisticService
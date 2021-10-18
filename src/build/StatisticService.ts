import { StatisticInfo, CommitStatistic, WordStatistic, CodeFrequencyItem } from "../dto/StatisticInfo";
import BaseService from "./BaseService";
import GitService from "./GitService";
import fs, { stat } from 'fs'
import { cleanText } from "../util/StringUtils";

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
      linePerDay: Math.ceil(commitList.map(v => v.insertions - v.deletions).filter(Boolean).reduce((a, b) => a + b, 0))
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
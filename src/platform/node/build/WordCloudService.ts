import BaseService from "./BaseService"
import { jiebaSegmenter } from '../../../adapters/node/JiebaSegmenter'
import { cleanText } from '../../../core/util/StringUtils'
import { nodeFileSystem } from '../../../adapters/node/NodeFileSystem'
import { isStopWord as coreIsStopWord } from '../../../core/text/stopWords'
import { topWordsByFrequency } from '../../../core/text/wordFrequency'


class WordCloudService extends BaseService{

  static async calcWordFrequency(): Promise<[string, number][]>{
    const fileList = this.listAllMdFile()
    const tasks = []
    for(let file of fileList) {
      tasks.push(nodeFileSystem.readFile(file))
    }
    const buffers = await Promise.all(tasks)
    const allWords = buffers.map(v => v.toString())
      .map(cleanText)
      .map(v => jiebaSegmenter.cut(v))
      .flatMap(v => v)
      .filter(v => !WordCloudService.isStopWord(v))
    // 词频统计内核(计数+排序+取前N)已下沉 core/text/wordFrequency。
    return topWordsByFrequency(allWords, 100)
  }

  static isStopWord(word: string): boolean{
    return coreIsStopWord(word)
  }

  // 清洗逻辑已单源化到 core/util/StringUtils.cleanText; 此处保留静态入口委托之(对外 API 不变)。
  static cleanText(text: string): string {
    return cleanText(text)
  }
}

export default WordCloudService
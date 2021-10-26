import BaseService from "./BaseService"
import jieba from 'nodejieba'
import fs from 'fs'

const stopWords = ['的', '是', '在', '一个', '和',
                 '与', '批注', '可以', '使用', '通过', 'md', '据库', '这个', '截图', '没有',
                 '进行', '如果', '需要', '务器', '屏幕', '不会', '就是', '或者', '并且',
                 '其他', '之后', '那么', '什么', '可能', '为了', '第一', '不是', '大小'
                 ]

class WordCloudService extends BaseService{
  
  static async calcWordFrequency(): Promise<[string, number][]>{
    const fileList = this.listAllMdFile()
    const tasks = []
    for(let file of fileList) {
      tasks.push(fs.promises.readFile(file))
    }
    const buffers = await Promise.all(tasks)
    const allWords = buffers.map(v => v.toString())
      .map(WordCloudService.cleanText)
      .map(v => jieba.cut(v))
      .flatMap(v => v)
      .filter(v => !WordCloudService.isStopWord(v))
    const map = new Map<string, number>()
    for(let i of allWords) {
      if (map.has(i)){
        map.set(i, map.get(i)! + 1)
      }else {
        map.set(i, 1)
      }
    }
    const list = Array.from(map)
                        .sort(function(a,b){return a[1] - b[1]})
                        .reverse();
    // 只取前100个词
    list.splice(100)
    return list                        
  }

  static isStopWord(word: string): boolean{
    if (word.length <= 1) {
      return true
    }
    return stopWords.indexOf(word) != -1
  }

  static cleanText(text: string): string {
    text = text.replace(/[’!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]/g, '')
    text = text.replace(/\n/g, '')
    text = text.replace(/\t/g, '')
    text = text.replace(/\s/g, '')
    text = text.replace(/[\u0060|\u0021-\u002c|\u002e-\u002f|\u003a-\u003f|\u2200-\u22ff|\uFB00-\uFFFD|\u2E80-\u33FF]/g, '')
    return text
  }
}

export default WordCloudService
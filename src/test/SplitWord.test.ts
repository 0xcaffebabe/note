import BaseService from "../build/BaseService"
import fs from 'fs'
import jieba from 'nodejieba'
import {cloneDeep} from '../util/DataUtils'

const stopWords = ['的', '是', '在', '一个', '和',
                 '与', '批注', '可以', '使用', '通过', 'md', '据库', '这个', '截图', '没有',
                 '进行', '如果', '需要', '务器', '屏幕', '不会', '就是', '或者', '并且',
                 '其他', '之后', '那么', '什么', '可能', '为了', '第一', '不是', '大小'
                 ]

function isStopWord(word: string): boolean{
  if (word.length <= 1) {
    return true
  }
  return stopWords.indexOf(word) != -1
}

function cleanText(text: string): string {
  text = text.replace(/[’!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]/g, '')
  text = text.replace(/\n/g, '')
  text = text.replace(/\t/g, '')
  text = text.replace(/\s/g, '')
  text = text.replace(/[\u0060|\u0021-\u002c|\u002e-\u002f|\u003a-\u003f|\u2200-\u22ff|\uFB00-\uFFFD|\u2E80-\u33FF]/g, '')
  return text
}

let totalList: [string, number][] = []

async function getAllWords() {
  const fileList = BaseService.listAllMdFile()
  const tasks = []
  for(let file of fileList) {
    tasks.push(fs.promises.readFile(file))
  }
  const buffers = await Promise.all(tasks)

  const allWords = buffers.map(v => v.toString())
      .map(cleanText)
      .map(v => jieba.cut(v))
      .flatMap(v => v)
      .filter(v => !isStopWord(v))
  const map = new Map<string, number>()
  for(let i of allWords) {
    if (map.has(i)){
      map.set(i, map.get(i)! + 1)
    }else {
      map.set(i, 1)
    }
  }
  totalList = Array.from(map)
                      .sort(function(a,b){return a[1] - b[1]})
                      .reverse();
}

function getDocVec(doc: string): number[] {
  const content = cleanText(fs.readFileSync(doc).toString())
  const map = new Map<string, number>()
  jieba.cut(content)
                .filter(v => !isStopWord(v))
                .forEach(i => map.set(i, (map.get(i) || 0) + 1))
  
  const list = cloneDeep(totalList) as [string, number][]
  list.forEach(v => v[1] = map.get(v[0]) || 0)
  return list.map(v => v[1])
}
// 余弦相似度
function sim(vec1: number[], vec2: number[]) {
  if (vec1.length != vec2.length) {
    throw Error('长度不同')
  }
  let xPowSum = 0
  let yPowSum = 0
  let xmySum = 0
  for(let i = 0; i < vec1.length; i++) {
    xPowSum += Math.pow(vec1[i], 2)
    yPowSum += Math.pow(vec2[i], 2)
    xmySum += vec1[i] * vec2[i]
  }
  return xmySum / Math.sqrt(xPowSum * yPowSum)
}

async function main() {
  await getAllWords()
  const v1 = getDocVec("./doc/软件工程/架构/系统设计/可用性.md")
  const v2 = getDocVec("./doc/软件工程/微服务/事务.md")
  const v3 = getDocVec("./doc/软件工程/架构/系统设计/可用性.md")
  console.log(sim(v1,v2))
  console.log(sim(v1,v3))
}

main()

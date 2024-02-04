import BaseService from '../build/BaseService'
import DocService from '../build/DocService'
import fs from 'fs'
import util from 'util'
import { cleanText } from '../util/StringUtils';
import ClusterNode from '../dto/ClusterNode';
import jieba from 'nodejieba'
import {cloneDeep} from 'lodash-es'

const reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");

const stopWords = ['的', '是', '在', '一个', '和',
                 '与', '批注', '可以', '使用', '通过', 'md', '据库', '这个', '截图', '没有',
                 '进行', '如果', '需要', '务器', '屏幕', '不会', '就是', '或者', '并且',
                 '其他', '之后', '那么', '什么', '可能', '为了', '第一', '不是', '大小'
                 ]
let totalList: [string, number][] = []

function similar(c1: string, c2: string) {
  const v1 = getDocVec(c1)
  const v2 = getDocVec(c2)
  return sim(v1,v2)
}

const stopFiles = [
  'SUMMARY.md',
  'README.md',
  '书单.md',
  '参考文献.md',
  '技术栈参考.md',
  'leetcode.md',
  '学习计划.md',
  '基于位置的网络社交平台分析与设计.md',
  '全文检索引擎在信息检索中的应用.md',
  'MyBook.md',
]

function stopFileCheck(filename: string) {
  for(const name of stopFiles) {
    if (filename.indexOf(name) != -1) {
      return false
    }
  }
  return true
}

async function main(ret = false): Promise<ClusterNode[]> {
  await getAllWords()
  const files = BaseService.listFilesBySuffix("md", "doc").filter(stopFileCheck)
  const similarCache = new Map<string,number>()
  // 聚类列表
  const cluster: ClusterNode[] = []
  for(const file of files) {
    const node: ClusterNode = new ClusterNode()
    node.name = file
    cluster.push(node)
  }
  // 后N轮
  while(cluster.length > 1) {

      const cluster1 = cluster.shift()
      // console.log(cluster1)
      if (!cluster1) {
        continue
      }

      let maxSim = 0
      let simIndex = -1
      for(let j = 0; j < cluster.length;j++) {
        const cluster2 = cluster[j]
        if (JSON.stringify(cluster1) == JSON.stringify(cluster2)) {
          continue
        }
        let totalSim = 0
        let cnt = 0
        for(const file1 of cluster1.all()) {
          for(const file2 of cluster2.all()) {
            const key = file1 + "-" + file2
            const key1 = file2 + "-" + file1
            if (similarCache.has(key) || similarCache.has(key1)) {
              totalSim += similarCache.get(key)! || similarCache.get(key1)!
            }else {
              const value = similar(file1, file2)
              similarCache.set(key, value)
              similarCache.set(key1, value)
              totalSim += value
            }
            cnt++
          }
        }
        if (cnt != 0) {
          const sim = totalSim / cnt
          if (sim > maxSim) {
            maxSim = sim
            simIndex = j
          }
        }
      }
  
      if (simIndex != -1) {
        const newCluster = new ClusterNode()
        newCluster.children = [cluster1,cluster[simIndex]]
        cluster.push(newCluster)
        cluster.splice(simIndex, 1)
        // console.log(util.inspect(cluster.slice(Math.max(cluster.length - 5, 1)), {showHidden:false, depth: null, colors: true}))
      }
    }
    if (ret) {
      return cluster
    } else {
      fs.writeFileSync("./docCluster.json", JSON.stringify(cluster))
      return []
    }
  
}

async function generateDocTagPrediction() {
  await getAllWords()
  const tagMapping = await DocService.buildTagMapping()
  const files = BaseService.listFilesBySuffix("md", "doc").filter(stopFileCheck)
  const mapping = new Map<string, [string, number][]>()
  for(const file of files) {
    const vec1 = getDocVec(file)
    mapping.set(file, [])
    for(const tag of tagMapping) {
      let sumDis = 0
      for(const tagFile of tag[1]) {
        sumDis += sim(vec1, getDocVec(tagFile))
      }
      const avgDis = sumDis / tag[1].length
      mapping.get(file)!.push([tag[0], avgDis])
    }
    mapping.get(file)!.sort((b,a) => a[1] - b[1])
    mapping.set(file, mapping.get(file)!.splice(0,5))
  }
  const res = new Map<string, string[]>()
  for(const file of files) {
    res.set(file, mapping.get(file)?.map(v => v[0]) || [])
  }
  return Array.from(res)
}


function isStopWord(word: string): boolean{
  if (word.length <= 1) {
    return true
  }
  return stopWords.indexOf(word) != -1
}

async function getAllWords() {
  const fileList = BaseService.listAllMdFile()
  const tasks = []
  for(const file of fileList) {
    tasks.push(fs.promises.readFile(file))
  }
  const buffers = await Promise.all(tasks)

  const allWords = buffers.map(v => v.toString())
      .map(cleanText)
      .map(v => jieba.cut(v))
      .flatMap(v => v)
      .filter(v => !isStopWord(v))
  const map = new Map<string, number>()
  for(const i of allWords) {
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
const vecCache = new Map<string, number[]>()
function getDocVec(file: string): number[] {
  if (vecCache.has(file)) {
    return vecCache.get(file)!
  }
  const content = fs.readFileSync(file).toString()
  const map = new Map<string, number>()
  jieba.cut(content || '')
                .filter(v => !isStopWord(v))
                .forEach(i => map.set(i, (map.get(i) || 0) + 1))
  
  const list = cloneDeep(totalList)
  list.forEach(v => v[1] = map.get(v[0]) || 0)
  const vec = list.map(v => v[1])
  vecCache.set(file, vec)
  return vec
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

export default {main, generateDocTagPrediction}
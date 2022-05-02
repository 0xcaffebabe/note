import BaseService from '../build/BaseService'
import fs from 'fs'
import util from 'util'

var reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");

class ClusterNode {
  vals: string[] = []
  children: ClusterNode[] = []
  all(): string[] {
    return [...this.vals, ...this.children.map(v => v.all()).flatMap(v => v)]
  }
}

function similar(s: string, t: string, f: number = 3): number {
  if (!s || !t) {
      return 0
  }
  var l = s.length > t.length ? s.length : t.length
  var n = s.length
  var m = t.length
  var d: number[][] = []
  f = f || 3
  var min = function(a: number, b: number, c: number) {
      return a < b ? (a < c ? a : c) : (b < c ? b : c)
  }
  var i, j, si, tj, cost
  if (n === 0) return m
  if (m === 0) return n
  for (i = 0; i <= n; i++) {
      d[i] = []
      d[i][0] = i
  }
  for (j = 0; j <= m; j++) {
      d[0][j] = j
  }
  for (i = 1; i <= n; i++) {
      si = s.charAt(i - 1)
      for (j = 1; j <= m; j++) {
          tj = t.charAt(j - 1)
          if (si === tj) {
              cost = 0
          } else {
              cost = 1
          }
          d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      }
  }
  let res = (1 - d[n][m] / l)
  return parseFloat(res.toFixed(f))
}

function cleanText(str: string): string {
  return str.replace(/[’!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]/g, '')
    .replace(/-/g, '')
    .replace(/#/g, '')
    .replace(/\s/g, '')
    .replace(/\|/g, '')
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
  for(let name of stopFiles) {
    if (filename.indexOf(name) != -1) {
      return false
    }
  }
  return true
}

async function  main() {
  let files = BaseService.listFilesBySuffix("md", "doc").filter(stopFileCheck)
  const map = new Map<string, string>()
  const similarCache = new Map<string,number>()
  for(let file of files) {
    const content = fs.readFileSync(file).toString().split("\n").map(cleanText).map(v => v.trim()).filter(v => v.indexOf("assets") == -1).filter(v => v.length > 20)
    .filter(v => reg.test(v)).join("\n")
    map.set(file, content)
  }
  // 聚类列表
  const cluster: ClusterNode[] = []
  for(let file of files) {
    const node: ClusterNode = new ClusterNode()
    node.vals = [file]
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
        for(let file1 of cluster1.all()) {
          for(let file2 of cluster2.all()) {
            const key = file1 + "-" + file2
            const key1 = file2 + "-" + file1
            if (similarCache.has(key) || similarCache.has(key1)) {
              totalSim += similarCache.get(key)! || similarCache.get(key1)!
            }else {
              const value = similar(map.get(file1)!, map.get(file2)!)
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
        console.log(util.inspect(cluster.slice(Math.max(cluster.length - 5, 1)), {showHidden:false, depth: null, colors: true}))
      }
    }
  
    fs.writeFileSync("./docCluster.json", JSON.stringify(cluster))
  
}
main()
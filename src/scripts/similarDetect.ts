import BaseService from '../build/BaseService'
import fs from 'fs'

var reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");

function similar(s: string, t: string, f: number = 3) {
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
  return res.toFixed(f)
}

function cleanText(str: string): string {
  return str.replace(/[’!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]/g, '')
    .replace(/-/g, '')
    .replace(/#/g, '')
    .replace(/\s/g, '')
    .replace(/\|/g, '')
}

async function  main() {
  const files = BaseService.listFilesBySuffix("md", "doc").filter(v => v.indexOf("SUMMARY") == -1 && v.indexOf("README") == -1)
  const map =  new Map<string, string[]>()
  for(let file of files) {
    const lines = fs.readFileSync(file).toString().split("\n").map(cleanText).map(v => v.trim()).filter(v => v.indexOf("assets") == -1).filter(v => v.length > 20)
    .filter(v => reg.test(v))
    map.set(file, lines)
  }
  for(let entry1 of map) {
    for(let line1 of entry1[1]) {
      for(let entry2 of map) {
        if (entry1[0] == entry2[0]) {
          continue
        }
        for(let line2 of entry2[1]) {
          const sim = similar(line1, line2)
          if (sim > 0.6) {
            console.log(`${entry1[0]} ${line1} ${entry2[0]} ${line2} sim ${sim}`)
          }
        }
      }
    }
  }
}
main()
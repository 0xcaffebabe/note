import BaseService from '../build/BaseService'
import fs from 'fs'
import DocService from '../build/DocService';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import UrlConst from '../const/UrlConst';
import { SimilarItem } from '../dto/doc/SimilarItem';

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



function extractText(md: string): string {
  const html = marked(md)
  const dom =  new JSDOM(`<!DOCTYPE html><body>${html}</body></html>`)
  return Array.from(dom.window.document.body.children).filter(v => v.tagName != 'PRE').map(v => v.textContent).join("\n")
}

const similarList: SimilarItem[] = []
async function  main() {
  const files = BaseService.listFilesBySuffix("md", "doc").filter(stopFileCheck)
  const map =  new Map<string, string[]>()
  for(let file of files) {
    const lines = extractText(fs.readFileSync(file).toString()).split("\n").map(cleanText).map(v => v.trim())
      .filter(v => v.length > 20)
      .filter(v => reg.test(v))
    map.set(file, lines)
  }
  const processedFileMap = new Map<string, string>()

  for(let entry1 of map) {
    for(let line1 of entry1[1]) {
      for(let entry2 of map) {
        if (entry1[0] == entry2[0]) {
          continue
        }
        for(let line2 of entry2[1]) {
          if ((processedFileMap.get(entry1[0]+line1) || '') == entry2[0]+line2) {
            continue
          }
          const sim = similar(line1, line2)
          if (sim > 0.6) {
            console.log(`${entry1[0]} ${line1} ${entry2[0]} ${line2} sim ${sim}`)
            similarList.push({
              target: entry1[0],
              targetText: line1,
              source: entry2[0],
              sourceText: line2,
              similar: sim
            } as SimilarItem)
          }
          processedFileMap.set(entry1[0]+line1, entry2[0]+line2)
          processedFileMap.set(entry2[0]+line2, entry1[0]+line1)
        }
      }
    }
  }
  fs.writeFileSync("." + UrlConst.textSimilarJson, JSON.stringify(similarList))
}
main()
// 词频统计(平台无关): 把词序列聚合为"按频率降序的前 N 个 [词, 次数]"。
// 提取自 build/WordCloudService.calcWordFrequency 的统计内核, 行为逐操作保持
// (Map 计数 -> 按次数升序排序 -> reverse -> 取前 topN)。
export function topWordsByFrequency(words: string[], topN: number): [string, number][] {
  const map = new Map<string, number>()
  for (let i of words) {
    if (map.has(i)) {
      map.set(i, map.get(i)! + 1)
    } else {
      map.set(i, 1)
    }
  }
  const list = Array.from(map)
                      .sort(function(a, b){ return a[1] - b[1] })
                      .reverse();
  list.splice(topN)
  return list
}

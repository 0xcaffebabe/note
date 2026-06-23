import { CodeFrequencyItem, CommitStatistic, WordStatistic } from '../domain/StatisticInfo'
import GitChangeItem from '../domain/git/GitChangeItem'
import CommitInfo from '../domain/CommitInfo'
import DocUtils from '../util/DocUtils'

// 统计纯转换(平台无关): 代码语言频率、提交趋势累计、提交时段分桶、逐日提交计数、文档按提交时间排序。
// 全部为确定性纯函数(仅 new Date(str) 解析, 无 fs/git/IO), 任何运行时生成统计数据时复用。
// 驱动层(build/StatisticService、build/DocService)负责读文件/取 git, 把数据喂给这些函数。

/**
 * 统计单篇文本中各语言代码围栏的行数 (围栏状态机)
 * 提取自 getCodeFrequency 内部的 convertLangCount, 行为保持一致:
 *  - 遇到带语言名的 ``` 行时压入 [lang, 0] 并进入该语言块
 *  - 遇到不带语言名的 ``` 行时关闭当前块
 *  - 块内每行使最近一次压入项的计数 +1 (围栏行本身不计)
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
 * 跨多篇文本统计代码语言频率
 * 提取自 getCodeFrequency: 围栏计数 -> 长度<12 过滤 -> 小写化 -> 别名归一 -> 按语言累加 -> 频率降序
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
 * 把逐提交的 [日期, 字数, 行数, 提交次数] 聚合为逐日累计趋势
 * 提取自 generateCommitTotalTrend: 按日折叠 -> 按时间排序 -> 逐日累加 (running cumulative)
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
 * 按 GMT+8 小时把提交时间分桶 (UTCHours+8)%24, 结果按小时升序
 * 提取自 generateCommitHourHeatmap
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

/**
 * 按自然日把提交日期分桶计数, 提取自 generateYearsCommitHeatmap。
 * ⚠️ 不排序——保持 Map 的插入序(= 输入序), 这是与 bucketCommitHours 的关键差异。
 * ⚠️ 键必须 new Date(d).toISOString().split('T')[0](先规整再取日), 不可对原始串裸 split。
 */
export function countCommitsByDay(dates: string[]): [string, number][] {
  const map = new Map<string, number>()
  for (let d of dates) {
    const date = new Date(d).toISOString().split('T')[0]
    if (map.has(date)) {
      map.set(date, map.get(date)! + 1)
    } else {
      map.set(date, 1)
    }
  }
  return Array.from(map)
}

/**
 * 把 hash -> 变更项 的映射按 entries 顺序展平为一维列表(保序)。
 * 提取自 generateCommitTotalTrend 内部的 flatGitShowList。
 */
export function flattenChangeItems(map: Map<string, GitChangeItem[]>): GitChangeItem[] {
  const result: GitChangeItem[] = []
  for (let entries of map) {
    result.push(...entries[1])
  }
  return result
}

/**
 * 统计一批变更项里 .md 文件的 [净字数变化, 净行数变化]。
 * 提取自 generateCommitTotalTrend: 过滤 .md -> [cleanText(增).len - cleanText(删).len, 增行 - 删行] -> 归约求和。
 * ⚠️ reduce 无初值: 空 .md 列表会抛 TypeError(由调用方 .catch 兜成 [date,0,0,0]), 这是既有行为, 不可加初值。
 * cleanText 由调用方注入(平台无关), 与 build/runtime 共用同一口径。
 */
export function sumMarkdownDelta(items: GitChangeItem[], cleanText: (s: string) => string): [number, number] {
  return items
    .filter(v => v.filename.endsWith('.md'))
    .map(v => [cleanText(v.insertions.join()).length - cleanText(v.deletions.join()).length, v.insertions.length - v.deletions.length])
    .reduce((a, b) => [a[0] + b[0], a[1] + b[1]]) as [number, number]
}

/**
 * 把 [文件路径, 末次提交] 列表按提交时间升序排序, 过滤掉 ignoreDoc(按 docId 比对), 再映射为 [docId, 提交]。
 * 提取自 generateDocListOrderByLastCommit。
 * ⚠️ 比较器逐字保留 new Date(x).getTime() 之差(日期不可解析时为 NaN, 依赖 V8 稳定排序保等键原序);
 *    ignoreDoc 过滤必须按 docUrl2Id(v[0]) 而非原始路径。sort 原地修改入参数组(与原行为一致)。
 */
export function orderByLastCommit(pairs: [string, CommitInfo][], ignoreDoc: string[]): [string, CommitInfo][] {
  return pairs
    .sort((a, b) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime())
    .filter(v => ignoreDoc.indexOf(DocUtils.docUrl2Id(v[0])) == -1)
    .map(v => [DocUtils.docUrl2Id(v[0]), v[1]])
}

/**
 * 由全量提交 + 当前时刻算"日均提交/日均净增行"。提取自 StatisticService.getCommitStatistic。
 * nowMs 由调用方传入(= Date.now(), 构建时钟); 不在 core 取 new Date(), 保持纯函数可测。
 * ⚠️ minDate 逐字保留 `.sort()[0]` —— 默认字典序排序(非数值), 这是既有行为, 不可改成数值比较。
 */
export function computeCommitStatistic(commits: CommitInfo[], nowMs: number): CommitStatistic {
  const minDate = commits.map(v => v.date).map(Date.parse).sort()[0]
  const pastDays = Math.ceil((nowMs - minDate) / (3600 * 24 * 1000))
  return {
    commitPerDay: parseFloat((commits.length / pastDays).toFixed(2)),
    linePerDay: Math.ceil(commits.map(v => v.insertions - v.deletions).filter(Boolean).reduce((a, b) => a + b, 0) / pastDays),
  }
}

/**
 * 由各文档正文 + 首次提交时间 + 当前时刻算"总字数/日均字数"。提取自 StatisticService.getWordStatistic。
 * contents 已是各文档字符串(fs 读取留驱动); cleanText 注入(平台无关)。nowMs = 构建时钟。
 */
export function computeWordStatistic(contents: string[], firstCommitDate: string, nowMs: number, cleanText: (s: string) => string): WordStatistic {
  const pastDays = Math.ceil((nowMs - Date.parse(firstCommitDate)) / (3600 * 24 * 1000))
  const totalWords = contents.map(cleanText).map(v => v.length).reduce((a, b) => a + b, 0)
  return {
    total: totalWords,
    wordPerDay: Math.ceil(totalWords / pastDays),
  }
}

/** 章节数 = 后缀为 .md / .MD 的文件数。提取自 generateStatistic。 */
export function countMarkdownFiles(files: string[]): number {
  return files.filter(v => v.endsWith('.md') || v.endsWith('.MD')).length
}

/** 图片后缀(大小写均算)。提取自 StatisticService 顶部 imageSuffix。 */
export const IMAGE_SUFFIXES = ['png', 'jpg', 'svg', 'jpeg', 'jiff', 'bmp', 'webp']

/** 图片数 = 后缀(含大写)命中 IMAGE_SUFFIXES 的文件数。提取自 generateStatistic。 */
export function countImageFiles(files: string[]): number {
  return files.filter(v => {
    for (let item of IMAGE_SUFFIXES) {
      if (v.endsWith('.' + item) || v.endsWith('.' + item.toUpperCase())) {
        return true
      }
    }
    return false
  }).length
}

/**
 * 判断"提交总量趋势"远端数据是否过期需本地重生成: 空 -> true; 否则取末项日期距今 >= maxAgeDays 天 -> true。
 * 提取自 CommitTotalTrendGenerator。nowMs 注入(构建时钟), 不在 core 取 Date.now(), 保持纯函数。
 * ⚠️ 逐字保留除法表达式与 >=; 非法日期 getTime()=NaN, NaN>=7 为 false(沿用远端), 与既有行为一致;
 *    严禁内部调 DateUtils.daysSince(它重读 Date.now()+floor, 破坏 nowMs 注入纯度与口径)。
 */
export function shouldRegenerateTrend(remote: ReadonlyArray<[string, number, number]>, nowMs: number, maxAgeDays = 7): boolean {
  if (remote.length === 0) {
    return true
  }
  const recentItem = remote[remote.length - 1]
  const lastTime = new Date(recentItem[0]).getTime()
  return (nowMs - lastTime) / (3600 * 1000 * 24) >= maxAgeDays
}

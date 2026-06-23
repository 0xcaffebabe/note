import { describe, it, expect } from 'vitest'
import {
  convertLangCount,
  countCodeFrequency,
  aggregateTrend,
  bucketCommitHours,
  countCommitsByDay,
  flattenChangeItems,
  sumMarkdownDelta,
  orderByLastCommit,
  computeCommitStatistic,
  computeWordStatistic,
  countMarkdownFiles,
  countImageFiles,
  shouldRegenerateTrend,
} from "@/core/statistic/StatTransforms"
import type { CodeFrequencyItem } from '@/core/domain/StatisticInfo'
import DocUtils from '@/core/util/DocUtils'
import type GitChangeItem from '@/core/domain/git/GitChangeItem'
import CommitInfo from '@/core/domain/CommitInfo'

// 守护 StatisticService 中从私有方法里抽出的四个纯函数 —— 统计页(代码频率 / 提交趋势 / 小时热力图)的数据底座。
// 这些核心原先深埋在 getCodeFrequency / generateCommitTotalTrend / generateCommitHourHeatmap 内部,
// 现抽成导出纯函数, 原方法仅做 (读文件 / 拉 git) -> 委托。本套用例锁定其当前真实行为, 行为漂移即视觉/数值错位。
//
// 关键非直觉点(均经 npx tsx 真机探测, 非凭字面推断):
//   1) convertLangCount: 围栏行本身不计行数; 开围栏压入 [lang, 0], 块内每行使最近一项 +1;
//      不带语言名的 ``` 关闭当前块; 缺收尾围栏时块一直延续到文末。
//   2) countCodeFrequency: 「长度<12」过滤作用于"原始语言名"(小写化/别名归一之前);
//      频率为内容行数(不含围栏行); 跨篇按语言累加; 结果按频率降序。
//   3) aggregateTrend: 先按日折叠(同日相加), 再按时间升序, 再逐日做 running cumulative(含提交次数列)。
//   4) bucketCommitHours: GMT+8 = (UTCHours+8)%24, 故 16:00Z 落在 0 点, 23:00Z 落在 7 点; 结果按小时数升序。
//
// 日期相关断言全部使用 ISO/UTC(Z 后缀)输入, 与本机时区无关, 不随运行环境漂移。

describe('convertLangCount 单篇围栏行数状态机', () => {
  it('单个代码块: 围栏行不计, 内容行各 +1', () => {
    // ```js 开块压入 [js,0], 两行内容各 +1 -> 2
    expect(convertLangCount('```js\nconst a=1\nconst b=2\n```')).toEqual([['js', 2]])
  })

  it('两个同语言代码块: 各自独立计数(块间互不累加)', () => {
    expect(
      convertLangCount('```python\nx=1\n```\ntext\n```python\ny=2\nz=3\n```'),
    ).toEqual([['python', 1], ['python', 2]])
  })

  it('缺收尾围栏时, 代码块一直延续到文末仍被统计', () => {
    expect(convertLangCount('```go\nfmt.Println()\n')).toEqual([['go', 1]])
  })

  it('空字符串返回空数组', () => {
    expect(convertLangCount('')).toEqual([])
  })

  it('无任何围栏的纯文本返回空数组(围栏外的行被忽略)', () => {
    expect(convertLangCount('hello\nworld')).toEqual([])
  })

  it('已知行为: 一个带语言名的 ``` 行紧接另一个带语言名的 ``` 行时, 后者被当作新开块而非收尾', () => {
    // ```js 开块[js,0]; a -> [js,1]; ```ts 带语言名 -> 新开 [ts,0]; b,c -> [ts,2]
    expect(convertLangCount('```js\na\n```ts\nb\nc\n```')).toEqual([['js', 1], ['ts', 2]])
  })

  it('围栏行内含语言名前后空白也能被 trim 后识别', () => {
    expect(convertLangCount('```  rust  \nfn main(){}\n```')).toEqual([['rust', 1]])
  })

  it('空代码块(开围栏后立即收尾)计数为 0', () => {
    expect(convertLangCount('```java\n```')).toEqual([['java', 0]])
  })
})

describe('countCodeFrequency 跨篇代码语言频率聚合', () => {
  const toMap = (items: CodeFrequencyItem[]) =>
    Object.fromEntries(items.map((v) => [v.lang, v.frequency]))

  it('小写化 + 别名归一: JS -> javascript, py -> python', () => {
    const out = countCodeFrequency(['```JS\na\nb\n```', '```py\nx\n```'])
    expect(toMap(out)).toEqual({ javascript: 2, python: 1 })
  })

  it('别名表全覆盖: yaml->yml, sh->shell, erl/el->erlang(两者合并)', () => {
    const out = countCodeFrequency([
      '```yaml\na\n```',
      '```sh\nb\n```',
      '```erl\nc\n```',
      '```el\nd\n```',
    ])
    // erl 与 el 同归 erlang -> 频率 2
    expect(toMap(out)).toEqual({ erlang: 2, shell: 1, yml: 1 })
  })

  it('别名表其余项: rb -> ruby', () => {
    expect(toMap(countCodeFrequency(['```rb\nputs 1\n```']))).toEqual({ ruby: 1 })
  })

  it('「长度<12」过滤作用于原始语言名: 11 字保留, 12 字被丢弃', () => {
    expect(toMap(countCodeFrequency(['```abcdefghijk\nx\n```']))).toEqual({ abcdefghijk: 1 }) // 11
    expect(countCodeFrequency(['```abcdefghijkl\nx\n```'])).toEqual([]) // 12 -> 过滤掉
  })

  it('已知行为: 过滤发生在小写/别名之前, 故按"原始名"长度判定', () => {
    // "javascript"(别名后)长 10, 但输入用别名前的短名才进得来; 这里直接给一个长别名前名验证边界
    // 'JAVASCRIPTX'(11) 小写后 'javascriptx' 不在别名表, 保留
    expect(toMap(countCodeFrequency(['```JAVASCRIPTX\na\n```']))).toEqual({ javascriptx: 1 })
  })

  it('跨篇按语言累加, 结果按频率降序排列', () => {
    const out = countCodeFrequency(['```js\na\n```', '```js\nb\nc\n```', '```go\nz\n```'])
    expect(out).toEqual([
      { lang: 'javascript', frequency: 3 },
      { lang: 'go', frequency: 1 },
    ])
  })

  it('空输入返回空数组', () => {
    expect(countCodeFrequency([])).toEqual([])
  })

  it('全部为非代码文本时返回空数组', () => {
    expect(countCodeFrequency(['这是一段普通文字\n没有代码块', '另一段'])).toEqual([])
  })

  it('频率相同的两种语言都出现(降序排序对相等项保持都在结果中)', () => {
    const out = countCodeFrequency(['```js\na\n```', '```go\nb\n```'])
    expect(out).toHaveLength(2)
    expect(toMap(out)).toEqual({ javascript: 1, go: 1 })
  })
})

describe('aggregateTrend 逐日累计趋势(折叠 + 排序 + running cumulative)', () => {
  it('同一天的多次提交先折叠相加, 再形成单行', () => {
    expect(
      aggregateTrend([
        ['2024-01-01T10:00:00Z', 5, 2, 1],
        ['2024-01-01T12:00:00Z', 3, 1, 1],
      ]),
    ).toEqual([['2024-01-01', 8, 3, 2]])
  })

  it('多日数据做 running cumulative: 字数/行数/提交次数三列均逐日累加', () => {
    expect(
      aggregateTrend([
        ['2024-01-01T10:00:00Z', 10, 4, 1],
        ['2024-01-02T10:00:00Z', 5, 2, 1],
        ['2024-01-03T10:00:00Z', 7, 3, 1],
      ]),
    ).toEqual([
      ['2024-01-01', 10, 4, 1],
      ['2024-01-02', 15, 6, 2],
      ['2024-01-03', 22, 9, 3],
    ])
  })

  it('乱序输入会先按时间升序排序再累计(结果与有序输入一致)', () => {
    expect(
      aggregateTrend([
        ['2024-01-03T10:00:00Z', 7, 3, 1],
        ['2024-01-01T10:00:00Z', 10, 4, 1],
        ['2024-01-02T10:00:00Z', 5, 2, 1],
      ]),
    ).toEqual([
      ['2024-01-01', 10, 4, 1],
      ['2024-01-02', 15, 6, 2],
      ['2024-01-03', 22, 9, 3],
    ])
  })

  it('空输入返回空数组', () => {
    expect(aggregateTrend([])).toEqual([])
  })

  it('单条输入原样返回(无前序可累加)', () => {
    expect(aggregateTrend([['2024-05-01T00:00:00Z', 9, 9, 1]])).toEqual([['2024-05-01', 9, 9, 1]])
  })

  it('负增量(删除多于新增)仍按代数和累计, 累计值可回落', () => {
    expect(
      aggregateTrend([
        ['2024-01-01T10:00:00Z', 10, 4, 1],
        ['2024-01-02T10:00:00Z', -3, -1, 1],
      ]),
    ).toEqual([
      ['2024-01-01', 10, 4, 1],
      ['2024-01-02', 7, 3, 2],
    ])
  })

  it('日期按 T 分割取日(同日不同时刻归并到同一天)', () => {
    const out = aggregateTrend([
      ['2024-06-19T00:00:01Z', 1, 1, 1],
      ['2024-06-19T23:59:59Z', 1, 1, 1],
    ])
    expect(out).toHaveLength(1)
    expect(out[0][0]).toBe('2024-06-19')
    expect(out[0]).toEqual(['2024-06-19', 2, 2, 2])
  })
})

describe('bucketCommitHours 按 GMT+8 小时分桶', () => {
  it('GMT+8 偏移: 23:00Z->7, 16:00Z->0, 00:00Z->8, 结果按小时升序', () => {
    expect(
      bucketCommitHours([
        '2024-01-01T23:00:00Z',
        '2024-01-01T16:00:00Z',
        '2024-01-01T00:00:00Z',
      ]),
    ).toEqual([['0', 1], ['7', 1], ['8', 1]])
  })

  it('同一小时桶累加计数', () => {
    expect(
      bucketCommitHours(['2024-01-01T16:00:00Z', '2024-01-01T16:30:00Z']),
    ).toEqual([['0', 2]])
  })

  it('空输入返回空数组', () => {
    expect(bucketCommitHours([])).toEqual([])
  })

  it('结果键为字符串小时, 且按数值(非字典序)升序', () => {
    // 数值排序: 2 < 10; 若按字典序会得到 "10" < "2"
    const out = bucketCommitHours([
      '2024-01-01T02:00:00Z', // +8 -> 10
      '2024-01-01T18:00:00Z', // +8 -> 26%24 -> 2
    ])
    expect(out).toEqual([['2', 1], ['10', 1]])
  })
})

describe('countCommitsByDay 逐日提交计数(不排序)', () => {
  it('键为 toISOString 规整后的日期, 同日累加', () => {
    expect(
      countCommitsByDay(['2024-03-02T10:00:00Z', '2024-03-02T20:00:00Z']),
    ).toEqual([['2024-03-02', 2]])
  })

  it('⚠️不排序: 保持 Map 插入序(= 输入首见序), 非按日期升序', () => {
    // 输入日期降序; 若误加 sort 会变成 [['2024-03-01',1],['2024-03-05',1]]
    expect(
      countCommitsByDay(['2024-03-05T00:00:00Z', '2024-03-01T00:00:00Z']),
    ).toEqual([['2024-03-05', 1], ['2024-03-01', 1]])
  })

  it('空输入返回空数组', () => {
    expect(countCommitsByDay([])).toEqual([])
  })
})

describe('flattenChangeItems 按 entries 顺序展平(保序)', () => {
  const item = (filename: string): GitChangeItem => ({ filename, insertions: [], deletions: [] })

  it('多 hash 的变更项按 Map 迭代序首尾相接', () => {
    const a = item('a.md'), b = item('b.md'), c = item('c.md')
    const map = new Map<string, GitChangeItem[]>([['h1', [a, b]], ['h2', [c]]])
    expect(flattenChangeItems(map)).toEqual([a, b, c])
  })

  it('空 Map 返回空数组', () => {
    expect(flattenChangeItems(new Map())).toEqual([])
  })
})

describe('sumMarkdownDelta .md 净字数/行数(cleanText 注入)', () => {
  const id = (s: string) => s // 注入恒等 cleanText, 锁定算术与 join 行为
  const item = (filename: string, insertions: string[], deletions: string[]): GitChangeItem =>
    ({ filename, insertions, deletions })

  it('净字数 = cleanText(增.join()).len - cleanText(删.join()).len; 净行数 = 增行 - 删行', () => {
    // insertions.join()='abc,de'(默认逗号连接, len 6); deletions.join()='x'(len 1) => 字 5; 行 2-1=1
    expect(sumMarkdownDelta([item('a.md', ['abc', 'de'], ['x'])], id)).toEqual([5, 1])
  })

  it('非 .md 文件被过滤掉, 不计入', () => {
    expect(sumMarkdownDelta([item('a.md', ['ab'], []), item('b.txt', ['zzzz'], [])], id)).toEqual([2, 1])
  })

  it('多项求和', () => {
    // a: 字 2-0=2, 行 1-0=1; b: 字 3-1=2, 行 1-1=0 => [4, 1]
    expect(
      sumMarkdownDelta([item('a.md', ['ab'], []), item('b.md', ['cde'], ['x'])], id),
    ).toEqual([4, 1])
  })

  it('⚠️ reduce 无初值: 空列表(或全非 md)抛错, 由调用方 .catch 兜底', () => {
    expect(() => sumMarkdownDelta([], id)).toThrow()
    expect(() => sumMarkdownDelta([item('x.txt', ['a'], [])], id)).toThrow()
  })
})

describe('orderByLastCommit 按提交时间升序 + 忽略名 + 映射 docId', () => {
  const mk = (date: string): CommitInfo => Object.assign(new CommitInfo(), { date })

  it('升序排序, 过滤 ignoreDoc(按 docId), 元素映射为 [docId, commit]', () => {
    const ca = mk('2024-02-01T00:00:00Z')
    const cb = mk('2024-01-01T00:00:00Z')
    const cr = mk('2024-03-01T00:00:00Z')
    const pairs: [string, CommitInfo][] = [
      ['doc/a.md', ca],
      ['doc/b.md', cb],
      ['doc/README.md', cr], // docUrl2Id -> 'README', 被忽略
    ]
    const out = orderByLastCommit(pairs, ['README', 'SUMMARY'])
    expect(out).toEqual([
      [DocUtils.docUrl2Id('doc/b.md'), cb], // b 最早
      [DocUtils.docUrl2Id('doc/a.md'), ca],
    ])
    expect(out.map(v => v[0])).toEqual(['b', 'a'])
  })

  it('空输入返回空数组', () => {
    expect(orderByLastCommit([], ['README'])).toEqual([])
  })
})

describe('computeCommitStatistic 日均提交/净增行(now 注入)', () => {
  const DAY = 3600 * 24 * 1000
  const c = (date: string, insertions: number, deletions: number): CommitInfo =>
    Object.assign(new CommitInfo(), { date, insertions, deletions })

  it('commitPerDay=两位小数, linePerDay=ceil(净增和/天)', () => {
    const minMs = Date.parse('2024-01-01T00:00:00Z')
    const commits = [c('2024-01-01T00:00:00Z', 10, 2), c('2024-01-11T00:00:00Z', 5, 1)]
    // pastDays = ceil((min+9天 - min)/天) = 9; commitPerDay=2/9=0.22; 净增和=8+4=12 -> ceil(12/9)=2
    const out = computeCommitStatistic(commits, minMs + 9 * DAY)
    expect(out).toEqual({ commitPerDay: 0.22, linePerDay: 2 })
  })

  it('filter(Boolean) 丢掉净增为 0 的提交再求和', () => {
    const minMs = Date.parse('2024-01-01T00:00:00Z')
    const commits = [c('2024-01-01T00:00:00Z', 3, 3), c('2024-01-02T00:00:00Z', 6, 1)]
    // 第一条净增 0 被 filter(Boolean) 丢弃; 和=5; pastDays=ceil(1)=1 -> linePerDay=5
    const out = computeCommitStatistic(commits, minMs + 1 * DAY)
    expect(out.linePerDay).toBe(5)
  })
})

describe('computeWordStatistic 总字数/日均字数(cleanText+now 注入)', () => {
  const DAY = 3600 * 24 * 1000
  const id = (s: string) => s
  it('total=Σ cleanText(内容).len; wordPerDay=ceil(total/天)', () => {
    const firstMs = Date.parse('2024-01-01T00:00:00Z')
    // total=3+2=5; pastDays=ceil(5)=5 -> wordPerDay=ceil(5/5)=1
    const out = computeWordStatistic(['abc', 'de'], '2024-01-01T00:00:00Z', firstMs + 5 * DAY, id)
    expect(out).toEqual({ total: 5, wordPerDay: 1 })
  })
})

describe('countMarkdownFiles / countImageFiles 文件资产计数', () => {
  it('章节数 = .md / .MD 结尾(.markdown 不算)', () => {
    expect(countMarkdownFiles(['a.md', 'b.MD', 'c.txt', 'd.markdown'])).toBe(2)
  })
  it('图片数 = 后缀(含大写)命中图片表', () => {
    expect(countImageFiles(['x.png', 'y.JPG', 'z.txt', 'w.webp', 'a.JPEG'])).toBe(4)
  })
  it('空表 -> 0', () => {
    expect(countMarkdownFiles([])).toBe(0)
    expect(countImageFiles([])).toBe(0)
  })
})

describe('shouldRegenerateTrend 远端趋势是否过期需本地重生成', () => {
  const DAY = 3600 * 1000 * 24
  const remote = (date: string): [string, number, number][] => [['2020-01-01T00:00:00Z', 0, 0], [date, 1, 2]]

  it('空 -> true(需本地生成)', () => {
    expect(shouldRegenerateTrend([], Date.parse('2024-01-01T00:00:00Z'))).toBe(true)
  })
  it('末项距今 < 7 天 -> false(用远端)', () => {
    const last = Date.parse('2024-01-01T00:00:00Z')
    expect(shouldRegenerateTrend(remote('2024-01-01T00:00:00Z'), last + 3 * DAY)).toBe(false)
  })
  it('末项距今 = 7 天 -> true(>= 边界)', () => {
    const last = Date.parse('2024-01-01T00:00:00Z')
    expect(shouldRegenerateTrend(remote('2024-01-01T00:00:00Z'), last + 7 * DAY)).toBe(true)
  })
  it('⚠️ 非法日期 -> NaN >= 7 为 false(沿用远端, 既有行为)', () => {
    expect(shouldRegenerateTrend([['not-a-date', 1, 2]], Date.parse('2024-06-01T00:00:00Z'))).toBe(false)
  })
})

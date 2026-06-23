

/**
 * 提交统计
 *
 * @class CommitStatistic
 */
export class CommitStatistic {
  // 每日平均提交
  commitPerDay: number = 0
  // 每日平均行数
  linePerDay: number = 0
}

/**
 * 字数统计
 *
 * @class WordStatistic
 */
export class WordStatistic {
  // 总字数
  total: number = 0
  // 每日平均字数
  wordPerDay : number = 0
}


/**
 * 代码频率
 *
 * @class CodeFrequencyItem
 */
export class CodeFrequencyItem {
  lang: string = ''
  frequency: number = 0
}
/**
 * 统计信息
 *
 * @class StatisticInfo
 */
export class StatisticInfo {
  // 生成时间
  generateTime: string = ''
  // 仓库大小 单位byte
  repositorySize: number = 0
  // 提交相关统计
  commit: CommitStatistic = new CommitStatistic()
  // 字数相关统计
  word: WordStatistic = new WordStatistic()
  // 章节数
  chapterCount: number = 0
  // 图片数
  imageCount : number = 0
  codeFrequency: CodeFrequencyItem[] = []
  firstCommitDate:string = '' 
}

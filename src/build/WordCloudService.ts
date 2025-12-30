import BaseService from "./BaseService"
import jieba from 'nodejieba'
import fs from 'fs'

const stopWords = [
  // 代词
  '我', '你', '他', '她', '它', '我们', '你们', '他们', '她们', '它们', '自己', '本人',
  '人家', '别人', '谁', '哪个', '哪些', '什么', '这样', '那样', '如此', '这般',

  // 冠词和指示词
  '这', '那', '这些', '那些', '这个', '那个', '这里', '那里', '这样', '那样',
  '每个', '每', '各', '各个', '所有', '全部', '一切', '全部',

  // 介词
  '的', '在', '是', '与', '和', '跟', '同', '及', '以及', '或', '或者',
  '关于', '对于', '对', '把', '被', '由', '从', '到', '向', '往', '朝',
  '沿着', '顺着', '按照', '依据', '根据', '以', '用', '比', '除了',

  // 连词
  '并且', '而且', '或者', '还是', '如果', '假如', '要是', '只要', '只有',
  '无论', '不管', '虽然', '尽管', '即使', '即便', '但是', '可是', '然而',
  '不过', '于是', '因此', '所以', '因为', '由于', '只要', '那么',

  // 助词
  '了', '着', '过', '的', '地', '得', '呢', '啊', '呀', '吗', '嘛', '吧',
  '呗', '哈', '哇', '哇塞', '呀', '嗯', '哦', '呃', '嘿', '喂',

  // 副词
  '很', '非常', '特别', '十分', '极其', '相当', '比较', '稍微', '有点',
  '已经', '曾经', '刚刚', '刚才', '正在', '将要', '就要', '马上', '立刻',
  '仍然', '依然', '还是', '依旧', '仍然', '都', '也', '还', '又', '再',
  '不', '没', '没有', '别', '不要', '莫', '勿', '是否',

  // 量词
  '个', '位', '条', '件', '项', '种', '份', '次', '回', '遍', '下', '点',
  '些', '多', '几', '多少', '若干', '一切', '全部', '所有', '各种',

  // 数词
  '一', '二', '两', '三', '四', '五', '六', '七', '八', '九', '十',
  '百', '千', '万', '亿', '第一', '第二', '第三', '零', '单', '双',

  // 常见无意义词汇
  '可以', '能够', '需要', '应该', '应当', '必须', '一定', '一定', '肯定',
  '可能', '也许', '或许', '大概', '大致', '左右', '左右', '上下', '前后',
  '进行', '进行中', '完成', '结束', '开始', '启动', '关闭', '打开',
  '批注', '截图', '屏幕', '务器', '据库', 'md', '大小', '不会', '就是',
  '其他', '之后', '那么', '不是', '为了', '因为', '所以', '但是', '如果',
  '需要', '使用', '通过', '一个', '和', '与', '批注', '可以', '使用', '通过',
  '据库', '截图', '没有', '进行', '如果', '需要', '务器', '屏幕', '不会',
  '就是', '或者', '并且', '其他', '之后', '那么', '什么', '可能', '为了',
  '第一', '不是', '大小'
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
import type { PinyinPort } from '../ports'

/**
 * 拼音索引/匹配: 多音字展开、全拼/首字母变体拼接、预计算索引等纯逻辑留在 core,
 * 仅"单字转拼音"这一原子能力通过注入的 PinyinPort 提供(适配器用 tiny-pinyin 实现)。
 */
export interface PinyinIndex {
  full: string[]
  first: string[]
}

const polyphonicMap = new Map<string, string[]>()
polyphonicMap.set('重', ['ZHONG', 'CHONG'])

export class Pinyin {
  constructor(private readonly engine: PinyinPort) {}

  private toPinyin(str: string): string[][] {
    const result: string[][] = []
    for (const char of str) {
      if (polyphonicMap.has(char)) {
        result.push(JSON.parse(JSON.stringify(polyphonicMap.get(char))))
      } else {
        result.push([this.engine.convertToPinyin(char)])
      }
    }
    return result
  }

  private flatPinyinResult(list: string[][], splitor: string = '-') {
    const result: string[] = []
    function travel(index: number, path: string) {
      if (index >= list.length) return
      for (const i of list[index]) {
        const subPath = path + i + splitor
        if (index == list.length - 1) {
          result.push(subPath.substring(0, subPath.length - 1))
        } else {
          travel(index + 1, subPath)
        }
      }
    }
    travel(0, '')
    return result
  }

  convertToPinyin(str: string, splitor: string = '-') {
    return this.flatPinyinResult(this.toPinyin(str), splitor)
  }

  fullPinyinContains(text: string, pinyin: string) {
    const pinyinList = this.convertToPinyin(text)
    for (const i of pinyinList) {
      if (i.replace(/-/gi, '').indexOf(pinyin.toUpperCase()) != -1) return true
    }
    return false
  }

  firstLetterPinyinContains(text: string, pinyin: string) {
    const pinyinList = this.convertToPinyin(text)
    for (const i of pinyinList) {
      if (i.split('-').map(v => v.charAt(0)).join('').indexOf(pinyin.toUpperCase()) != -1) return true
    }
    return false
  }

  buildIndex(text: string): PinyinIndex {
    const pinyinList = this.convertToPinyin(text)
    return {
      full: pinyinList.map(i => i.replace(/-/gi, '')),
      first: pinyinList.map(i => i.split('-').map(v => v.charAt(0)).join('')),
    }
  }

  // 基于预计算索引的匹配是纯函数(不依赖引擎), 做成静态方法
  static indexFullContains(index: PinyinIndex, pinyin: string): boolean {
    const kw = pinyin.toUpperCase()
    for (const i of index.full) {
      if (i.indexOf(kw) != -1) return true
    }
    return false
  }

  static indexFirstLetterContains(index: PinyinIndex, pinyin: string): boolean {
    const kw = pinyin.toUpperCase()
    for (const i of index.first) {
      if (i.indexOf(kw) != -1) return true
    }
    return false
  }
}

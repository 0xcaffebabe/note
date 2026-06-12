import pinyin from 'tiny-pinyin'

const polyphonicMap = new Map<string, string[]>()
polyphonicMap.set('重', ['ZHONG', 'CHONG'])

export namespace PinyinUtils {

  /**
   * 预计算的拼音索引(含多音字变体展开)
   * full: 全拼变体(已去除分隔符) first: 首字母变体
   */
  export interface PinyinIndex {
    full: string[]
    first: string[]
  }

  function toPinyin(str: string): string[][] {
    const result: string[][] = []
    for (const char of str) {
      if (polyphonicMap.has(char)) {
        result.push(JSON.parse(JSON.stringify(polyphonicMap.get(char))))
      } else {
        result.push([pinyin.convertToPinyin(char)])
      }
    }
    return result
  }

  /**
   *
   * 遍历记录拼音全路径
   * @param {string[][]} list
   */
  function flatPinyinResult(list: string[][], splitor: string = '-') {
    const result: string[] = []
    function travel(index: number, path: string) {
      if (index >= list.length) return
      if (index == list.length - 1) result.push(path.substring(0, path.length - 1))

      for(const i of list[index]) {
        const subPath = path + i + splitor
        travel(index + 1, subPath)
      }
    }
    travel(0, "")
    return result
  }

  export function convertToPinyin(str: string, splitor: string = '-') {
    return flatPinyinResult(toPinyin(str), splitor)
  }

  /**
   *
   * 拼音全拼是否包含
   * @export
   * @param {string} text
   * @param {string} pinyin
   * @return {*} 
   */
  export function fullPinyinContains(text: string, pinyin: string) {
    const pinyinList = convertToPinyin(text)
    for(const i of pinyinList) {
      if (i.replace(/-/gi, '').indexOf(pinyin.toUpperCase()) != -1) return true
    }
    return false
  }

  /**
   *
   * 拼音首字母是否包含
   * @export
   * @param {string} text
   * @param {string} pinyin
   * @return {*}
   */
  export function firstLetterPinyinContains(text: string, pinyin: string) {
    const pinyinList = convertToPinyin(text)
    for(const i of pinyinList) {
      if (i.split("-").map(v => v.charAt(0)).join("").indexOf(pinyin.toUpperCase()) != -1) return true
    }
    return false
  }

  /**
   *
   * 预计算文本的拼音索引 一次转换同时得到全拼与首字母变体
   * 用于高频匹配场景 避免每次匹配都重复做拼音转换
   * @export
   * @param {string} text
   * @return {*}  {PinyinIndex}
   */
  export function buildIndex(text: string): PinyinIndex {
    const pinyinList = convertToPinyin(text)
    return {
      full: pinyinList.map(i => i.replace(/-/gi, '')),
      first: pinyinList.map(i => i.split("-").map(v => v.charAt(0)).join(""))
    }
  }

  /**
   *
   * 基于预计算索引的拼音全拼是否包含 语义与fullPinyinContains一致
   * @export
   * @param {PinyinIndex} index
   * @param {string} pinyin
   * @return {*}  {boolean}
   */
  export function indexFullContains(index: PinyinIndex, pinyin: string): boolean {
    const kw = pinyin.toUpperCase()
    for(const i of index.full) {
      if (i.indexOf(kw) != -1) return true
    }
    return false
  }

  /**
   *
   * 基于预计算索引的拼音首字母是否包含 语义与firstLetterPinyinContains一致
   * @export
   * @param {PinyinIndex} index
   * @param {string} pinyin
   * @return {*}  {boolean}
   */
  export function indexFirstLetterContains(index: PinyinIndex, pinyin: string): boolean {
    const kw = pinyin.toUpperCase()
    for(const i of index.first) {
      if (i.indexOf(kw) != -1) return true
    }
    return false
  }
}
import pinyin from 'tiny-pinyin'

const polyphonicMap = new Map<string, string[]>()
polyphonicMap.set('重', ['ZHONG', 'CHONG'])

export namespace PinyinUtils {
  function toPinyin(str: string): string[][] {
    const result: string[][] = []
    for (let char of str) {
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

      for(let i of list[index]) {
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
    for(let i of pinyinList) {
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
    for(let i of pinyinList) {
      if (i.split("-").map(v => v.charAt(0)).join("").indexOf(pinyin.toUpperCase()) != -1) return true
    }
    return false
  }
}
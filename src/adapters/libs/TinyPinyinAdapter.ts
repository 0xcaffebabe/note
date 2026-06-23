// PinyinPort 的实现: 委托 tiny-pinyin。浏览器与 node 通用。
import type { PinyinPort } from '@/core/ports'
import pinyin from 'tiny-pinyin'

export class TinyPinyinAdapter implements PinyinPort {
  convertToPinyin(char: string): string {
    return pinyin.convertToPinyin(char)
  }
}

export const tinyPinyin = new TinyPinyinAdapter()

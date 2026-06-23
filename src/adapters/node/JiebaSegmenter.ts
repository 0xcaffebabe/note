// WordSegmenterPort 的 node 实现: 包裹 nodejieba。构建期唯一接触 jieba 的位置。
import type { WordSegmenterPort } from '../../core/ports/WordSegmenterPort'
import jieba from 'nodejieba'

export class JiebaSegmenter implements WordSegmenterPort {
  cut(text: string): string[] {
    return jieba.cut(text)
  }
}

export const jiebaSegmenter = new JiebaSegmenter()

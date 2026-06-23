// 分词端口: 把一段文本切成词序列(构建期词云用 jieba 实现)。
export interface WordSegmenterPort {
  cut(text: string): string[]
}

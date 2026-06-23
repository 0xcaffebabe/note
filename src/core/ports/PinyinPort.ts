// 拼音引擎端口: core 的拼音索引/匹配逻辑只需要"单个汉字 → 大写全拼"这一原子能力,
// 多音字展开、首字母、变体拼接等全部是 core 内的纯逻辑。适配器用 tiny-pinyin 实现。

export interface PinyinPort {
  /** 单字符转大写拼音 (非汉字原样返回), 等价 tiny-pinyin 的 convertToPinyin(char) */
  convertToPinyin(char: string): string
}

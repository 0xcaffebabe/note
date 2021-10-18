

/**
 *
 * 清楚文本中的特殊符号 保留可读文本
 * @export
 * @param {string} text
 * @return {*}  {string}
 */
export function cleanText(text: string | undefined | null): string {
  if (!text) {
    return ''
  }
  text = text.replace(/[’!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]/g, '')
  text = text.replace(/\n/g, '')
  text = text.replace(/\t/g, '')
  text = text.replace(/\s/g, '')
  text = text.replace(/[\u0060|\u0021-\u002c|\u002e-\u002f|\u003a-\u003f|\u2200-\u22ff|\uFB00-\uFFFD|\u2E80-\u33FF]/g, '')
  return text
}
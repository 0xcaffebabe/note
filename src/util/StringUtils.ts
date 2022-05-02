

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

export function octal2Chinese(str: string): string {
  const matches = str.match(/(\\\d{3}){3}/g);
  if (matches) matches.forEach(match => {
    let encoded = '';
    const splits = match.split('\\');
    splits.forEach(code => !code || (encoded += '%' + parseInt(code, 8).toString(16)));
    const cChar = decodeURI(encoded);
    str = str.replace(match, cChar);
  });
  return str;
}


/**
 *
 * html文本化
 * @export
 * @param {string} html
 * @return {*}  {string}
 */
export function html2text(html: string): string {
  return html.replace(/<[^>]+>/ig, '')
}

/**
 *
 * 取两个文本之间的文本值
 * @export
 * @param {string} text
 * @param {string} left
 * @param {string} right
 * @return {*} 
 */
export function getMidString(text: string, left:string, right: string) {
  let result = "";
  let zLen = 0;
  if (!left) {
    zLen = 0;
  } else {
    zLen = text.indexOf(left);
    if (zLen > -1) {
      zLen += left.length;
    } else {
      zLen = 0;
    }
  }
  let yLen = text.indexOf(right, zLen);
  if (yLen < 0 || !right) {
    yLen = text.length;
  }
  result = text.substring(zLen, yLen);
  return result;
}

export const stopWords = ['的', '是', '在', '一个', '和',
'与', '批注', '可以', '使用', '通过', 'md', '据库', '这个', '截图', '没有',
'进行', '如果', '需要', '务器', '屏幕', '不会', '就是', '或者', '并且',
'其他', '之后', '那么', '什么', '可能', '为了', '第一', '不是', '大小',
"the", "而且", "但", "一种", "不错", "不仅", "问题", "不", "必要"
]
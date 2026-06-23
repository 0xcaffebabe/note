

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
  // 只保留字母与数字(含 CJK 等所有 Unicode 字母/数字), 其余标点/空白/箭头/符号/emoji 一律剔除。
  // 取代原先密集且有缺陷的字符类(漏放 - @ [ ] _ { } ~ 及弯引号/箭头/补充平面 emoji)。
  return text.replace(/[^\p{L}\p{N}]/gu, '')
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

/** HTML 文本转义(& < >)。用于把任意文本安全放进 HTML 文本节点。 */
export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** HTML 属性转义(& < > ")。用于把任意文本安全放进 HTML 属性值。 */
export function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 正则元字符转义。把用户输入安全用于 new RegExp。 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 幂等 HTML 文本转义(& < > ")。与 escapeHtml 的区别: 用负向先行排除已有实体,
 * 避免对已转义文本二次转义('&lt;'->'&amp;lt;')。构建期把正文片段安全嵌入静态 HTML 时用。
 */
export function escapeHtmlText(text: string): string {
  return text
    // 用负向先行排除已有实体, 避免对已转义文本二次转义('&lt;'->'&amp;lt;'), 保证幂等
    .replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 字符串 → 32 位整数 hash(经典 (h<<5)-h+c)。用于稳定着色/索引。 */
export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash // 转 32bit
  }
  return hash
}

export const stopWords = ['的', '是', '在', '一个', '和',
'与', '批注', '可以', '使用', '通过', 'md', '据库', '这个', '截图', '没有',
'进行', '如果', '需要', '务器', '屏幕', '不会', '就是', '或者', '并且',
'其他', '之后', '那么', '什么', '可能', '为了', '第一', '不是', '大小',
"the", "而且", "但", "一种", "不错", "不仅", "问题", "不", "必要"
]

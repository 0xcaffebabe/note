
/**
 *
 * 将/xx/xx.md 转为x-x形式的文档id
 * @export
 * @param {string} url
 * @return {*}  {string}
 */
function docUrl2Id(url :string): string {
  if (!url) {
    return ""
  }
  url = decodeURI(url).replace(/-/g, '@@')
  return url.split('/').splice(1).join('-').replace('.md', '')
}


/**
 * 将x-x形式的文档id转为/xx/xx.md形式的链接
 *
 * @export
 * @param {string} id
 * @return {*}  {string}
 */
function docId2Url(id: string): string {
  if (!id) {
    return ""
  }
  return id.split('-').join('/').replace(/@@/g, '-') + '.md'
}

export default {
  docId2Url, docUrl2Id
}
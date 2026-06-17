
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
  if (url.startsWith('./doc')) {
    url = url.replace('./doc', '')
  }
  if (url.startsWith('/doc')) {
    url = url.replace('/doc', '')
  }
  url = decodeURI(url).replace(/-/g, '@@')
  const segs = url.split('/')
  // 丢弃首段: 前导 './' 或 '/' 产生的空/点段, 或首段恰为 'doc'(按段精确匹配, 不会误伤 'docker' 等以 doc 开头的段)
  const dropFirst = url.startsWith('./') || url.startsWith('/') || segs[0] === 'doc'
  const id = (dropFirst ? segs.slice(1) : segs).join('-')
  // 先切掉 #锚点 再剥结尾的 .md(锚定结尾 + 大小写不敏感, 与 htmlUrl2Id 对 .html 的处理对齐)
  return id.split('#')[0].replace(/\.md$/i, '')
}


/**
 * 解析文档url 得到文档id与锚点id
 *
 * @param {string} url
 * @return {*}  {{id: string, headingId: string}}
 */
function resloveDocUrl(url: string): {id: string, headingId?: string} {
  if (url.indexOf('#') == -1) {
    return {id: docUrl2Id(url)}
  }
  const headingId = url.split("#")[1];
  const id = docUrl2Id(url.split("#")[0]);
  return { id, headingId }
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
  const arr = id.split('?');
  id = arr[0];
  return id.split('-').join('/').replace(/@@/g, '-') + '.md'
}

/**
 * 将x-x形式的文档id转为/xx/xx.html形式的页面路径
 *
 * @param {string} id
 * @return {*}  {string}
 */
function docId2HtmlPath(id: string): string {
  if (!id) {
    return ""
  }
  return '/' + docId2Url(id).replace(/\.md$/, '.html')
}

/**
 * 将/xx/xx.html形式的页面路径转为x-x形式的文档id
 * 转义规则与docUrl2Id一致: 路径中的'-'转义为'@@' 层级以'-'连接
 *
 * @param {string} url
 * @return {*}  {string}
 */
function htmlUrl2Id(url: string): string {
  if (!url) {
    return ""
  }
  try {
    url = decodeURI(url)
  } catch {
    // 已解码的路径中含有'%'时decodeURI会抛错 按原样处理
  }
  url = url.split('#')[0].split('?')[0]
  if (url.startsWith('/')) {
    url = url.substring(1)
  }
  return url.replace(/\.html$/i, '').replace(/-/g, '@@').split('/').join('-')
}

/**
 * 从路由中解析文档id 兼容旧/doc/:doc参数与新:docPath(.html路径)参数
 *
 * @param {{params: Record<string, any>}} route
 * @return {*}  {string}
 */
function routeDocId(route: { params: Record<string, any> }): string {
  if (route.params.doc) {
    return route.params.doc.toString()
  }
  if (route.params.docPath) {
    return htmlUrl2Id(route.params.docPath.toString())
  }
  return ""
}

export default {
  docId2Url, docUrl2Id, resloveDocUrl, docId2HtmlPath, htmlUrl2Id, routeDocId
}
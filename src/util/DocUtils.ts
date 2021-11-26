import queryString from 'query-string'

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
  if (url.startsWith('./') || url.startsWith('/') || url.startsWith('doc')) {
    return url.split('/').splice(1).join('-').replace('.md', '').split('#')[0]
  }else {
    return url.split('/').join('-').replace('.md', '').split('#')[0]
  }
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

function docId2UrlWithHeading(id: string): string {
  if (!id) {
    return ""
  }
  const arr = id.split('?');
  id = arr[0];
  const url = id.split('-').join('/').replace(/@@/g, '-') + '.md';
  if (arr.length == 1) {
    return url;
  }else {
    const headingId = queryString.parse(arr[1]).headingId;
    if (headingId && headingId !== 'undefined') {
      return url + '#' + queryString.parse(arr[1]).headingId;
    }else {
      return url;
    }
  }
}

export default {
  docId2Url, docUrl2Id, resloveDocUrl, docId2UrlWithHeading
}
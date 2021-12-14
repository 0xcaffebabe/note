
function concatUrl (...urls: string[]): string {
  if (urls.length <= 1) {
    return urls.join('')
  }
  let url = urls[0];
  for(let index = 1;index<urls.length;index++) {
    const i = urls[index];
    if (url.endsWith('/') && i.startsWith('/')) {
      url += i.substring(1)
    }else if (!url.endsWith('/') && !i.startsWith('/')) {
      url += '/' + i;
    }else {
      url += i;
    }
  }
  return url;
}

export default {
  concatUrl
}
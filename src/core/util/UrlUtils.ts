
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

/**
 *
 * 修复Latin-1双重编码的乱码文本(如'è½¯ä»¶'还原为'软件')
 * 场景: CDN对.html路径做308重定向时 Location头直接放原始UTF-8字节(违反RFC-3986)
 * 浏览器按Latin-1把每个字节误读成一个字符 重新编码后地址栏就成了乱码路径
 * @param {string} text 已解码的文本
 * @return {*}  {(string | null)} 修复后的文本 无乱码特征时返回null
 */
function repairLatin1Mojibake(text: string): string | null {
  // 乱码特征: 含0x80~0xFF高位码点且全部码点≤0xFF(真实中文路径码点远超0xFF)
  if (!/[\u0080-\u00ff]/.test(text) || !/^[\u0000-\u00ff]*$/.test(text)) {
    return null
  }
  try {
    const bytes = Uint8Array.from(text, c => c.charCodeAt(0))
    // 按码点还原字节流后以UTF-8严格解码 真正的Latin-1文本(如café)不是合法UTF-8会抛错
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

export default {
  concatUrl, repairLatin1Mojibake
}

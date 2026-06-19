
import type { RouteLocationNormalized } from 'vue-router'
import DocUtils from '@/util/DocUtils'
import UrlUtils from '@/util/UrlUtils'

// 自愈逻辑依赖的"文档是否存在"校验: 由 route/index.ts 注入(走 CategoryService 目录),
// 抽出为参数后本模块不再 import 重型的 CategoryService/页面 仍可纯逻辑单测
export type DocIdExists = (id: string) => Promise<boolean>

/**
 * 兜底路由自愈: CDN(Cloudflare Pages)对/xxx.html强制308重定向去掉后缀 且Location头
 * 未按RFC-3986编码中文路径(原始UTF-8字节被浏览器按Latin-1误读) 刷新/直接访问文档页
 * 会落到 /%C3%A8%C2%BD%C2%AF... 这样的乱码无后缀路径
 * 进入404前先尝试: 修复Latin-1双重编码 + 为真实存在的文档补回.html 修复不了才展示404
 *
 * 返回 true 表示放行到 404; 返回重定向对象表示已自愈到规范文档地址
 */
export async function recoverDocPath(to: RouteLocationNormalized, docIdExists: DocIdExists) {
  let path: string
  try {
    path = decodeURIComponent(to.path)
  } catch {
    // 含原始'%'的非法路径无从判定 直接进404
    return true
  }
  const repaired = UrlUtils.repairLatin1Mojibake(path)
  path = repaired || path
  let docPath = path
  if (!/\.html$/i.test(docPath)) {
    docPath = docPath.replace(/\/+$/, '') + '.html'
  }
  try {
    if (!await docIdExists(DocUtils.htmlUrl2Id(docPath))) {
      return true
    }
  } catch {
    // 目录加载失败(离线/网络异常)时无从校验 仅在确认乱码特征时仍然跳转
    if (!repaired) {
      return true
    }
  }
  // 乱码重定向同样会污染query值(如headingId) 一并修复
  const fixValue = (v: any) => typeof v == 'string' ? (UrlUtils.repairLatin1Mojibake(v) || v) : v
  const query = Object.fromEntries(Object.entries(to.query)
    .map(([k, v]) => [k, Array.isArray(v) ? v.map(fixValue) : fixValue(v)]))
  return { path: docPath, query, hash: to.hash, replace: true }
}

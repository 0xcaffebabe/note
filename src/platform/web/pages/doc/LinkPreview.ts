import DocUtils from '@/core/util/DocUtils'
import EventBus from '@/platform/web/components/EventBus'

export interface LinkPreviewRequest {
  docId: string
  docLink: string
  x: number
  y: number
}

// 目录的 .md 与正文/相关链接的 .html 共用同一个文档身份及持久化记录。
export function showLinkPreview(docLink: string, x: number, y: number): void {
  try {
    // 目录数据中的 ./xxx.md 是站点根路径，不随当前文档所在目录变化。
    const url = new URL(docLink, window.location.origin + '/')
    if (url.origin !== window.location.origin || !/\.(md|html)$/i.test(url.pathname)) return
    const docId = /\.html$/i.test(url.pathname)
      ? DocUtils.htmlUrl2Id(url.pathname)
      : DocUtils.docUrl2Id(url.pathname)
    if (!docId) return
    EventBus.emit('show-link-preview', {
      docId,
      docLink: '/' + DocUtils.docId2Url(docId),
      x,
      y,
    } satisfies LinkPreviewRequest)
  } catch {
    // 损坏的链接不影响其余文档的预览。
  }
}

// 窗口适配器: 封装 window.open 与全屏 API。
export function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener')
}

export function isFullScreen(): boolean {
  return !!document.fullscreenElement
}

export function requestFullScreen(): Promise<void> {
  return document.body.requestFullscreen()
}

export function exitFullScreen(): Promise<void> {
  return document.exitFullscreen()
}

// 窗口适配器: 封装 window.open 与全屏 API。
export function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener')
}

export function isFullScreen(): boolean {
  return !!document.fullscreenElement
}

export function requestFullScreen(): void {
  document.body.requestFullscreen()
}

export function exitFullScreen(): void {
  document.exitFullscreen()
}

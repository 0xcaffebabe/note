// 平台探测适配器: 读 navigator 判断是否 macOS(决定快捷键修饰键显示 ⌘ / Ctrl)。
export function isMac(): boolean {
  return /mac/i.test(navigator.platform || navigator.userAgent)
}

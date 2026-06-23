// 剪贴板适配器: 封装 navigator.clipboard, 把浏览器 API 收敛到一处便于替换/测试。
export function writeText(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

/** 颜色解析/空间转换。纯函数, 无浏览器依赖(getComputedStyle 等读取留在调用方)。 */

/** 解析 rgb()/rgba()/#rgb/#rrggbb 为 [r,g,b]; 解析不出返回 null。对应 WordCloud.parseColorToRgb。 */
export function parseColorToRgb(s: string): [number, number, number] | null {
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (m) return [+m[1], +m[2], +m[3]]
  const hex = s.replace('#', '')
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)]
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
  }
  return null
}

/** [r,g,b](0~255) → 色相 H(0~360); 灰度无色相返回 fallback。对应 WordCloud.getPrimaryHue 的 RGB→H 部分。 */
export function rgbToHue([r0, g0, b0]: [number, number, number], fallback = 210): number {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return fallback
  let h = 0
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = Math.round(h * 60)
  return h < 0 ? h + 360 : h
}

/** HSL → 'rgb(r,g,b)' 字符串(3D 渲染靠 rgb→rgba 文本替换加透明度)。对应 WordCloud.hslToRgbString。 */
export function hslToRgbString(h: number, s: number, l: number): string {
  const sN = s / 100
  const lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lN - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const to255 = (v: number) => Math.round((v + m) * 255)
  return `rgb(${to255(r)},${to255(g)},${to255(b)})`
}

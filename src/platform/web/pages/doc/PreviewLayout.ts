export interface PreviewLayout {
  left: number
  top: number
  width: number
  height: number
}

export const PREVIEW_LAYOUT_KEY = 'doc-preview:layout'

// 持久化数据不可信；无效记录回退到默认位置/尺寸，旧视口的有效记录由界面夹紧。
export function readPreviewLayout(value: string | null): PreviewLayout | null {
  try {
    const layout = JSON.parse(value ?? 'null')
    if (!layout || ![layout.left, layout.top, layout.width, layout.height]
      .every(v => typeof v === 'number' && Number.isFinite(v))) return null
    if (layout.width <= 0 || layout.height <= 0) return null
    return { left: layout.left, top: layout.top, width: layout.width, height: layout.height }
  } catch {
    return null
  }
}

export interface Point {
  x: number
  y: number
}

export interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface SavedPosition {
  version: 1
  x: number
  y: number
}

export interface ShortcutLayout {
  side: 'left' | 'right' | 'above' | 'below'
  offsetX: number
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, Math.max(min, max)))

export function parsePosition(raw: string | null): SavedPosition | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const { version, x, y } = value as Partial<SavedPosition>
    if (version !== 1 || typeof x !== 'number' || typeof y !== 'number') return null
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return null
    return { version: 1, x, y }
  } catch {
    return null
  }
}

export function clampPoint(point: Point, bounds: Bounds, size: number): Point {
  return {
    x: clamp(point.x, bounds.left, bounds.right - size),
    y: clamp(point.y, bounds.top, bounds.bottom - size),
  }
}

export function restorePosition(saved: SavedPosition, bounds: Bounds, size: number): Point {
  return clampPoint({
    x: bounds.left + saved.x * Math.max(0, bounds.right - bounds.left - size),
    y: bounds.top + saved.y * Math.max(0, bounds.bottom - bounds.top - size),
  }, bounds, size)
}

export function savePosition(point: Point, bounds: Bounds, size: number): SavedPosition {
  const position = clampPoint(point, bounds, size)
  const width = Math.max(0, bounds.right - bounds.left - size)
  const height = Math.max(0, bounds.bottom - bounds.top - size)
  return {
    version: 1,
    x: width ? (position.x - bounds.left) / width : 0,
    y: height ? (position.y - bounds.top) / height : 0,
  }
}

export function shortcutLayout(
  anchor: Point,
  bounds: Bounds,
  size: number,
  stripWidth: number,
  stripHeight: number,
  gap = 4,
): ShortcutLayout {
  if (anchor.x - stripWidth - gap >= bounds.left) {
    return { side: 'left', offsetX: -stripWidth - gap }
  }
  if (anchor.x + size + stripWidth + gap <= bounds.right) {
    return { side: 'right', offsetX: size + gap }
  }

  // 独立悬浮条包含两侧各 4px 内边距和 1px 边框；不移动下方的拖拽按钮。
  const wholeWidth = stripWidth + 10
  const wholeHeight = stripHeight + 10
  const above = anchor.y - bounds.top - gap
  const below = bounds.bottom - anchor.y - size - gap
  const side = above >= wholeHeight ? 'above'
    : below >= wholeHeight ? 'below'
    : above >= below ? 'above' : 'below'
  return {
    side,
    offsetX: clamp(anchor.x, bounds.left, bounds.right - wholeWidth) - anchor.x,
  }
}

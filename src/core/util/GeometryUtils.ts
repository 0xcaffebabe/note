/** 几何工具。纯函数。 */

/** 把数值夹紧到 [min, max]。 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

/**
 * 把一个尺寸为 size 的元素的位置 pos 夹紧到 [margin, viewport - size - margin],
 * 使其完整留在视口内。对应 LinkPopover.clampToViewport。
 */
export function clampToBounds(pos: number, size: number, viewport: number, margin = 8): number {
  return Math.max(margin, Math.min(pos, viewport - size - margin))
}

/**
 * 3D 几何(纯数学): Fibonacci 球面均匀分布 + 旋转/透视投影。
 * 从 WordCloud 的 init3DLayout/project3D 抽出, 与 canvas/组件状态解耦, 可独立单测、跨平台复用。
 */

export interface Point3D { x: number; y: number; z: number }
export interface Projected { x: number; y: number; scale: number }

/** Fibonacci 球面上第 index 个点(共 total 个, 半径 radius)。对应 WordCloud.init3DLayout。 */
export function fibonacciSpherePoint(index: number, total: number, radius: number): Point3D {
  const phi = Math.acos(-1 + (2 * index) / total)
  const theta = Math.sqrt(total * Math.PI) * phi
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi),
  }
}

/**
 * 先绕 Y 轴、再绕 X 轴旋转, 然后透视投影到屏幕坐标;
 * projX 额外做各向异性拉伸(stretchX), 不影响 scale/深度。对应 WordCloud.project3D。
 */
export function projectPoint(
  base: Point3D,
  angleX: number,
  angleY: number,
  centerX: number,
  centerY: number,
  focalLength: number,
  stretchX: number,
): Projected {
  const cosY = Math.cos(angleY)
  const sinY = Math.sin(angleY)
  const cosX = Math.cos(angleX)
  const sinX = Math.sin(angleX)

  const rotX = base.x * cosY - base.z * sinY
  const rotZ = base.x * sinY + base.z * cosY
  const rotY = base.y

  const finalY = rotY * cosX - rotZ * sinX
  const finalZ = rotY * sinX + rotZ * cosX

  const scale = focalLength / (focalLength + finalZ)
  return {
    x: centerX + rotX * scale * stretchX,
    y: centerY + finalY * scale,
    scale,
  }
}

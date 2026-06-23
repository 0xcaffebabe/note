import { l2normalize, dot } from './clusterMath'

// 经典多维标度(MDS, 自写、零外部依赖): 距离平方矩阵 -> k 维坐标。
// 纯线性代数(幂迭代求特征向量 + 双中心化), 确定性可复现, 任何平台生成散点布局时复用。
// 配套的线性缩放函数把坐标归一到固定范围 / 簇内半径。

// MDS 坐标缩放到 [-COORD_RANGE, COORD_RANGE]
export const COORD_RANGE = 100

export function matVec(M: number[][], v: number[], n: number): number[] {
  const r = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = 0
    const Mi = M[i]
    for (let j = 0; j < n; j++) s += Mi[j] * v[j]
    r[i] = s
  }
  return r
}

// 幂迭代求对称矩阵最大特征值/特征向量
export function powerIteration(B: number[][], n: number): { value: number; vector: number[] } {
  // 确定性初始向量(不用 Math.random, 保证构建可复现)
  let v = l2normalize(Array.from({ length: n }, (_, i) => Math.sin(i + 1)))
  let value = 0
  for (let it = 0; it < 300; it++) {
    const w = matVec(B, v, n)
    let norm = 0
    for (const x of w) norm += x * x
    norm = Math.sqrt(norm)
    if (norm < 1e-12) break
    const nv = w.map(x => x / norm)
    value = dot(nv, matVec(B, nv, n)) // Rayleigh 商
    let diff = 0
    for (let i = 0; i < n; i++) diff += Math.abs(nv[i] - v[i])
    v = nv
    if (diff < 1e-9) break
  }
  return { value, vector: v }
}

// 经典 MDS: 距离平方矩阵 -> k 维坐标(返回 [k][n], 每维一个坐标数组)
export function mdsND(D2: number[][], n: number, k: number): number[][] {
  if (n === 0) return Array.from({ length: k }, () => [])
  if (n === 1) return Array.from({ length: k }, () => [0])
  // 双中心化 B = -1/2 J D2 J
  const rowMean = new Array(n).fill(0)
  let grand = 0
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let j = 0; j < n; j++) s += D2[i][j]
    rowMean[i] = s / n
    grand += s
  }
  grand /= n * n
  const B: number[][] = []
  for (let i = 0; i < n; i++) {
    B[i] = new Array(n)
    for (let j = 0; j < n; j++) {
      B[i][j] = -0.5 * (D2[i][j] - rowMean[i] - rowMean[j] + grand)
    }
  }
  // 依次取前 k 大特征向量(幂迭代 + 紧缩); 秩不足时多出的维坐标自然趋零
  const coords: number[][] = []
  for (let d = 0; d < k; d++) {
    const e = powerIteration(B, n)
    const s = Math.sqrt(Math.max(e.value, 0))
    coords.push(e.vector.map(v => v * s))
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) B[i][j] -= e.value * e.vector[i] * e.vector[j]
    }
  }
  return coords
}

// 把坐标线性缩放到 [-COORD_RANGE, COORD_RANGE]
export function scaleCoords(a: number[]): number[] {
  let mn = Infinity
  let mx = -Infinity
  for (const v of a) {
    if (v < mn) mn = v
    if (v > mx) mx = v
  }
  const range = mx - mn || 1
  return a.map(v => ((v - mn) / range) * 2 * COORD_RANGE - COORD_RANGE)
}

// 把一组 k 维坐标([k][m])居中并缩放到最大半径 R(用于簇内局部散布)
export function scaleRadiusND(coords: number[][], R: number): number[][] {
  const dims = coords.length
  const m = coords[0]?.length || 0
  if (m === 0) return coords
  const center = coords.map(arr => arr.reduce((s, v) => s + v, 0) / m)
  let maxr = 0
  for (let i = 0; i < m; i++) {
    let r = 0
    for (let d = 0; d < dims; d++) {
      const dv = coords[d][i] - center[d]
      r += dv * dv
    }
    r = Math.sqrt(r)
    if (r > maxr) maxr = r
  }
  const s = maxr > 0 ? R / maxr : 0
  return coords.map((arr, d) => arr.map(v => (v - center[d]) * s))
}

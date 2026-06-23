// 纯数学/确定性工具集 (从 generateDocCluster.ts 抽出, 便于单测)
// 本模块刻意不 import BaseService / DocService / nodejieba / fs, 不读任何文件,
// 因此被导入时不会触发文档生成等重型副作用 (generateDocCluster.ts 在模块加载期
// 会执行读取停用词表的 IIFE; 把这些纯函数移出后, 单测只需引用本文件即可)。

// 确定性 PRNG(线性同余), 用于 K-means++ 初始化
export function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function l2normalize(vec: number[]): number[] {
  let sq = 0
  for (const v of vec) sq += v * v
  const norm = Math.sqrt(sq) || 1
  return vec.map(v => v / norm)
}

export function dot(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

export function sqDist(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    s += d * d
  }
  return s
}

// 余弦相似度
export function sim(vec1: number[], vec2: number[]): number {
  if (vec1.length != vec2.length) {
    throw Error('长度不同')
  }
  let xPowSum = 0
  let yPowSum = 0
  let xmySum = 0
  for (let i = 0; i < vec1.length; i++) {
    xPowSum += Math.pow(vec1[i], 2)
    yPowSum += Math.pow(vec2[i], 2)
    xmySum += vec1[i] * vec2[i]
  }
  const denom = Math.sqrt(xPowSum * yPowSum)
  // 零向量(空文档/全停用词)防止除零产生 NaN 污染整簇相似度
  if (!denom) {
    return 0
  }
  return xmySum / denom
}

// K-means(球面/余弦, 在 L2 归一化向量上跑欧氏), k-means++ 确定性初始化
export function kmeans(X: number[][], K: number, seed: number): number[] {
  const n = X.length
  if (n === 0) return []
  const dim = X[0].length
  const rnd = lcg(seed)
  // k-means++ 初始化
  const centroids: number[][] = [X[Math.floor(rnd() * n)].slice()]
  const d2 = new Array(n).fill(Infinity)
  for (let c = 1; c < K; c++) {
    let sum = 0
    for (let i = 0; i < n; i++) {
      const dd = sqDist(X[i], centroids[c - 1])
      if (dd < d2[i]) d2[i] = dd
      sum += d2[i]
    }
    let r = rnd() * sum
    let idx = 0
    for (let i = 0; i < n; i++) {
      r -= d2[i]
      if (r <= 0) { idx = i; break }
      idx = i
    }
    centroids.push(X[idx].slice())
  }
  // Lloyd 迭代
  const assign = new Array(n).fill(0)
  for (let it = 0; it < 50; it++) {
    let changed = false
    for (let i = 0; i < n; i++) {
      let best = 0
      let bd = Infinity
      for (let c = 0; c < centroids.length; c++) {
        const dd = sqDist(X[i], centroids[c])
        if (dd < bd) { bd = dd; best = c }
      }
      if (assign[i] !== best) { assign[i] = best; changed = true }
    }
    const sums = Array.from({ length: centroids.length }, () => new Array(dim).fill(0))
    const cnt = new Array(centroids.length).fill(0)
    for (let i = 0; i < n; i++) {
      const c = assign[i]
      cnt[c]++
      const xi = X[i]
      const sc = sums[c]
      for (let d = 0; d < dim; d++) sc[d] += xi[d]
    }
    for (let c = 0; c < centroids.length; c++) {
      if (cnt[c] === 0) continue // 空簇保留旧质心
      const sc = sums[c]
      for (let d = 0; d < dim; d++) sc[d] /= cnt[c]
      centroids[c] = sc
    }
    if (!changed) break
  }
  return assign
}

// 停用词判定: 词长 <=1 或在给定停用词集合中 (集合由调用方提供, 保持纯函数)
export function isStopWord(word: string, stopWordSet: Set<string>): boolean {
  if (word.length <= 1) {
    return true
  }
  return stopWordSet.has(word)
}

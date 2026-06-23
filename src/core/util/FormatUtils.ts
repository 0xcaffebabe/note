/**
 * 数值/单位格式化工具。纯逻辑, 无框架/浏览器依赖。
 */

/** 千分位格式化(en-US)。对应 Statistic.fmt。 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/** 字节 → 可读体积: <1024MB 显示 MB(向上取整), 否则 GB(保留 1 位)。对应 Statistic.repositorySizeReadable。 */
export function byteSizeReadable(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.ceil(mb)} MB`
}

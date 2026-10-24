/** 桥接边界只接受普通对象，数组和空值均不能作为记录。 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** 统一拒绝无效投影，避免向界面传递未经校验的字段。 */
export function invalidProjection(): never {
  throw new Error('Note Bridge 返回了无效的聊天数据，请检查桌面端版本')
}

export function readString(value: unknown, max: number, nonempty = false): string {
  if (typeof value !== 'string' || value.length > max || (nonempty && !value.length)) {
    invalidProjection()
  }
  return value
}

export function readId(value: unknown): string {
  const result = readString(value, 128, true)
  if (!/^[a-zA-Z0-9_.:-]+$/.test(result)) {
    invalidProjection()
  }
  return result
}

export function readNonnegativeInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    invalidProjection()
  }
  return value as number
}

export function readOptionalString(value: unknown, max: number): string | undefined {
  return value === undefined ? undefined : readString(value, max)
}

export function readArray(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) {
    invalidProjection()
  }
  return value
}

export function requireUnique<T>(items: T[], key: (item: T) => string): T[] {
  if (new Set(items.map(key)).size !== items.length) {
    invalidProjection()
  }
  return items
}

/** 引用只允许站内 HTML 文档，拒绝外站、脚本和含控制字符的地址。 */
export function readSiteUrl(value: unknown): string {
  const url = readString(value, 8192, true)
  if (
    !url.startsWith('/')
    || url.startsWith('//')
    || /[\u0000-\u0020\u007f\\]/.test(url)
    || !/^[^?#]*\.html(?:[?#]|$)/.test(url)
  ) {
    invalidProjection()
  }
  return url
}

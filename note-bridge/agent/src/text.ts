/** 判断 UTF-16 偏移是否切开同一个 Unicode 字符的代理对。 */
export function splitSurrogate(value: string, offset: number): boolean {
  return (
    offset > 0 &&
    /[\uDC00-\uDFFF]/.test(value[offset] || '') &&
    /[\uD800-\uDBFF]/.test(value[offset - 1])
  );
}

/** 修复模型或旧数据中的孤立代理项；Unicode 模式保留所有完整代理对。 */
export function wellFormedText(value: string): string {
  return value.replace(/[\uD800-\uDFFF]/gu, '\uFFFD');
}

/** 按 UTF-16 预算取完整字符前缀，保证结果能通过 Rust 的严格 JSON 解码。 */
export function textPrefix(value: string, size: number): string {
  const end = Math.min(value.length, Math.max(0, Math.floor(size)));
  return wellFormedText(
    value.slice(0, splitSurrogate(value, end) ? end - 1 : end),
  );
}

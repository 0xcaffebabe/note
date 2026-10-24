import type { KnowledgeToolArgs } from './contracts.js';
import { textPrefix as prefix } from '../text.js';

export { splitSurrogate, textPrefix as prefix } from '../text.js';

/** 读取已通过参数验证的整数，缺省时使用工具默认值。 */
export function number(
  args: KnowledgeToolArgs,
  key: string,
  fallback: number,
): number {
  return args[key] === undefined ? fallback : Number(args[key]);
}

/** 以实际序列化 UTF-8 字节数衡量工具结果大小。 */
export function bytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value));
}

/** 根据实际返回数量计算续读位置，避免裁剪后跳过结果。 */
export function pagination(offset: number, count: number, total: number) {
  return {
    offset,
    nextOffset: offset + count < total ? offset + count : null,
    truncated: offset + count < total,
  };
}

/** 过滤影响 UI 阅读的控制字符并限制展示长度。 */
export function display(value: string, size: number): string {
  return prefix(
    value.replace(
      /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,
      ' ',
    ),
    size,
  );
}

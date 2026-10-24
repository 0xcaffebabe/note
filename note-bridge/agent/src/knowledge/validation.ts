import { KnowledgeError, invalid } from './KnowledgeError.js';

/** 拒绝数组、非 JSON 对象及带自定义原型的对象。 */
export function record(value: unknown): Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    invalid('知识数据必须为 JSON 对象');
  }
  return value as Record<string, unknown>;
}

/** 校验列表形状与条目上限，不隐式截断非法输入。 */
export function array(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) {
    invalid('知识数据列表无效或过大');
  }
  return value;
}

/** 校验文本类型、长度及是否允许为空。 */
export function string(value: unknown, max: number, empty = false): string {
  if (
    typeof value !== 'string' ||
    (!empty && !value.length) ||
    value.length > max
  ) {
    invalid('知识数据文本无效或过长');
  }
  return value;
}

/** 只接收支持的发布协议版本。 */
export function version(value: Record<string, unknown>): void {
  if (value.schemaVersion !== 1) {
    throw new KnowledgeError(
      'unsupported_knowledge_version',
      '知识数据版本不受支持，请更新 Note Bridge',
    );
  }
}

/** 检查目录 ID 的规范形式，拒绝路径、URL 与空目录片段。 */
export function validDocId(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 512 &&
    !/[\u0000-\u001f\u007f\\/:?#%]/.test(value) &&
    !value
      .split('-')
      .map((part) => part.replace(/@@/g, '-'))
      .some((part) => !part || part === '.' || part === '..')
  );
}

/** 只接受由目录 ID 唯一推导的站点 HTML 路径。 */
export function validateSiteUrl(value: string, docId: string): void {
  const expected =
    '/' +
    docId
      .split('-')
      .map((part) => encodeURIComponent(part.replace(/@@/g, '-')))
      .join('/') +
    '.html';
  if (value !== expected) {
    invalid('知识文档必须使用目录内规范 HTML 路径');
  }
}

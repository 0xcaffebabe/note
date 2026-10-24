/** 带稳定错误码的知识读取错误，供运行时区分失效版本与不可用数据源。 */
export class KnowledgeError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'KnowledgeError';
  }
}

/** 将不符合发布契约的数据统一归类，避免未经验证的数据进入工具结果。 */
export function invalid(message: string): never {
  throw new KnowledgeError('invalid_knowledge_data', message);
}

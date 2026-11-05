/** 可安全返回客户端的业务错误。code 是稳定协议字段，message 不得包含凭据。 */
export class AgentError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

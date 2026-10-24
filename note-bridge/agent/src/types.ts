/** v2 公共类型入口；实现按领域拆分，不在此声明运行逻辑。 */
export type { Effort, ModelOption, RuntimeProvider } from './domain/Model.js';
export type { Authorization } from './domain/Authorization.js';
export type {
  Citation,
  Overview,
  ToolCallRecord,
  SessionSummary,
  ChatTurn,
} from './domain/Conversation.js';
export type { RpcContext, Push } from './protocol/RpcContext.js';
export { AgentError } from './domain/AgentError.js';
export { LIMITS } from './config/limits.js';

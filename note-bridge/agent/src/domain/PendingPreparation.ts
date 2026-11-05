import type { RpcContext } from '../protocol/RpcContext.js';

/** 未持久化请求的生命周期记录；configuration 仅用于内存内比较，不可写入日志。 */
export type PendingPreparation = {
  context: RpcContext;
  sessionId?: string;
  providerId?: string;
  configuration?: string;
  controller: AbortController;
};

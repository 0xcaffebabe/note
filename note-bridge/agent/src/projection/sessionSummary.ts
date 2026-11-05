import type { SessionMeta } from '../domain/AgentState.js';
import type { SessionSummary } from '../domain/Conversation.js';

/** 将内部会话索引投影为稳定的 v2 摘要，不包含 Origin、幂等映射或内部运行状态。 */
export function sessionSummary(
  meta: Readonly<SessionMeta>,
  revision: number,
): SessionSummary {
  return {
    id: meta.id,
    title: meta.title,
    providerId: meta.providerId,
    model: meta.model,
    effort: meta.effort,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    status: meta.status,
    revision,
  };
}

import type { JsonObject } from '@earendil-works/pi-durable';
import type { Citation, Effort } from '../types.js';

/** 持久化会话索引；请求幂等映射与活动回合必须和 RunDoc 在同一事务更新。 */
export type SessionMeta = {
  id: string;
  origin: string;
  title: string;
  providerId: string;
  model: string;
  effort: Effort;
  createdAt: number;
  updatedAt: number;
  status: 'idle' | 'running' | 'error';
  archived: boolean;
  turns: string[];
  activeTurn: string;
  requests: Record<
    string,
    {
      hash: string;
      turnId: string;
    }
  >;
};

/** Pi session 级目录，所有站点共享存储但读写必须验证各自 Origin。 */
export type IndexState = {
  sessions: Record<string, SessionMeta>;
  epoch: number;
};

/** 持久化单轮检查点；准入数据、绝对时限、请求/工具预算在重启后继续生效。 */
export type RunState = {
  turnId: string;
  hash: string;
  requestId: string;
  authorizationId: string;
  origin: string;
  providerId: string;
  model: string;
  effort: Effort;
  createdAt: number;
  deadline: number;
  status: 'admitting' | 'running' | 'complete' | 'cancelled' | 'error';
  requests: number;
  tools: number;
  finalStarted: boolean;
  compactions: number;
  manifest: JsonObject;
  submissionId: number;
  entryId: number;
  endEntryId: number;
  pendingText: string;
  pendingQuestion: string;
  pendingEvidence: string;
  error: string;
  contextNotice: string;
  citations: Citation[];
};

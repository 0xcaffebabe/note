import { defineDoc, defineDocFamily } from '@earendil-works/pi-durable';
import type { IndexState, RunState } from '../domain/AgentState.js';
import type { Citation } from '../domain/Conversation.js';

/** Pi 的磁盘文档契约。kind/version/初始字段保持稳定，重构不得隐式迁移历史状态。 */
export const IndexDoc = defineDoc<IndexState>({
  kind: 'note.sessions',
  version: 1,
  scope: 'session',
  initial: () => ({ sessions: {}, epoch: 0 }),
  checkpointWhen: () => true,
});

/** 每回合独立的最新检查点；准入、取消和预算必须先提交再触发外部操作。 */
export const RunDoc = defineDocFamily<RunState, null>({
  kind: 'note.run',
  version: 1,
  family: true,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({
    turnId: '',
    hash: '',
    requestId: '',
    authorizationId: '',
    origin: '',
    providerId: '',
    model: '',
    effort: 'default',
    createdAt: 0,
    deadline: 0,
    status: 'admitting',
    requests: 0,
    tools: 0,
    finalStarted: false,
    compactions: 0,
    manifest: {},
    submissionId: 0,
    entryId: 0,
    endEntryId: 0,
    pendingText: '',
    pendingQuestion: '',
    pendingEvidence: '',
    error: '',
    contextNotice: '',
    citations: [],
  }),
  checkpointWhen: () => true,
});

/** 跨回合可复用的引用证据；已结束回合仍使用其 RunDoc 中冻结的引用副本。 */
export const EvidenceDoc = defineDoc<{
  sources: Record<string, Citation>;
}>({
  kind: 'note.evidence',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({ sources: {} }),
  checkpointWhen: () => true,
});

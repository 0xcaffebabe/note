import { createHash, randomUUID } from 'node:crypto';
import { textPrefix } from '../text.js';
import { BACKGROUND_CONTEXT as CTX } from '@earendil-works/chord/context';
import { AgentError } from '../domain/AgentError.js';
import type { TurnSubmission } from '../domain/TurnSubmission.js';
import type { IndexState } from '../domain/AgentState.js';
import type { KnowledgeSnapshot } from '../knowledge.js';
import type { RpcContext } from '../protocol/RpcContext.js';
import type { AgentLimits } from '../config/limits.js';
import {
  requireString,
  parseEffort,
  parseAttachments,
} from '../protocol/validation.js';
import type { AgentStore } from '../persistence/AgentStore.js';
import { IndexDoc, RunDoc } from '../persistence/documents.js';
import type { RuntimeConfiguration } from './RuntimeConfiguration.js';
import type { PreparationManager } from './PreparationManager.js';
import type { RunPolicy } from './RunPolicy.js';
import type { RunLifecycle } from './RunLifecycle.js';
import type { SessionEvents } from './SessionEvents.js';
import type { KnowledgeSnapshots } from './KnowledgeSnapshots.js';

/**
 * 将客户端问题和站点附件准入为可恢复回合。请求散列提供幂等性；网络读取后再次验证授权。
 * 调用方须持有会话锁；索引和 RunDoc 的准入记录始终在同一事务提交。
 */
export class TurnSubmissionService {
  constructor(
    private readonly store: AgentStore,
    private readonly configuration: RuntimeConfiguration,
    private readonly preparations: PreparationManager,
    private readonly policy: RunPolicy,
    private readonly lifecycle: RunLifecycle,
    private readonly events: SessionEvents,
    private readonly snapshots: KnowledgeSnapshots,
    private readonly limits: AgentLimits,
    private readonly now: () => number,
  ) {}

  /** 调用方持有会话锁；在任何网络读取之前处理重复请求，并在事务中再次检查全局容量。 */
  async send(context: RpcContext, params: Record<string, unknown>) {
    const meta = await this.store.owned(context.origin, params.sessionId);
    const request = this.normalize(params);
    const previous = meta.requests[request.requestId];
    if (previous) {
      if (previous.hash !== request.hash) {
        throw new AgentError('idempotency_conflict', '相同请求 ID 的内容不同');
      }
      return { runId: previous.turnId, turnId: previous.turnId };
    }
    if (meta.activeTurn) {
      throw new AgentError('busy', '此对话正在生成回答');
    }
    this.configuration.checkModel(request);
    this.checkCapacity(await this.store.index());
    const startedAt = this.now();
    const preparation = this.preparations.begin(
      context,
      meta.id,
      request.providerId,
      this.limits.deadlineMs,
    );
    try {
      const snapshot = await this.snapshots.pin(
        context.origin,
        preparation.signal,
      );
      const evidence = await this.loadAttachments(
        snapshot,
        request,
        preparation.signal,
      );
      // 网络返回后必须重新验证授权，避免撤权期间读完的附件准入新任务。
      this.configuration.authorize(context);
      preparation.signal.throwIfAborted();
      this.configuration.checkModel(request);
      const turnId = await this.commitTurn(
        context,
        meta.id,
        request,
        snapshot,
        evidence,
        startedAt,
      );
      this.snapshots.remember(turnId, snapshot);
      const run = await this.store.run(meta.id, turnId);
      this.policy.controller(run);
      await this.lifecycle.admit(meta.id, run, request.text, evidence.items);
      this.events.changed(context.origin);
      return { runId: turnId, turnId };
    } finally {
      preparation.dispose();
    }
  }

  private normalize(params: Record<string, unknown>): TurnSubmission {
    const requestId = requireString(params.clientRequestId, 'clientRequestId');
    if (requestId.length > 128) {
      throw new AgentError('invalid_request', '请求 ID 过长');
    }
    const text = typeof params.text === 'string' ? params.text.trim() : '';
    if (!text || text.length > this.limits.questionChars) {
      throw new AgentError('invalid_request', '问题须为 1 至 20,000 字符');
    }
    const providerId = requireString(params.providerId, 'providerId');
    const model = requireString(params.model, 'model');
    const effort = parseEffort(params.effort);
    const attachments = parseAttachments(params.attachments);
    // 字段顺序属于既有请求散列算法；重构不改变幂等键。
    const normalized = { text, providerId, model, effort, attachments };
    const hash = createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
    return { requestId, hash, ...normalized };
  }

  private checkCapacity(index: Readonly<IndexState>): void {
    const active = Object.values(index.sessions).filter(
      (session) => session.activeTurn,
    );
    if (active.length >= 4) {
      throw new AgentError('capacity', '最多同时生成 4 个回答，请稍后重试');
    }
  }

  private async loadAttachments(
    snapshot: KnowledgeSnapshot,
    request: TurnSubmission,
    signal: AbortSignal,
  ) {
    const items = [];
    for (const attachment of request.attachments) {
      const document = await snapshot.document(attachment.docId, signal);
      if (
        attachment.contentHash &&
        attachment.contentHash !== document.contentHash
      ) {
        throw new AgentError(
          'stale_attachment',
          '所选文档已经更新，请重新选择附件',
        );
      }
      items.push(
        await snapshot.attachment(
          attachment.docId,
          attachment.headingIds,
          signal,
        ),
      );
    }
    const serialized = JSON.stringify(items);
    if (Buffer.byteLength(serialized) > 256000) {
      throw new AgentError(
        'attachment_limit',
        '附件内容超过预算，请选择更少章节',
      );
    }
    return { items, serialized };
  }

  private async commitTurn(
    context: RpcContext,
    sessionId: string,
    request: TurnSubmission,
    snapshot: KnowledgeSnapshot,
    evidence: {
      items: unknown[];
      serialized: string;
    },
    startedAt: number,
  ): Promise<string> {
    const { text, providerId, model, effort, requestId, hash } = request;
    const turnId = randomUUID();
    const input =
      text +
      (evidence.items.length
        ? `\n\n<reference_documents>\n${evidence.serialized}\n</reference_documents>`
        : '');
    await this.store.harness.commit(async (tx) => {
      const index = await tx.doc(IndexDoc);
      this.checkCapacity(index);
      const state = index.sessions[sessionId]!;
      state.requests[requestId] = { hash, turnId };
      state.turns.push(turnId);
      state.activeTurn = turnId;
      state.status = 'running';
      state.providerId = providerId;
      state.model = model;
      state.effort = effort;
      state.updatedAt = startedAt;
      if (state.turns.length === 1) {
        state.title = textPrefix(text, 60);
      }
      const run = await tx.doc(RunDoc, this.store.cid(sessionId), turnId, null);
      Object.assign(run, {
        turnId,
        hash,
        requestId,
        authorizationId: context.authorizationId,
        origin: context.origin,
        providerId,
        model,
        effort,
        createdAt: startedAt,
        deadline: startedAt + this.limits.deadlineMs,
        manifest: JSON.parse(JSON.stringify(snapshot.manifest)),
        pendingText: input,
        pendingQuestion: text,
        pendingEvidence: evidence.serialized,
      });
    }, CTX);
    return turnId;
  }
}

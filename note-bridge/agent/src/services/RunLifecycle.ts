import { BACKGROUND_CONTEXT as CTX } from '@earendil-works/chord/context';
import type { SubmissionId } from '@earendil-works/pi-durable';
import { AgentError } from '../domain/AgentError.js';
import type { RunState } from '../domain/AgentState.js';
import type { AgentStore } from '../persistence/AgentStore.js';
import { RunDoc, IndexDoc, EvidenceDoc } from '../persistence/documents.js';
import type { TurnProjectionService } from '../projection/TurnProjectionService.js';
import type { RunPolicy } from './RunPolicy.js';
import type { RuntimeConfiguration } from './RuntimeConfiguration.js';
import type { SessionEvents } from './SessionEvents.js';
import type { KnowledgeSnapshots } from './KnowledgeSnapshots.js';

/**
 * 持久回合状态机：准入、等待、取消、结算与重启恢复。
 * 停止先落盘再中断 Pi，确保进程崩溃也不会复活已取消任务；关闭仅释放宿主，不取消任务。
 */
export class RunLifecycle {
  private readonly monitors = new Set<string>();
  private closing = false;

  constructor(
    private readonly store: AgentStore,
    private readonly policy: RunPolicy,
    private readonly projection: TurnProjectionService,
    private readonly configuration: RuntimeConfiguration,
    private readonly events: SessionEvents,
    private readonly snapshots: KnowledgeSnapshots,
    private readonly now: () => number,
  ) {}

  close(): void {
    this.closing = true;
  }

  /** 只能在所有 provider 身份完成恢复后调用，调度仍由宿主最后开启。 */
  async recover(): Promise<void> {
    // All provider identities have already been populated by AgentStore.initialize.
    for (const meta of Object.values((await this.store.index()).sessions)) {
      if (!meta.activeTurn) {
        continue;
      }
      const run = await this.store.run(meta.id, meta.activeTurn);
      this.policy.controller(run);
      if (run.status === 'admitting') {
        await this.admit(meta.id, run);
      } else if (run.status === 'running') {
        this.monitor(meta.id, run);
      } else {
        await this.stop(
          meta.id,
          run,
          run.status === 'cancelled' ? 'cancelled' : 'error',
          run.error,
        );
      }
    }
  }

  /** 提交请求时沿用持久 requestId；恢复准入不会重复创建逻辑回合。 */
  public async admit(
    sessionId: string,
    run: Readonly<RunState>,
    question?: string,
    evidence?: unknown[],
  ) {
    try {
      await this.policy.checkRun(run);
      const conversation = (await this.store.harness.conversation(
        this.store.cid(sessionId),
        CTX,
      ))!;
      await conversation.configure(
        {
          model: { provider: run.providerId, modelId: run.model },
          thinkingLevel: 'off',
        },
        CTX,
      );
      const submission = await conversation.submit(
        {
          type: 'input',
          requestId: run.requestId,
          content: run.pendingText,
          whenBusy: 'reject',
          entry: {
            kind: 'note.input',
            data: JSON.parse(
              JSON.stringify({
                turnId: run.turnId,
                question: question ?? run.pendingQuestion,
                attachments:
                  evidence ?? JSON.parse(run.pendingEvidence || '[]'),
              }),
            ),
          },
        },
        CTX,
      );
      const status = await submission.status(CTX);
      await this.store.harness.commit(async (tx) => {
        const state = await tx.doc(
          RunDoc,
          this.store.cid(sessionId),
          run.turnId,
          null,
        );
        state.submissionId = submission.id;
        state.entryId = status.entry ?? 0;
        state.pendingText = '';
        state.pendingQuestion = '';
        state.pendingEvidence = '';
        if (state.status === 'admitting') {
          state.status = 'running';
        }
      }, CTX);
      this.monitor(sessionId, await this.store.run(sessionId, run.turnId));
    } catch (error) {
      await this.finish(
        sessionId,
        run.turnId,
        'error',
        this.configuration.errorText(error),
      );
    }
  }

  private monitor(sessionId: string, run: Readonly<RunState>) {
    if (this.monitors.has(run.turnId)) {
      return;
    }
    this.monitors.add(run.turnId);
    void (async () => {
      try {
        const submission = await this.store.harness.submission(
          run.submissionId as SubmissionId,
          CTX,
        );
        if (!submission) {
          throw new AgentError('missing_submission', '持久任务不存在');
        }
        const status = await submission.wait(CTX);
        if (this.closing) {
          return;
        }
        const current = await this.store.run(sessionId, run.turnId);
        if (current.status === 'cancelled' || current.status === 'error') {
          return;
        }
        await this.finish(
          sessionId,
          run.turnId,
          status.status === 'done' ? 'complete' : 'error',
          status.status === 'done'
            ? ''
            : typeof status.detail === 'string'
              ? status.detail
              : '模型运行未能完成',
        );
      } catch (error) {
        if (!this.closing) {
          await this.finish(
            sessionId,
            run.turnId,
            'error',
            this.configuration.errorText(error),
          );
        }
      } finally {
        this.monitors.delete(run.turnId);
      }
    })();
  }

  private async finish(
    sessionId: string,
    turnId: string,
    status: 'complete' | 'cancelled' | 'error',
    error: string,
  ) {
    this.projection.invalidate(turnId);
    const projection = await this.projection.project(sessionId, turnId);
    const conversation = (await this.store.harness.conversation(
      this.store.cid(sessionId),
      CTX,
    ))!;
    const newest = await conversation.entries({}, 1, undefined, CTX);
    await this.store.harness.commit(async (tx) => {
      const run = await tx.doc(RunDoc, this.store.cid(sessionId), turnId, null);
      run.citations = projection.sources;
      const evidence = await tx.doc(EvidenceDoc, this.store.cid(sessionId));
      for (const source of projection.sources) {
        evidence.sources[source.sourceId] = source;
      }
      const keys = Object.keys(evidence.sources);
      for (const key of keys.slice(0, Math.max(0, keys.length - 4096))) {
        delete evidence.sources[key];
      }
      run.status = status;
      run.error = error;
      run.endEntryId = newest.items[0]?.id ?? run.entryId;
      run.pendingText = '';
      run.pendingQuestion = '';
      run.pendingEvidence = '';
      const meta = (await tx.doc(IndexDoc)).sessions[sessionId]!;
      if (meta.activeTurn === turnId) {
        meta.activeTurn = '';
        meta.status = status === 'error' ? 'error' : 'idle';
        meta.updatedAt = this.now();
      }
    }, CTX);
    this.projection.invalidate(turnId);
    this.policy.release(turnId);
    this.snapshots.release(turnId);
    this.events.changed((await this.store.run(sessionId, turnId)).origin);
    this.events.queueUpdate(sessionId);
  }

  /** 先持久化停止状态，再中断 Pi 并冻结部分回答及引用证据。 */
  public async stop(
    sessionId: string,
    run: Readonly<RunState>,
    status: 'cancelled' | 'error',
    message: string,
  ) {
    await this.store.harness.commit(async (tx) => {
      const current = await tx.doc(
        RunDoc,
        this.store.cid(sessionId),
        run.turnId,
        null,
      );
      current.status = status;
      current.error = message;
    }, CTX);
    this.policy.controller(run).abort();
    await (await this.store.harness.conversation(
      this.store.cid(sessionId),
      CTX,
    ))!.abort(CTX);
    await this.finish(sessionId, run.turnId, status, message);
  }

  public async expire(turnId: string) {
    if (this.closing) {
      return;
    }
    const meta = Object.values((await this.store.index()).sessions).find(
      (s) => s.activeTurn === turnId,
    );
    if (meta) {
      await this.stop(
        meta.id,
        await this.store.run(meta.id, turnId),
        'error',
        '本次回答超过 20 分钟总时限',
      );
    }
  }
}

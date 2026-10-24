import type { CommitPublication } from '@earendil-works/pi-durable';
import type { Push } from '../protocol/RpcContext.js';
import type { AgentStore } from '../persistence/AgentStore.js';
import type { TurnProjectionService } from '../projection/TurnProjectionService.js';
import { sessionSummary } from '../projection/sessionSummary.js';

/**
 * 管理浏览器订阅与提交后的增量投影。断开连接只退订，不停止持久任务。
 * revision 取自 Pi 提交序号；合并短时间内的通知，客户端可据此识别过期快照。
 */
export class SessionEvents {
  revision = 0;
  private closing = false;
  private readonly subscriptions = new Map<
    string,
    {
      origin: string;
      sessions: Set<string>;
    }
  >();
  private readonly pendingUpdates = new Set<string>();
  private updateTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly store: AgentStore,
    private readonly projection: TurnProjectionService,
    private readonly emit: (push: Push) => void,
  ) {}

  attach(connectionId: string, origin: string): void {
    if (!this.subscriptions.has(connectionId)) {
      this.subscriptions.set(connectionId, { origin, sessions: new Set() });
    }
  }

  subscribe(connectionId: string, origin: string, sessionId: string): void {
    this.attach(connectionId, origin);
    this.subscriptions.get(connectionId)!.sessions.add(sessionId);
  }

  unsubscribe(connectionId: string, sessionId: string): void {
    this.subscriptions.get(connectionId)?.sessions.delete(sessionId);
  }

  detach(connectionId: string): void {
    this.subscriptions.delete(connectionId);
  }

  close(): void {
    this.closing = true;
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
  }

  /** 仅根据已提交的 Pi 序号推进 revision，未提交数据不能触发持久完成状态。 */
  public committed(publication: CommitPublication) {
    this.revision = publication.seq;
    for (const change of publication.changes) {
      if (
        change.type === 'entry' ||
        change.type === 'task' ||
        change.type === 'submission'
      ) {
        this.queueUpdate(String(change.value.conversationId));
      } else if (
        change.type === 'document' &&
        change.conversationId !== undefined
      ) {
        this.queueUpdate(String(change.conversationId));
      }
    }
  }

  public queueUpdate(sessionId: string) {
    if (this.closing) {
      return;
    }
    this.pendingUpdates.add(sessionId);
    if (this.updateTimer) {
      return;
    }
    this.updateTimer = setTimeout(() => {
      this.updateTimer = undefined;
      const ids = [...this.pendingUpdates];
      this.pendingUpdates.clear();
      void this.publish(ids);
    }, 150);
    this.updateTimer.unref();
  }

  private async publish(ids: string[]) {
    const revision = this.revision;
    try {
      const index = await this.store.index();
      for (const id of ids) {
        const meta = index.sessions[id];
        if (!meta) {
          continue;
        }
        const selected = [...this.subscriptions].filter(
          ([, s]) => s.origin === meta.origin && s.sessions.has(id),
        );
        if (!selected.length) {
          continue;
        }
        const turnId = meta.activeTurn || meta.turns.at(-1);
        const turn = turnId
          ? await this.projection.project(id, turnId)
          : undefined;
        const summary = sessionSummary(meta, revision);
        for (const [connectionId] of selected) {
          this.emit({
            event: 'session.updated',
            connectionId,
            data: {
              sessionId: id,
              revision: summary.revision,
              session: summary,
              ...(turn ? { turn } : {}),
            },
          });
        }
      }
    } catch {
      /* A closing worker is recovered from its committed snapshots. */
    }
  }

  public changed(origin: string) {
    for (const [connectionId, sub] of this.subscriptions) {
      if (sub.origin === origin) {
        this.emit({ event: 'sessions.changed', connectionId, data: {} });
      }
    }
  }
}

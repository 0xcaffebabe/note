import { KnowledgeClient, type KnowledgeSnapshot } from '../knowledge.js';
import type { RunState } from '../domain/AgentState.js';

/** 每个活动回合固定知识发布版本；重启时从 RunDoc manifest 恢复，不切换到最新数据。 */
export class KnowledgeSnapshots {
  private readonly snapshots = new Map<string, KnowledgeSnapshot>();

  constructor(private readonly fetchImpl?: typeof fetch) {}

  pin(origin: string, signal?: AbortSignal): Promise<KnowledgeSnapshot> {
    return new KnowledgeClient(origin, { fetch: this.fetchImpl }).pin(signal);
  }

  remember(turnId: string, snapshot: KnowledgeSnapshot): void {
    this.snapshots.set(turnId, snapshot);
  }

  release(turnId: string): void {
    this.snapshots.delete(turnId);
  }

  async restore(run: Readonly<RunState>, signal?: AbortSignal) {
    let snapshot = this.snapshots.get(run.turnId);
    if (!snapshot) {
      snapshot = await new KnowledgeClient(run.origin, {
        fetch: this.fetchImpl,
      }).restore(run.manifest, signal);
      this.snapshots.set(run.turnId, snapshot);
    }
    return snapshot;
  }
}

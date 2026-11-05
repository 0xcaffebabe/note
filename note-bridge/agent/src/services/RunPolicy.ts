import { BACKGROUND_CONTEXT as CTX } from '@earendil-works/chord/context';
import type { Api, Model } from '@earendil-works/pi-ai';
import { AgentError } from '../domain/AgentError.js';
import type { RunState } from '../domain/AgentState.js';
import type { AgentLimits } from '../config/limits.js';
import type { RequestPermit } from '../models.js';
import { selectedModel } from '../models.js';
import type { AgentStore } from '../persistence/AgentStore.js';
import { RunDoc } from '../persistence/documents.js';
import type { RuntimeConfiguration } from './RuntimeConfiguration.js';

/**
 * 运行授权、持久预算与总时限的统一检查点。预算先提交再发请求，重启不重置计数。
 * 普通请求用尽后只允许一次禁用工具的总结；取消信号与总时限贯穿网络和工具读取。
 */
export class RunPolicy {
  private readonly aborts = new Map<string, AbortController>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly store: AgentStore,
    private readonly configuration: RuntimeConfiguration,
    private readonly limits: AgentLimits,
    private readonly now: () => number,
    private readonly onExpire: (turnId: string) => Promise<void>,
  ) {}

  release(turnId: string): void {
    clearTimeout(this.timers.get(turnId));
    this.timers.delete(turnId);
    this.aborts.delete(turnId);
  }

  close(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
  }

  /** 恢复绝对截止时间；重启不会重新获得一段完整运行时长。 */
  public controller(run: Readonly<RunState>) {
    let controller = this.aborts.get(run.turnId);
    if (!controller) {
      controller = new AbortController();
      this.aborts.set(run.turnId, controller);
      const remaining = run.deadline - this.now();
      if (remaining <= 0) {
        controller.abort();
      } else {
        const timer = setTimeout(() => {
          controller!.abort();
          void this.onExpire(run.turnId);
        }, remaining);
        timer.unref();
        this.timers.set(run.turnId, timer);
      }
    }
    return controller;
  }

  /** 每个模型或工具网络边界重新验证授权、模型和持久状态。 */
  public async checkRun(run: Readonly<RunState>) {
    this.configuration.authorize({
      connectionId: '',
      authorizationId: run.authorizationId,
      origin: run.origin,
    });
    selectedModel(
      this.configuration.providers,
      run.providerId,
      run.model,
      run.effort,
    );
    if (run.status === 'cancelled' || run.status === 'error') {
      throw new AgentError('cancelled', run.error || '回答已停止');
    }
    if (this.now() >= run.deadline) {
      throw new AgentError('timeout', '本次回答超过 20 分钟总时限');
    }
  }

  /** 在 HTTP 请求开始前原子消费预算，并为唯一最终总结生成许可。 */
  public async permit(
    providerSessionId: string | undefined,
    model: Model<Api>,
    mode: 'generation' | 'compaction',
  ): Promise<RequestPermit> {
    const sessionId =
      providerSessionId && this.store.providerSessions.get(providerSessionId);
    if (!sessionId) {
      throw new AgentError('unknown_session', '模型请求缺少有效会话');
    }
    let run = await this.store.currentRun(sessionId);
    await this.checkRun(run);
    if (run.providerId !== model.provider || run.model !== model.id) {
      throw new AgentError('model_changed', '运行期间模型配置已经变更');
    }
    let final = false;
    await this.store.harness.commit(async (tx) => {
      const state = await tx.doc(
        RunDoc,
        this.store.cid(sessionId),
        run.turnId,
        null,
      );
      if (state.finalStarted) {
        throw new AgentError('budget_exhausted', '最终总结后不可继续请求模型');
      }
      if (
        state.requests >= this.limits.rounds ||
        state.tools >= this.limits.tools
      ) {
        if (mode === 'compaction') {
          throw new AgentError('budget_exhausted', '本轮预算不足以继续压缩');
        }
        state.finalStarted = true;
        state.contextNotice = '已达到本轮执行预算，正在根据已有证据完成总结。';
        final = true;
      } else {
        state.requests++;
      }
    }, CTX);
    run = await this.store.run(sessionId, run.turnId);
    const controller = this.controller(run);
    return {
      effort: run.effort,
      final,
      signal: controller.signal,
      check: async () =>
        this.checkRun(await this.store.run(sessionId, run.turnId)),
      release: () => {},
    };
  }
}

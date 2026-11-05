import { mkdir, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { BACKGROUND_CONTEXT as CTX } from '@earendil-works/chord/context';
import { Harness } from '@earendil-works/pi-durable';
import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';
import type { Models } from '@earendil-works/pi-ai/models';
import { makeModels } from './models.js';
import {
  AgentError,
  LIMITS,
  type RuntimeProvider,
  type Authorization,
  type RpcContext,
} from './types.js';
import type { RuntimeOptions } from './protocol/RuntimeOptions.js';
import { requireString } from './protocol/validation.js';
import { harnessSettings } from './config/harnessSettings.js';
import { createKnowledgeRegistry } from './adapters/createKnowledgeRegistry.js';
import { AgentStore } from './persistence/AgentStore.js';
import { TurnProjectionService } from './projection/TurnProjectionService.js';
import { RuntimeConfiguration } from './services/RuntimeConfiguration.js';
import { PreparationManager } from './services/PreparationManager.js';
import { SessionQueue } from './services/SessionQueue.js';
import { SessionEvents } from './services/SessionEvents.js';
import { KnowledgeSnapshots } from './services/KnowledgeSnapshots.js';
import { RunPolicy } from './services/RunPolicy.js';
import { RunLifecycle } from './services/RunLifecycle.js';
import { ConversationService } from './services/ConversationService.js';
import { TurnSubmissionService } from './services/TurnSubmissionService.js';

export type { RuntimeOptions } from './protocol/RuntimeOptions.js';

/**
 * 运行时组装入口与 v2 RPC 门面。业务状态、模型传输和 UI 投影由各自服务负责。
 * open 完成身份映射与任务恢复后才接受请求；close 保留已提交任务供下一 worker 恢复。
 */
export class AgentRuntime {
  private readonly store = new AgentStore();
  private readonly queue = new SessionQueue();
  private readonly configuration: RuntimeConfiguration;
  private readonly preparations: PreparationManager;
  private readonly snapshots: KnowledgeSnapshots;
  private readonly events: SessionEvents;
  private readonly policy: RunPolicy;
  private readonly lifecycle: RunLifecycle;
  private readonly conversations: ConversationService;
  private readonly submissions: TurnSubmissionService;
  private readonly limits: typeof LIMITS;
  private readonly now: () => number;
  private models!: Models;
  private closed = false;
  private closing = false;

  private constructor(private readonly options: RuntimeOptions) {
    this.now = options.now ?? Date.now;
    this.limits = { ...LIMITS, ...options.limits };
    this.configuration = new RuntimeConfiguration(
      options.providers,
      options.authorizations,
    );
    this.preparations = new PreparationManager(this.configuration);
    this.snapshots = new KnowledgeSnapshots(options.fetch);
    const projection = new TurnProjectionService(this.store, this.limits);
    this.events = new SessionEvents(
      this.store,
      projection,
      options.emit ?? (() => {}),
    );
    this.policy = new RunPolicy(
      this.store,
      this.configuration,
      this.limits,
      this.now,
      (turnId) => this.lifecycle.expire(turnId),
    );
    this.lifecycle = new RunLifecycle(
      this.store,
      this.policy,
      projection,
      this.configuration,
      this.events,
      this.snapshots,
      this.now,
    );
    this.conversations = new ConversationService(
      this.store,
      this.configuration,
      this.events,
      projection,
      this.now,
    );
    this.submissions = new TurnSubmissionService(
      this.store,
      this.configuration,
      this.preparations,
      this.policy,
      this.lifecycle,
      this.events,
      this.snapshots,
      this.limits,
      this.now,
    );
  }

  /** 打开唯一 SQLite 所有者，并在恢复所有 provider 身份后启动 Pi 调度。 */
  static async open(options: RuntimeOptions): Promise<AgentRuntime> {
    const runtime = new AgentRuntime(options);
    await runtime.initialize();
    return runtime;
  }

  private async initialize(): Promise<void> {
    await mkdir(this.options.dataDir, { recursive: true, mode: 0o700 });
    await chmod(this.options.dataDir, 0o700);
    this.refreshModels();
    const registry = createKnowledgeRegistry(
      this.store,
      this.policy,
      this.configuration,
      this.snapshots,
      this.limits,
    );
    const databasePath = join(this.options.dataDir, 'agent-v2.sqlite');
    const harness = await Harness.open(
      await openNodeSqliteStorage(databasePath),
      {
        models: () => this.models,
        registry,
        identity: { attribution: null },
        settings: () =>
          harnessSettings(this.configuration.providers, this.limits),
        onReport: (_error, info) => {
          if (info.type === 'session_failed') {
            this.closed = true;
          }
        },
      },
      CTX,
    );
    harness.subscribeCommits((publication) =>
      this.events.committed(publication),
    );
    await this.store.initialize(harness, this.now());
    await chmod(databasePath, 0o600);
    await this.lifecycle.recover();
    harness.resume();
  }

  private refreshModels(): void {
    this.models = makeModels(
      this.configuration.providers,
      (id, model, kind) => this.policy.permit(id, model, kind),
      this.options.fetch,
      this.limits,
    );
  }

  /** 应用原生配置并立即撤销不再合法的准备/运行任务，保持凭据仅驻留内存。 */
  async configure(
    providers: RuntimeProvider[],
    authorizations: Authorization[],
  ) {
    const previous = this.configuration.providers;
    this.configuration.replace(providers, authorizations);
    this.preparations.revalidate();
    this.refreshModels();
    for (const meta of Object.values((await this.store.index()).sessions)) {
      if (!meta.activeTurn) {
        continue;
      }
      const run = await this.store.run(meta.id, meta.activeTurn);
      try {
        await this.policy.checkRun(run);
        if (
          JSON.stringify(
            previous.find((provider) => provider.id === run.providerId),
          ) !== this.configuration.signature(run.providerId)
        ) {
          throw new AgentError(
            'configuration_changed',
            '模型服务配置已经变更，请重新提问',
          );
        }
      } catch (error) {
        await this.lifecycle.stop(
          meta.id,
          run,
          'error',
          this.configuration.errorText(error),
        );
      }
    }
    return { ok: true };
  }

  /** 路由已认证的站点请求；同会话写操作串行，取消先中断准备阶段再等待锁。 */
  async request(
    context: RpcContext,
    method: string,
    params: Record<string, unknown> = {},
  ) {
    this.configuration.authorize(context);
    this.events.attach(context.connectionId, context.origin);
    if (this.closed || this.closing) {
      throw new AgentError('runtime_unavailable', 'Agent 服务不可用');
    }
    switch (method) {
      case 'sessions.list':
        return this.conversations.list(context.origin, params);
      case 'sessions.create':
        return this.conversations.create(context, params);
      case 'sessions.get':
        return this.conversations.get(context.origin, params);
      case 'sessions.archive':
        return this.queue.run(
          requireString(params.sessionId, 'sessionId'),
          () => this.conversations.archive(context.origin, params.sessionId),
        );
      case 'session.subscribe': {
        const meta = await this.store.owned(context.origin, params.sessionId);
        this.events.subscribe(context.connectionId, context.origin, meta.id);
        return { ok: true };
      }
      case 'session.unsubscribe':
        this.events.unsubscribe(context.connectionId, String(params.sessionId));
        return { ok: true };
      case 'messages.send':
        return this.queue.run(
          requireString(params.sessionId, 'sessionId'),
          () => this.submissions.send(context, params),
        );
      case 'runs.cancel':
        return this.cancel(context, params.sessionId);
      case 'knowledge.document':
        return this.document(context, params.docId);
      default:
        throw new AgentError('unknown_method', '不支持的 Agent 方法');
    }
  }

  private async cancel(context: RpcContext, sessionId: unknown) {
    const meta = await this.store.owned(context.origin, sessionId);
    this.preparations.cancelSession(meta.id);
    return this.queue.run(meta.id, async () => {
      const current = await this.store.owned(context.origin, meta.id);
      if (current.activeTurn) {
        await this.lifecycle.stop(
          current.id,
          await this.store.run(current.id, current.activeTurn),
          'cancelled',
          '',
        );
      }
      return { ok: true };
    });
  }

  private async document(context: RpcContext, docId: unknown) {
    const preparation = this.preparations.begin(context);
    try {
      const snapshot = await this.snapshots.pin(
        context.origin,
        preparation.signal,
      );
      const document = await snapshot.document(
        requireString(docId, 'docId'),
        preparation.signal,
      );
      this.configuration.authorize(context);
      return document;
    } finally {
      preparation.dispose();
    }
  }

  /** 只释放浏览器订阅；不会取消已持久化的后台回答。 */
  detach(connectionId: string) {
    this.events.detach(connectionId);
    return { ok: true };
  }

  /** 停止宿主资源并落盘；未结束任务由下一 worker 恢复。 */
  async close(): Promise<void> {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.preparations.close();
    this.events.close();
    this.policy.close();
    this.lifecycle.close();
    await this.store.harness.close(CTX);
    this.closed = true;
  }
}

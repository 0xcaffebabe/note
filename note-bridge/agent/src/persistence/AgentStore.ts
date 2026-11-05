import { BACKGROUND_CONTEXT as CTX } from '@earendil-works/chord/context';
import {
  Harness,
  ProviderDoc,
  type ConversationId,
} from '@earendil-works/pi-durable';
import { AgentError } from '../domain/AgentError.js';
import { requireString } from '../protocol/validation.js';
import { IndexDoc, RunDoc } from './documents.js';

/**
 * Pi 会话身份与检查点查询入口。
 * Harness 在服务组装后、恢复任何任务之前绑定；Provider session 映射须先整体恢复，
 * 避免恢复中的模型请求绕过运行预算。写事务仍由对应业务服务原子提交。
 */
export class AgentStore {
  harness!: Harness;
  readonly providerSessions = new Map<string, string>();

  /** 绑定唯一 Harness，恢复所有模型会话身份后才能恢复 Pi 调度。 */
  async initialize(harness: Harness, epoch: number): Promise<void> {
    this.harness = harness;
    await harness.commit(async (tx) => {
      (await tx.doc(IndexDoc)).epoch = epoch;
    }, CTX);
    for (const meta of Object.values((await this.index()).sessions)) {
      await this.registerProviderSession(meta.id);
    }
  }

  /** 为新会话登记 Pi 的 provider sessionId，供模型请求绑定运行预算。 */
  async registerProviderSession(sessionId: string): Promise<void> {
    const provider = await this.harness.snapshot(
      ProviderDoc,
      this.cid(sessionId),
      CTX,
    );
    if (provider) {
      this.providerSessions.set(provider.sessionId, sessionId);
    }
  }

  public cid(id: string): ConversationId {
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) {
      throw new AgentError('invalid_request', '会话 ID 无效');
    }
    return Number(id) as ConversationId;
  }

  public async index() {
    return (await this.harness.snapshot(IndexDoc, CTX))!;
  }

  public async run(sessionId: string, turnId: string) {
    const run = await this.harness.snapshot(
      RunDoc,
      this.cid(sessionId),
      turnId,
      CTX,
    );
    if (!run) {
      throw new AgentError('not_found', '回答不存在');
    }
    return run;
  }

  public async currentRun(sessionId: string) {
    const meta = (await this.index()).sessions[sessionId];
    if (!meta?.activeTurn) {
      throw new AgentError('no_active_run', '会话没有活动任务');
    }
    return this.run(sessionId, meta.activeTurn);
  }

  /** 对外查询必须经此检查；不存在、跨 Origin 和已归档会话统一返回 not_found。 */
  public async owned(origin: string, id: unknown) {
    const sessionId = requireString(id, 'sessionId');
    this.cid(sessionId);
    const meta = (await this.index()).sessions[sessionId];
    if (!meta || meta.origin !== origin || meta.archived) {
      throw new AgentError('not_found', '会话不存在');
    }
    return meta;
  }
}

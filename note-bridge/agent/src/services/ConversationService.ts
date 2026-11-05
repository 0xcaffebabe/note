import { BACKGROUND_CONTEXT as CTX } from '@earendil-works/chord/context';
import type { RpcContext } from '../protocol/RpcContext.js';
import type { SessionMeta } from '../domain/AgentState.js';
import type { ChatTurn } from '../domain/Conversation.js';
import { AgentError } from '../domain/AgentError.js';
import { SYSTEM } from '../config/systemPrompt.js';
import { selectedModel } from '../models.js';
import {
  requireString,
  parseEffort,
  pageLimit,
  pageCursor,
} from '../protocol/validation.js';
import type { AgentStore } from '../persistence/AgentStore.js';
import { IndexDoc } from '../persistence/documents.js';
import type { TurnProjectionService } from '../projection/TurnProjectionService.js';
import { sessionSummary } from '../projection/sessionSummary.js';
import type { RuntimeConfiguration } from './RuntimeConfiguration.js';
import type { SessionEvents } from './SessionEvents.js';

/** 会话目录与历史分页服务。所有读取按 Origin 隔离；归档只能作用于空闲会话。 */
export class ConversationService {
  constructor(
    private readonly store: AgentStore,
    private readonly configuration: RuntimeConfiguration,
    private readonly events: SessionEvents,
    private readonly projection: TurnProjectionService,
    private readonly now: () => number,
  ) {}

  /** 调用方持有会话锁；活动回合必须先显式停止。 */
  async archive(origin: string, sessionId: unknown) {
    const meta = await this.store.owned(origin, sessionId);
    if (meta.activeTurn) {
      throw new AgentError('busy', '请先停止正在运行的回答');
    }
    await this.store.harness.commit(async (tx) => {
      (await tx.doc(IndexDoc)).sessions[meta.id]!.archived = true;
    }, CTX);
    this.events.changed(origin);
    return { ok: true };
  }

  /** 原子创建 Pi 会话和站点索引，并登记后续模型请求使用的 provider 身份。 */
  public async create(context: RpcContext, p: Record<string, unknown>) {
    const providerId = requireString(p.providerId, 'providerId');
    const model = requireString(p.model, 'model');
    const effort = parseEffort(p.effort);
    selectedModel(this.configuration.providers, providerId, model, effort);
    const now = this.now();
    let meta!: SessionMeta;
    await this.store.harness.createConversation(
      {
        ownership: { kind: 'ownerless' },
        agent: {
          model: { provider: providerId, modelId: model },
          thinkingLevel: 'off',
          instructions: SYSTEM,
        },
        init: async (tx, id) => {
          meta = {
            id: String(id),
            origin: context.origin,
            title: '新对话',
            providerId,
            model,
            effort,
            createdAt: now,
            updatedAt: now,
            status: 'idle',
            archived: false,
            turns: [],
            activeTurn: '',
            requests: {},
          };
          (await tx.doc(IndexDoc)).sessions[meta.id] = meta;
        },
      },
      CTX,
    );
    await this.store.registerProviderSession(meta.id);
    this.events.changed(context.origin);
    return sessionSummary(meta, this.events.revision);
  }

  public async list(origin: string, p: Record<string, unknown>) {
    const revision = this.events.revision;
    const limit = pageLimit(p.limit);
    const cursor = pageCursor(p.cursor);
    const all = Object.values((await this.store.index()).sessions)
      .filter((s) => s.origin === origin && !s.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt || Number(b.id) - Number(a.id));
    const offset = cursor ? all.findIndex((s) => s.id === cursor) + 1 : 0;
    if (cursor && offset === 0) {
      throw new AgentError('invalid_cursor', '会话分页已失效，请刷新');
    }
    const selected = all.slice(offset, offset + limit);
    return {
      sessions: selected.map((s) => sessionSummary(s, revision)),
      ...(offset + limit < all.length
        ? { nextCursor: selected.at(-1)!.id }
        : {}),
    };
  }

  public async get(origin: string, p: Record<string, unknown>) {
    const revision = this.events.revision;
    const meta = await this.store.owned(origin, p.sessionId);
    const limit = pageLimit(p.limit);
    const cursor = pageCursor(p.cursor);
    const end = cursor ? meta.turns.indexOf(cursor) : meta.turns.length;
    if (end < 0) {
      throw new AgentError('invalid_cursor', '历史分页无效');
    }
    const start = Math.max(0, end - limit);
    const turns: ChatTurn[] = [];
    let bytes = 0;
    let actualStart = end;
    for (let i = end - 1; i >= start; i--) {
      const turn = await this.projection.project(meta.id, meta.turns[i]!);
      const size = Buffer.byteLength(JSON.stringify(turn));
      if (turns.length && bytes + size > 8 * 1024 * 1024) {
        break;
      }
      turns.unshift(turn);
      bytes += size;
      actualStart = i;
    }
    return {
      session: sessionSummary(meta, revision),
      turns,
      ...(actualStart > 0 ? { nextCursor: meta.turns[actualStart] } : {}),
    };
  }
}

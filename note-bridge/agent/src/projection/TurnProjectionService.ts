import { BACKGROUND_CONTEXT as CTX } from '@earendil-works/chord/context';
import { LiveDoc, type Cursor, type EntryId } from '@earendil-works/pi-durable';
import type { Message } from '@earendil-works/pi-ai';
import type {
  ChatTurn,
  Citation,
  Overview,
  ToolCallRecord,
} from '../domain/Conversation.js';
import type { AgentLimits } from '../config/limits.js';
import type { AgentStore } from '../persistence/AgentStore.js';
import { EvidenceDoc } from '../persistence/documents.js';
import { sanitizeOverview } from './sanitizeOverview.js';

/**
 * 将 Pi 原始日志与实时文档投影为 v2 回合。只裁剪 UI 投影，不改写原始证据。
 * 结束回合的引用元数据由 RunDoc 冻结，避免站点新版本改写历史引用；仅缓存已结束回合。
 */
export class TurnProjectionService {
  private readonly completed = new Map<string, ChatTurn>();

  constructor(
    private readonly store: AgentStore,
    private readonly limits: AgentLimits,
  ) {}

  invalidate(turnId: string): void {
    this.completed.delete(turnId);
  }

  /** 结合持久日志和 live 文档生成视图；已结束回合引用不会回查最新站点数据。 */
  async project(sessionId: string, turnId: string): Promise<ChatTurn> {
    const cached = this.completed.get(turnId);
    if (cached) {
      return cached;
    }
    const run = await this.store.run(sessionId, turnId);
    const turn: ChatTurn = {
      id: turnId,
      question: '',
      answer: '',
      status: run.status === 'admitting' ? 'running' : run.status,
      sources: [],
      toolCalls: [],
      createdAt: run.createdAt,
      ...(run.error ? { error: run.error } : {}),
      ...(run.contextNotice ? { contextNotice: run.contextNotice } : {}),
    };
    const calls = new Map<string, ToolCallRecord>();
    const sources = new Map<string, Citation>();
    const addSources = (items: unknown) => {
      if (Array.isArray(items)) {
        for (const source of items) {
          if (
            source &&
            typeof source === 'object' &&
            typeof source.sourceId === 'string' &&
            sources.size < 4096
          ) {
            sources.set(source.sourceId, source as Citation);
          }
        }
      }
    };
    if (run.entryId) {
      const conversation = (await this.store.harness.conversation(
        this.store.cid(sessionId),
        CTX,
      ))!;
      let cursor: Cursor | undefined;
      let count = 0;
      do {
        const page = await conversation.entries(
          {
            minEntryId: run.entryId as EntryId,
            ...(run.endEntryId
              ? { maxEntryId: run.endEntryId as EntryId }
              : {}),
            order: 'ascending',
          },
          100,
          cursor,
          CTX,
        );
        for (const entry of page.items) {
          if (entry.kind === 'note.input') {
            const data = entry.data as {
              question?: string;
              attachments?: {
                sources?: Citation[];
              }[];
            };
            turn.question = data?.question ?? '';
            for (const a of data?.attachments ?? []) {
              addSources(a.sources);
            }
          }
          for (const message of entry.model ?? []) {
            this.projectMessage(message, turn, calls, addSources);
          }
        }
        count += page.items.length;
        cursor = page.next;
      } while (cursor && count < 2048);
    }
    if (run.status === 'running' || run.status === 'admitting') {
      const live = await this.store.harness.snapshot(
        LiveDoc,
        this.store.cid(sessionId),
        CTX,
      );
      if (live?.generation?.message) {
        this.projectMessage(
          live.generation.message as Message,
          turn,
          calls,
          addSources,
        );
      }
      for (const tool of live?.tools ?? []) {
        if (!calls.has(tool.callId)) {
          calls.set(tool.callId, {
            callId: tool.callId,
            name: tool.name,
            status: tool.status === 'done' ? 'complete' : 'running',
          });
        }
      }
    }
    addSources(run.citations);
    // Resolve citations reused without another tool call from bridge-owned evidence.
    // On settlement, this exact metadata is frozen in the run, so later site revisions
    // or reads of the same sourceId cannot rewrite historical citations.
    if (
      run.status === 'running' ||
      run.status === 'admitting' ||
      !run.endEntryId
    ) {
      const evidence = await this.store.harness.snapshot(
        EvidenceDoc,
        this.store.cid(sessionId),
        CTX,
      );
      for (const match of turn.answer.matchAll(/\[(D\d+S\d+)\]/g)) {
        const source = evidence?.sources[match[1]!];
        if (source && !sources.has(source.sourceId)) {
          addSources([source]);
        }
      }
    }
    turn.sources = [...sources.values()];
    turn.toolCalls = [...calls.values()].slice(0, this.limits.tools);
    turn.answer = turn.answer.slice(0, this.limits.answerChars);
    if (turn.status !== 'running') {
      this.completed.set(turnId, turn);
      if (this.completed.size > 100) {
        this.completed.delete(this.completed.keys().next().value!);
      }
    }
    return turn;
  }

  private projectMessage(
    message: Message,
    turn: ChatTurn,
    calls: Map<string, ToolCallRecord>,
    addSources: (items: unknown) => void,
  ) {
    if (message.role === 'assistant') {
      for (const part of message.content) {
        if (part.type === 'text') {
          turn.answer += part.text;
        } else if (part.type === 'toolCall') {
          calls.set(part.id, {
            callId: part.id,
            name: part.name,
            status: 'running',
            overview: sanitizeOverview({
              input: Object.entries(part.arguments).map(([label, value]) => ({
                label,
                value:
                  typeof value === 'string'
                    ? value
                    : (JSON.stringify(value) ?? ''),
              })),
            }),
          });
        }
      }
    } else if (message.role === 'toolResult') {
      const details = message.details as
        | {
            sources?: Citation[];
            overview?: Overview;
          }
        | undefined;
      addSources(details?.sources);
      const previous = calls.get(message.toolCallId);
      calls.set(message.toolCallId, {
        callId: message.toolCallId,
        name: message.toolName,
        status: message.isError ? 'error' : 'complete',
        ...(details?.overview
          ? { overview: sanitizeOverview(details.overview) }
          : previous?.overview
            ? { overview: previous.overview }
            : {}),
        ...(message.isError
          ? {
              message: message.content
                .filter((c) => c.type === 'text')
                .map((c) => c.text)
                .join('')
                .slice(0, 1000),
            }
          : {}),
      });
    }
  }
}

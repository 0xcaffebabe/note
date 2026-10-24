import { BACKGROUND_CONTEXT as CTX } from '@earendil-works/chord/context';
import { Type } from 'typebox';
import {
  createRegistry,
  defineExtension,
  defineTool,
  CompactionTask,
  hook,
} from '@earendil-works/pi-durable';
import { AgentError } from '../domain/AgentError.js';
import type { AgentLimits } from '../config/limits.js';
import { KNOWLEDGE_TOOL_DEFINITIONS } from '../knowledge.js';
import { IndexDoc, RunDoc } from '../persistence/documents.js';
import type { AgentStore } from '../persistence/AgentStore.js';
import type { RunPolicy } from '../services/RunPolicy.js';
import type { RuntimeConfiguration } from '../services/RuntimeConfiguration.js';
import type { KnowledgeSnapshots } from '../services/KnowledgeSnapshots.js';

/** 将站点只读工具接入 Pi：先原子扣减工具预算，再读取固定版本资源，并保留完整证据。 */
export function createKnowledgeRegistry(
  store: AgentStore,
  policy: RunPolicy,
  configuration: RuntimeConfiguration,
  snapshots: KnowledgeSnapshots,
  limits: AgentLimits,
) {
  const registry = createRegistry();
  registry.install(
    defineExtension({
      name: 'note.knowledge',
      tools: KNOWLEDGE_TOOL_DEFINITIONS.map((def) =>
        defineTool({
          name: def.name,
          description: def.description,
          parameters: Type.Unsafe<Record<string, unknown>>(def.inputSchema),
          replay: 'safe',
          execute: async (args, api, context) => {
            const sessionId = String(api.conversationId);
            const run = await store.currentRun(sessionId);
            await policy.checkRun(run);
            if (run.finalStarted || run.tools >= limits.tools) {
              return {
                isError: true,
                output: [
                  {
                    type: 'text',
                    text: 'budget_exhausted: 工具调用预算已用尽，请根据现有证据总结。',
                  },
                ],
              };
            }
            await api.commit(async (tx) => {
              const state = await tx.doc(
                RunDoc,
                api.conversationId,
                run.turnId,
                null,
              );
              if (state.tools >= limits.tools || state.finalStarted) {
                throw new AgentError('budget_exhausted', '工具预算已用尽');
              }
              state.tools++;
            }, context);
            const signal = AbortSignal.any([
              policy.controller(run).signal,
              AbortSignal.timeout(limits.toolTimeoutMs),
              ...(context.abortSignal ? [context.abortSignal] : []),
            ]);
            try {
              const snapshot = await snapshots.restore(run, signal);
              const result = await snapshot.execute(def.name, args, signal);
              await policy.checkRun(run);
              return {
                output: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      data: result.data,
                      sources: result.sources ?? [],
                    }),
                  },
                ],
                details: JSON.parse(
                  JSON.stringify({
                    sources: result.sources ?? [],
                    overview: result.overview ?? { input: [] },
                  }),
                ),
              };
            } catch (error) {
              const message = configuration.errorText(error);
              return {
                isError: true,
                output: [{ type: 'text', text: message }],
                details: {
                  overview: {
                    input: Object.entries(args).map(([label, value]) => ({
                      label,
                      value: String(value).slice(0, 500),
                    })),
                    summary: message,
                  },
                },
              };
            }
          },
        }),
      ),
      hooks: [
        hook(CompactionTask, {
          beforeCompact: async (_request, api) => {
            await store.harness.commit(async (tx) => {
              const index = await tx.doc(IndexDoc);
              const meta = index.sessions[String(api.conversationId)];
              if (meta?.activeTurn) {
                const run = await tx.doc(
                  RunDoc,
                  api.conversationId,
                  meta.activeTurn,
                  null,
                );
                run.compactions++;
                run.contextNotice =
                  '较早上下文已由 Pi 压缩；原始聊天与工具证据仍完整保留。';
              }
            }, CTX);
            return undefined;
          },
        }),
      ],
    }),
  );
  return registry;
}

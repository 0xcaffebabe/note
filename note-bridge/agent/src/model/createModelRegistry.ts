import {
  createModels,
  createProvider,
  type Models,
} from '@earendil-works/pi-ai/models';
import type { Api } from '@earendil-works/pi-ai';
import { LIMITS } from '../config/limits.js';
import type { RuntimeProvider } from '../domain/Model.js';
import type { ModelGuard } from './RequestPermit.js';
import { modelOptions } from './ModelCatalog.js';
import { createModelStream } from './PiModelStream.js';
import { EMPTY_COST } from './constants.js';

/** 注册原生配置的 provider。Pi 仅看到占位身份，无法读取环境或自行保存凭据。 */
export function makeModels(
  providers: RuntimeProvider[],
  guard: ModelGuard,
  fetchImpl: typeof fetch = fetch,
  limits: typeof LIMITS = LIMITS,
): Models {
  const models = createModels({
    authContext: { env: async () => undefined, fileExists: async () => false },
    credentials: {
      read: async () => undefined,
      list: async () => [],
      modify: async () => {
        throw new Error('Credentials are owned by Note Bridge');
      },
      delete: async () => {},
    },
    identity: { attribution: null },
  });
  for (const p of providers.filter((p) => p.enabled)) {
    const api: Api =
      p.protocol === 'anthropic'
        ? 'anthropic-messages'
        : p.protocol === 'responses'
          ? 'openai-responses'
          : 'openai-completions';
    // Anthropic SDK 会自行追加 /v1/messages；与原生探测、模型目录保持同一地址约定。
    const baseUrl =
      p.protocol === 'anthropic'
        ? p.baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')
        : p.baseUrl;
    const listed = modelOptions(p).map((m) => ({
      id: m.id,
      name: m.name,
      provider: p.id,
      api,
      baseUrl,
      input: ['text'] as ['text'],
      cost: EMPTY_COST,
      reasoning: true,
      contextWindow: m.contextWindowTokens ?? 1000000,
      maxTokens:
        m.maxOutputTokens ??
        Math.min(16384, Math.floor((m.contextWindowTokens ?? 1000000) / 2)),
    }));
    const run = createModelStream(p, api, guard, fetchImpl, limits);
    models.setProvider(
      createProvider({
        id: p.id,
        name: p.name,
        baseUrl,
        auth: {
          apiKey: {
            name: 'Note Bridge credentials',
            resolve: async () => ({
              auth: { apiKey: 'note-bridge-memory-auth' },
            }),
          },
        },
        models: listed,
        api: { stream: run, streamSimple: run },
      }),
    );
  }
  return models;
}

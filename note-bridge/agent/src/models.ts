import {
  createModels,
  createProvider,
  type Models,
} from '@earendil-works/pi-ai/models';
import type {
  Api,
  Model,
  SimpleStreamOptions,
  TranscriptContext,
  AssistantMessage,
} from '@earendil-works/pi-ai';
import { stream as responses } from '@earendil-works/pi-ai/api/openai-responses';
import { stream as completions } from '@earendil-works/pi-ai/api/openai-completions';
import { stream as anthropic } from '@earendil-works/pi-ai/api/anthropic-messages';
import { getCurrentTools } from '@earendil-works/pi-ai/utils/transcript';
import { AssistantMessageEventStream } from '@earendil-works/pi-ai/utils/event-stream';
import {
  AgentError,
  LIMITS,
  type Effort,
  type RuntimeProvider,
  type ModelOption,
} from './types.js';

export type RequestPermit = {
  effort: Effort;
  final: boolean;
  signal: AbortSignal;
  check: () => Promise<void>;
  release: () => void;
};
export type ModelGuard = (
  sessionId: string | undefined,
  model: Model<Api>,
  kind: 'generation' | 'compaction',
) => Promise<RequestPermit>;
const EMPTY_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
export function modelOptions(p: RuntimeProvider): ModelOption[] {
  return p.models?.length
    ? p.models
    : [
        {
          id: p.model,
          name: p.model,
          efforts: ['default', 'low', 'medium', 'high'],
        },
      ];
}
export function selectedModel(
  providers: RuntimeProvider[],
  id: string,
  model: string,
  effort: Effort,
): { provider: RuntimeProvider; option: ModelOption } {
  const provider = providers.find((p) => p.enabled && p.id === id);
  const option = provider && modelOptions(provider).find((m) => m.id === model);
  if (!provider || !option)
    throw new AgentError(
      'model_unavailable',
      '所选模型不可用，请检查 Note Bridge 模型配置',
    );
  if (effort !== 'default' && !option.efforts?.includes(effort))
    throw new AgentError('unsupported_effort', '此模型未配置所选 effort');
  if (
    provider.protocol === 'anthropic' &&
    ['minimal', 'ultra'].includes(effort)
  )
    throw new AgentError(
      'unsupported_effort',
      'Anthropic 协议不支持此 effort；请在模型设置中选择 low/medium/high/xhigh/max',
    );
  if (provider.authKind !== 'none' && !provider.secret)
    throw new AgentError('credential_unavailable', '此服务的凭据不可用');
  return { provider, option };
}
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
    const listed = modelOptions(p).map((m) => ({
      id: m.id,
      name: m.name,
      provider: p.id,
      api,
      baseUrl: p.baseUrl,
      input: ['text'] as ['text'],
      cost: EMPTY_COST,
      reasoning: true,
      contextWindow: m.contextWindowTokens ?? 1_000_000,
      maxTokens:
        m.maxOutputTokens ??
        Math.min(16384, Math.floor((m.contextWindowTokens ?? 1_000_000) / 2)),
    }));
    const run = (
      model: Model<Api>,
      context: TranscriptContext,
      options?: SimpleStreamOptions,
    ) => {
      const out = new AssistantMessageEventStream();
      void (async () => {
        let permit: RequestPermit | undefined;
        try {
          permit = await guard(
            options?.sessionId,
            model,
            getCurrentTools(context.messages).length
              ? 'generation'
              : 'compaction',
          );
          const signal = AbortSignal.any([
            permit.signal,
            ...(options?.signal ? [options.signal] : []),
          ]);
          const boundedFetch: typeof fetch = async (input, init) => {
            await permit!.check();
            const headers = new Headers(
              init?.headers ??
                (input instanceof Request ? input.headers : undefined),
            );
            headers.delete('authorization');
            headers.delete('x-api-key');
            if (p.authKind !== 'none')
              headers.set(
                p.protocol === 'anthropic' && p.authKind === 'apiKey'
                  ? 'x-api-key'
                  : 'authorization',
                p.protocol === 'anthropic' && p.authKind === 'apiKey'
                  ? p.secret!
                  : `Bearer ${p.secret}`,
              );
            const requestBody = init?.body;
            if (
              typeof requestBody === 'string' &&
              Buffer.byteLength(requestBody) > limits.inputBytes
            )
              throw new AgentError('context_limit', '模型请求超出 16 MiB 上限');
            const requestSignal = AbortSignal.any([
              signal,
              ...(init?.signal ? [init.signal] : []),
              ...(input instanceof Request ? [input.signal] : []),
            ]);
            const response = await fetchImpl(input, {
              ...init,
              headers,
              signal: requestSignal,
              redirect: 'error',
            });
            if (!response.body) return response;
            let bytes = 0,
              ended = false;
            const reader = response.body.getReader();
            // SDK timeouts may stop at headers. Bound an idle SSE body as well.
            const body = new ReadableStream<Uint8Array>({
              async pull(controller) {
                const fail = (error: unknown) => {
                  if (!ended) {
                    ended = true;
                    controller.error(error);
                    void reader.cancel(error).catch(() => {});
                  }
                };
                const abort = () =>
                  fail(new AgentError('cancelled', '模型请求已中断'));
                const timer = setTimeout(
                  () => fail(new AgentError('timeout', '模型响应超过空闲时限')),
                  limits.requestTimeoutMs,
                );
                requestSignal.addEventListener('abort', abort, { once: true });
                try {
                  requestSignal.throwIfAborted();
                  const value = await reader.read();
                  if (ended) return;
                  if (value.done) {
                    ended = true;
                    controller.close();
                    return;
                  }
                  bytes += value.value.byteLength;
                  if (bytes > limits.responseBytes)
                    throw new AgentError('response_limit', '模型响应超过上限');
                  controller.enqueue(value.value);
                } catch (error) {
                  fail(error);
                } finally {
                  clearTimeout(timer);
                  requestSignal.removeEventListener('abort', abort);
                }
              },
              cancel(reason) {
                ended = true;
                return reader.cancel(reason);
              },
            });
            return new Response(body, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          };
          const onPayload = (value: unknown) => {
            const body = value as Record<string, unknown>;
            // "default" means omission, including Pi's inferred reasoning:none/default thinking fields.
            delete body.reasoning;
            delete body.reasoning_effort;
            delete body.thinking;
            delete body.output_config;
            if (permit!.effort !== 'default') {
              if (p.protocol === 'anthropic') {
                if (permit!.effort === 'none')
                  body.thinking = { type: 'disabled' };
                else {
                  body.thinking = { type: 'adaptive' };
                  body.output_config = { effort: permit!.effort };
                }
              } else if (p.protocol === 'responses')
                body.reasoning = { effort: permit!.effort };
              else body.reasoning_effort = permit!.effort;
            }
            if (permit!.final)
              body.tool_choice =
                p.protocol === 'anthropic' ? { type: 'none' } : 'none';
            return body;
          };
          const opts = {
            ...options,
            apiKey: 'note-bridge-memory-auth',
            headers: { authorization: null, 'x-api-key': null },
            fetch: boundedFetch,
            onPayload,
            signal,
            maxTokens: Math.min(
              options?.maxTokens ?? model.maxTokens,
              model.maxTokens,
            ),
            maxRetries: 0,
            timeoutMs: limits.requestTimeoutMs,
            cacheRetention: 'none' as const,
            transport: 'sse' as const,
          };
          const requestContext = permit.final
            ? {
                ...context,
                messages: [
                  ...context.messages,
                  {
                    role: 'user' as const,
                    content:
                      '本轮已达到执行预算。请停止调用工具，仅根据已经读取的证据直接完成最终回答，明确说明证据不足之处。',
                    timestamp: Date.now(),
                  },
                ],
              }
            : context;
          const source =
            api === 'anthropic-messages'
              ? anthropic(
                  model as Model<'anthropic-messages'>,
                  requestContext,
                  opts,
                )
              : api === 'openai-responses'
                ? responses(
                    model as Model<'openai-responses'>,
                    requestContext,
                    opts,
                  )
                : completions(
                    model as Model<'openai-completions'>,
                    requestContext,
                    opts,
                  );
          let chars = 0;
          for await (const event of source) {
            if (event.type === 'text_delta') {
              chars += Buffer.byteLength(event.delta);
              if (chars > limits.outputBytes)
                throw new AgentError('response_limit', '模型可见输出超过上限');
            }
            if (event.type === 'error')
              event.error.errorMessage = safeError(
                event.error.errorMessage,
                p.secret,
              );
            out.push(event);
          }
        } catch (error) {
          const message: AssistantMessage = {
            role: 'assistant',
            content: [],
            api,
            provider: p.id,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { ...EMPTY_COST, total: 0 },
            },
            stopReason: 'error',
            timestamp: Date.now(),
            errorMessage:
              error instanceof AgentError
                ? error.message
                : '模型请求失败，请检查服务连接和配置',
          };
          out.push({ type: 'error', reason: 'error', error: message });
        } finally {
          permit?.release();
          out.end();
        }
      })();
      return out;
    };
    models.setProvider(
      createProvider({
        id: p.id,
        name: p.name,
        baseUrl: p.baseUrl,
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
function safeError(
  value: string | undefined,
  secret: string | undefined,
): string {
  const text = value ?? '模型请求失败';
  // Redact before truncation: a cutoff through a key must not expose its prefix.
  return (secret ? text.split(secret).join('[redacted]') : text).slice(0, 1000);
}

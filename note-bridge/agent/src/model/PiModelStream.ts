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
import { AgentError } from '../domain/AgentError.js';
import type { RuntimeProvider } from '../domain/Model.js';
import type { AgentLimits } from '../config/limits.js';
import type { ModelGuard, RequestPermit } from './RequestPermit.js';
import { boundedModelFetch } from './BoundedModelFetch.js';
import { modelPayloadPolicy } from './ModelPayloadPolicy.js';
import { EMPTY_COST } from './constants.js';

/**
 * 把 Pi 协议流适配到 Note Bridge 的运行预算。每次调用独立持有许可，所有退出路径都释放。
 * 返回给 Pi 的错误经过脱敏；未知异常只公开固定文案，防止 SDK 错误携带凭据。
 */
export function createModelStream(
  provider: RuntimeProvider,
  api: Api,
  guard: ModelGuard,
  fetchImpl: typeof fetch,
  limits: AgentLimits,
) {
  return (
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
        const boundedFetch = boundedModelFetch(
          provider,
          permit,
          signal,
          fetchImpl,
          limits,
        );
        const onPayload = modelPayloadPolicy(provider, permit);
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
            if (chars > limits.outputBytes) {
              throw new AgentError('response_limit', '模型可见输出超过上限');
            }
          }
          if (event.type === 'error') {
            event.error.errorMessage = safeError(
              event.error.errorMessage,
              provider.secret,
            );
          }
          out.push(event);
        }
      } catch (error) {
        const message: AssistantMessage = {
          role: 'assistant',
          content: [],
          api,
          provider: provider.id,
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
}

function safeError(
  value: string | undefined,
  secret: string | undefined,
): string {
  const text = value ?? '模型请求失败';
  // Redact before truncation: a cutoff through a key must not expose its prefix.
  return (secret ? text.split(secret).join('[redacted]') : text).slice(0, 1000);
}

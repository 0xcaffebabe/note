import { AgentError } from '../domain/AgentError.js';
import type { RuntimeProvider } from '../domain/Model.js';
import type { AgentLimits } from '../config/limits.js';
import type { RequestPermit } from './RequestPermit.js';

/**
 * 真正的 HTTP 发送边界：重新检查授权、最后一刻注入凭据，并限制请求/响应大小和 SSE 空闲时长。
 * 凭据不得出现在 Pi stream options、checkpoint 或持久化任务中；响应体也受取消信号约束。
 */
export function boundedModelFetch(
  provider: RuntimeProvider,
  permit: RequestPermit,
  signal: AbortSignal,
  fetchImpl: typeof fetch,
  limits: AgentLimits,
): typeof fetch {
  return async (input, init) => {
    await permit.check();
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    headers.delete('authorization');
    headers.delete('x-api-key');
    if (provider.authKind !== 'none') {
      headers.set(
        provider.protocol === 'anthropic' && provider.authKind === 'apiKey'
          ? 'x-api-key'
          : 'authorization',
        provider.protocol === 'anthropic' && provider.authKind === 'apiKey'
          ? provider.secret!
          : `Bearer ${provider.secret}`,
      );
    }
    const requestBody = init?.body;
    if (
      typeof requestBody === 'string' &&
      Buffer.byteLength(requestBody) > limits.inputBytes
    ) {
      throw new AgentError('context_limit', '模型请求超出 16 MiB 上限');
    }
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
    if (!response.body) {
      return response;
    }
    let bytes = 0;
    let ended = false;
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
        const abort = () => fail(new AgentError('cancelled', '模型请求已中断'));
        const timer = setTimeout(
          () => fail(new AgentError('timeout', '模型响应超过空闲时限')),
          limits.requestTimeoutMs,
        );
        requestSignal.addEventListener('abort', abort, { once: true });
        try {
          requestSignal.throwIfAborted();
          const value = await reader.read();
          if (ended) {
            return;
          }
          if (value.done) {
            ended = true;
            controller.close();
            return;
          }
          bytes += value.value.byteLength;
          if (bytes > limits.responseBytes) {
            throw new AgentError('response_limit', '模型响应超过上限');
          }
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
}

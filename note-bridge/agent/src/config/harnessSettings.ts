import { modelOptions } from '../models.js';
import type { RuntimeProvider } from '../domain/Model.js';
import type { AgentLimits } from './limits.js';

/** Pi 调度与压缩策略；模型级上下文窗口覆盖默认预算，重试仍受 RunDoc 请求计数限制。 */
export function harnessSettings(
  providers: RuntimeProvider[],
  limits: AgentLimits,
) {
  return {
    stream: {
      maxRetries: 0,
      timeoutMs: limits.requestTimeoutMs,
      cacheRetention: 'none' as const,
    },
    retry: {
      enabled: true,
      maxRetries: 2,
      baseDelayMs: 500,
      maxAgentDelayMs: 5000,
    },
    toolExecution: 'sequential' as const,
    afterFailedRun: 'withdraw' as const,
    contextRetentionMs: 0,
    documentRetentionMs: 60000,
    compaction: {
      enabled: true,
      backgroundTokens: 0,
      reserveTokens: 200000,
      keepRecentTokens: 150000,
      modelOverrides: Object.fromEntries(
        providers.flatMap((p) =>
          modelOptions(p).map((m) => [
            `${p.id}/${m.id}`,
            {
              reserveTokens: Math.max(
                m.maxOutputTokens ?? 16384,
                Math.floor((m.contextWindowTokens ?? 1000000) * 0.2),
              ),
              keepRecentTokens: Math.floor(
                (m.contextWindowTokens ?? 1000000) * 0.15,
              ),
            },
          ]),
        ),
      ),
    },
  };
}

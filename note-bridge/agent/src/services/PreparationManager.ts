import { AgentError } from '../domain/AgentError.js';
import type { RpcContext } from '../protocol/RpcContext.js';
import { RuntimeConfiguration } from './RuntimeConfiguration.js';
import type { PendingPreparation } from '../domain/PendingPreparation.js';

/**
 * 管理尚未提交到 Pi 的站点读取。取消/撤权直接中断准备阶段，不能排在同一会话锁后。
 * 调用方必须在 finally 中 dispose，防止已完成请求保留取消句柄。
 */
export class PreparationManager {
  private readonly pending = new Map<symbol, PendingPreparation>();

  constructor(private readonly configuration: RuntimeConfiguration) {}

  revalidate(): void {
    for (const preparation of this.pending.values()) {
      try {
        this.configuration.authorize(preparation.context);
        if (
          preparation.providerId &&
          preparation.configuration !==
            this.configuration.signature(preparation.providerId)
        ) {
          throw new AgentError('configuration_changed', '模型配置已经变更');
        }
      } catch {
        preparation.controller.abort(
          new AgentError('configuration_changed', '授权或模型配置已经变更'),
        );
      }
    }
  }

  cancelSession(sessionId: string): void {
    for (const preparation of this.pending.values()) {
      if (preparation.sessionId === sessionId) {
        preparation.controller.abort(new AgentError('cancelled', '回答已停止'));
      }
    }
  }

  close(): void {
    for (const preparation of this.pending.values()) {
      preparation.controller.abort(
        new AgentError('runtime_unavailable', 'Agent 正在关闭'),
      );
    }
  }

  begin(
    context: RpcContext,
    sessionId?: string,
    providerId?: string,
    deadlineMs?: number,
  ) {
    const key = Symbol();
    const controller = new AbortController();
    this.pending.set(key, {
      context,
      sessionId,
      providerId,
      configuration: providerId
        ? this.configuration.signature(providerId)
        : undefined,
      controller,
    });
    return {
      signal: deadlineMs
        ? AbortSignal.any([controller.signal, AbortSignal.timeout(deadlineMs)])
        : controller.signal,
      dispose: () => this.pending.delete(key),
    };
  }
}

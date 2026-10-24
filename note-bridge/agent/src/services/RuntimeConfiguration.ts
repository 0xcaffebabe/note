import { AgentError } from '../domain/AgentError.js';
import type { RuntimeProvider, Authorization, RpcContext } from '../types.js';
import { selectedModel } from '../models.js';
import type { RunState } from '../domain/AgentState.js';

/**
 * 当前授权与模型配置的内存视图。每次网络边界重新读取，撤权无需等待远端请求结束。
 * 不持久化凭据；错误先完整脱敏再截断，防止泄露密钥前缀。
 */
export class RuntimeConfiguration {
  constructor(
    public providers: RuntimeProvider[],
    private grants: Authorization[],
  ) {}

  replace(providers: RuntimeProvider[], grants: Authorization[]): void {
    this.providers = providers;
    this.grants = grants;
  }

  signature(providerId: string): string | undefined {
    return JSON.stringify(
      this.providers.find((provider) => provider.id === providerId),
    );
  }

  checkModel(run: Pick<RunState, 'providerId' | 'model' | 'effort'>): void {
    selectedModel(this.providers, run.providerId, run.model, run.effort);
  }

  public authorize(context: RpcContext) {
    if (
      !this.grants.some(
        (g) => g.id === context.authorizationId && g.origin === context.origin,
      )
    ) {
      throw new AgentError('unauthorized', '站点授权已失效，请重新配对');
    }
  }

  public errorText(error: unknown) {
    let text = error instanceof Error ? error.message : 'Agent 执行失败';
    for (const p of this.providers) {
      if (p.secret) {
        text = text.split(p.secret).join('[redacted]');
      }
    }
    return text.slice(0, 1000);
  }
}

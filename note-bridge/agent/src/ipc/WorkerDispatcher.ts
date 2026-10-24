import { AgentRuntime } from '../runtime.js';
import { KnowledgeError } from '../knowledge.js';
import { AgentError } from '../domain/AgentError.js';
import type { RuntimeProvider, Authorization, RpcContext } from '../types.js';
import type { Envelope } from './Envelope.js';

/** 私有 IPC 方法分发器；将未知异常收敛为固定文案，避免 SDK 或磁盘错误泄露宿主信息。 */
export class WorkerDispatcher {
  private runtime?: AgentRuntime;

  constructor(private readonly output: (value: unknown) => void) {}

  get initialized(): boolean {
    return this.runtime !== undefined;
  }

  async close(): Promise<void> {
    await this.runtime?.close();
  }

  /** 执行一个宿主请求并且仅回显对应 id，未知错误使用固定安全文案。 */
  async dispatch(message: Envelope) {
    try {
      const params = message.params ?? {};
      let result: unknown;
      switch (message.method) {
        case 'initialize':
          if (this.runtime) {
            throw new AgentError('already_initialized', 'Agent 已初始化');
          }
          if (
            typeof params.dataDir !== 'string' ||
            !Array.isArray(params.providers) ||
            !Array.isArray(params.authorizations)
          ) {
            throw new AgentError('invalid_request', '初始化参数无效');
          }
          this.runtime = await AgentRuntime.open({
            dataDir: params.dataDir,
            providers: params.providers as RuntimeProvider[],
            authorizations: params.authorizations as Authorization[],
            emit: this.output,
          });
          result = { ready: true, version: 2 };
          break;
        case 'configure':
          if (!this.runtime) {
            throw new AgentError('not_initialized', 'Agent 尚未初始化');
          }
          result = await this.runtime.configure(
            params.providers as RuntimeProvider[],
            params.authorizations as Authorization[],
          );
          break;
        case 'request': {
          if (!this.runtime) {
            throw new AgentError('not_initialized', 'Agent 尚未初始化');
          }
          const request = params.request as {
            method: string;
            params?: Record<string, unknown>;
          };
          result = await this.runtime.request(
            params as unknown as RpcContext,
            request.method,
            request.params,
          );
          break;
        }
        case 'detach':
          result = this.runtime?.detach(String(params.connectionId)) ?? {
            ok: true,
          };
          break;
        case 'shutdown':
          await this.runtime?.close();
          result = { ok: true };
          break;
        default:
          throw new AgentError('unknown_method', '未知 IPC 方法');
      }
      this.output({ id: message.id, result });
    } catch (error) {
      this.output({
        id: message.id,
        error: {
          code:
            error instanceof AgentError || error instanceof KnowledgeError
              ? error.code
              : 'agent_error',
          message:
            error instanceof AgentError || error instanceof KnowledgeError
              ? error.message
              : 'Agent 操作失败，请检查配置或重启 Note Bridge',
        },
      });
    }
  }
}

import { LIMITS } from '../config/limits.js';
import type { Envelope } from './Envelope.js';
import type { WorkerDispatcher } from './WorkerDispatcher.js';

/**
 * IPC 准入队列。配置/取消用独立串行通道，普通请求最多并行 8 个，避免站点网络读取阻塞撤权。
 * 删除排队消息时仍按 Origin 隔离；shutdown 先停止准入，再关闭 runtime 并等待在途回复。
 */
export class RequestScheduler {
  private initializing?: Promise<void>;
  private ending = false;
  private active = 0;
  private priorityActive = 0;
  private queuedBytes = 0;
  private readonly regular: {
    message: Envelope;
    bytes: number;
  }[] = [];
  private readonly priority: Envelope[] = [];
  private readonly inflight = new Set<Promise<void>>();

  constructor(
    private readonly dispatcher: WorkerDispatcher,
    private readonly output: (value: unknown) => void,
    private readonly endInput: () => void,
  ) {}

  /** 返回 false 表示已在退出，防止多条错误路径重复触发进程终止。 */
  beginEnding(): boolean {
    if (this.ending) {
      return false;
    }
    this.ending = true;
    return true;
  }

  async close(): Promise<void> {
    this.ending = true;
    await this.dispatcher.close();
  }

  private errorReply(message: Envelope, code: string, text: string) {
    this.output({ id: message.id, error: { code, message: text } });
  }

  private launch(message: Envelope, urgent: boolean) {
    if (urgent) {
      this.priorityActive++;
    } else {
      this.active++;
    }
    const task = this.dispatcher.dispatch(message).finally(() => {
      this.inflight.delete(task);
      if (urgent) {
        this.priorityActive--;
      } else {
        this.active--;
      }
      this.pump();
    });
    this.inflight.add(task);
  }

  private pump() {
    if (this.initializing || this.ending) {
      return;
    }
    // One configuration/cancel lane preserves configuration order while ordinary
    // requests have a separate bounded concurrency pool.
    if (this.priorityActive === 0 && this.priority.length) {
      this.launch(this.priority.shift()!, true);
    }
    while (this.active < 8 && this.regular.length) {
      const next = this.regular.shift()!;
      this.queuedBytes -= next.bytes;
      this.launch(next.message, false);
    }
  }

  private removeQueued(
    predicate: (message: Envelope) => boolean,
    reason: string,
  ) {
    for (let i = this.regular.length - 1; i >= 0; i--) {
      if (predicate(this.regular[i]!.message)) {
        const [entry] = this.regular.splice(i, 1);
        this.queuedBytes -= entry!.bytes;
        this.errorReply(entry!.message, 'cancelled', reason);
      }
    }
  }

  /** 单帧已通过 JSON/大小校验；此处只负责生命周期优先级和队列容量。 */
  accept(message: Envelope, bytes: number) {
    if (this.ending) {
      this.errorReply(message, 'runtime_unavailable', 'Agent 正在关闭');
      return;
    }
    if (message.method === 'initialize') {
      if (this.initializing || this.dispatcher.initialized) {
        this.errorReply(message, 'already_initialized', 'Agent 已初始化');
        return;
      }
      this.initializing = this.dispatcher.dispatch(message).finally(() => {
        this.initializing = undefined;
        if (this.ending) {
          void this.dispatcher.close();
        } else {
          this.pump();
        }
      });
      return;
    }
    if (message.method === 'shutdown') {
      this.ending = true;
      this.removeQueued(() => true, 'Agent 正在关闭');
      for (const queued of this.priority.splice(0)) {
        this.errorReply(queued, 'runtime_unavailable', 'Agent 正在关闭');
      }
      void (async () => {
        await this.initializing;
        await this.dispatcher.close();
        await Promise.allSettled([...this.inflight]);
        await this.dispatcher.dispatch(message);
        this.endInput();
      })();
      return;
    }
    const request = message.params?.request as
      | {
          method?: string;
          params?: {
            sessionId?: string;
          };
        }
      | undefined;
    if (message.method === 'detach') {
      const connectionId = message.params?.connectionId;
      this.removeQueued(
        (item) =>
          item.method === 'request' &&
          item.params?.connectionId === connectionId,
        '浏览器已断开',
      );
    }
    if (request?.method === 'runs.cancel') {
      const sessionId = request.params?.sessionId;
      const origin = message.params?.origin;
      this.removeQueued(
        (item) =>
          typeof origin === 'string' &&
          item.params?.origin === origin &&
          item.method === 'request' &&
          (item.params?.request as typeof request)?.method ===
            'messages.send' &&
          (item.params?.request as typeof request)?.params?.sessionId ===
            sessionId,
        '回答已停止',
      );
    }
    const urgent =
      message.method === 'configure' ||
      message.method === 'detach' ||
      request?.method === 'runs.cancel';
    if (urgent) {
      if (this.priority.length >= 64) {
        this.errorReply(message, 'capacity', '控制请求过多');
        return;
      }
      this.priority.push(message);
    } else {
      if (
        this.regular.length >= 64 ||
        this.queuedBytes + bytes > LIMITS.ipcBytes
      ) {
        this.errorReply(message, 'capacity', 'Agent 请求队列已满');
        return;
      }
      this.regular.push({ message, bytes });
      this.queuedBytes += bytes;
    }
    this.pump();
  }
}

import type { Writable } from 'node:stream';
import { AgentError } from '../domain/AgentError.js';
import { LIMITS } from '../config/limits.js';
import { wellFormedText } from '../text.js';

const MAX_BUFFER_BYTES = 32 * 1024 * 1024;

/**
 * 有界 JSONL 输出：RPC 响应保序；stdout 背压时仅合并相同连接/会话的最新推送。
 * 超出内存界限由宿主终止进程，下一 worker 从已提交的 Pi 检查点恢复。
 */
export class JsonlOutput {
  private readonly latestPushes = new Map<string, string>();
  private pushBytes = 0;

  constructor(
    private readonly stdout: Writable,
    private readonly onOverflow: () => void,
  ) {
    stdout.on('drain', () => this.drain());
  }

  private drain(): void {
    for (const [key, line] of this.latestPushes) {
      this.latestPushes.delete(key);
      this.pushBytes -= Buffer.byteLength(line);
      this.writeLine(line);
      if (this.stdout.writableNeedDrain) {
        break;
      }
    }
  }

  private writeLine(line: string) {
    if (
      this.stdout.writableLength + Buffer.byteLength(line) >
      MAX_BUFFER_BYTES
    ) {
      this.onOverflow();
      return;
    }
    this.stdout.write(line);
  }

  send(value: unknown) {
    // 旧检查点或模型输出也可能包含孤立代理项；仅修复传输副本，保留原始历史。
    const line =
      JSON.stringify(value, (_key, item: unknown) =>
        typeof item === 'string' ? wellFormedText(item) : item,
      ) + '\n';
    if (Buffer.byteLength(line) > LIMITS.ipcBytes) {
      throw new AgentError('response_limit', 'IPC 响应超过上限');
    }
    const event = value as {
      event?: string;
      connectionId?: string;
      data?: {
        sessionId?: string;
      };
    };
    if (event.event && this.stdout.writableNeedDrain) {
      const key = `${event.connectionId}:${event.event}:${event.data?.sessionId ?? ''}`;
      this.pushBytes -= Buffer.byteLength(this.latestPushes.get(key) ?? '');
      this.latestPushes.set(key, line);
      this.pushBytes += Buffer.byteLength(line);
      if (this.pushBytes > MAX_BUFFER_BYTES) {
        this.onOverflow();
      }
      return;
    }
    this.writeLine(line);
  }
}

import { LIMITS } from '../config/limits.js';
import type { Envelope } from './Envelope.js';

/** 按换行拆帧并严格解码 UTF-8；单帧及未完成帧均有界，非法帧不阻断后续消息。 */
export class JsonlInput {
  private input = Buffer.alloc(0);

  constructor(
    private readonly accept: (message: Envelope, bytes: number) => void,
    private readonly output: (value: unknown) => void,
    private readonly onOverflow: () => void,
  ) {}

  read(chunk: Buffer): void {
    this.input = Buffer.concat([this.input, chunk]);
    for (;;) {
      const end = this.input.indexOf(10);
      if (end < 0) {
        break;
      }
      const line = this.input.subarray(0, end);
      this.input = this.input.subarray(end + 1);
      if (!line.length) {
        continue;
      }
      if (line.byteLength > LIMITS.ipcBytes) {
        this.output({
          error: { code: 'request_limit', message: 'IPC 请求超过上限' },
        });
        continue;
      }
      try {
        const message = JSON.parse(
          new TextDecoder('utf-8', { fatal: true }).decode(line),
        );
        if (
          !message ||
          typeof message !== 'object' ||
          typeof message.method !== 'string'
        ) {
          throw new Error();
        }
        this.accept(message, line.byteLength);
      } catch {
        this.output({
          error: { code: 'invalid_json', message: 'IPC JSON 无效' },
        });
      }
    }
    if (this.input.byteLength > LIMITS.ipcBytes) {
      this.onOverflow();
    }
  }
}

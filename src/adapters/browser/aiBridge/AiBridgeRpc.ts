import { isRecord } from './protocol/ProtocolValueReader'
import { AiBridgeRpcError } from './AiBridgeRpcError'
import type { PendingRpc } from './AiBridgeConnectionTypes'

/**
 * 关联 RPC 请求和确认，约束并发与等待时间。
 * 超时或断连只结束本页等待，桌面端可能已提交操作，因此不会自动重发或取消。
 */
export class AiBridgeRpc {
  private readonly pending = new Map<string, PendingRpc>()

  constructor(
    private readonly requestId: () => string,
    private readonly send: (frame: Record<string, unknown>) => void,
  ) {}

  request(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (this.pending.size >= 32) {
      return Promise.reject(new Error('请求过多，请稍后重试'))
    }
    const id = this.requestId()
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new AiBridgeRpcError('timeout', '请求确认超时；请重新载入聊天确认结果，问题不会自动重发'))
      }, 30000)
      this.pending.set(id, { resolve, reject, timer })
      try {
        this.send({ type: 'request', id, method, params })
      } catch (cause) {
        clearTimeout(timer)
        this.pending.delete(id)
        reject(cause)
      }
    })
  }

  receive(frame: Record<string, unknown>): void {
    if (typeof frame.id !== 'string') {
      throw new Error('invalid response')
    }
    const pending = this.pending.get(frame.id)
    if (!pending) {
      // 已超时请求仍可能在桌面端提交，忽略迟到确认而不重发。
      return
    }
    if (
      frame.error !== undefined
      && (!isRecord(frame.error) || typeof frame.error.code !== 'string' || typeof frame.error.message !== 'string')
    ) {
      throw new Error('invalid error')
    }
    this.pending.delete(frame.id)
    clearTimeout(pending.timer)
    if (isRecord(frame.error)) {
      pending.reject(new AiBridgeRpcError(String(frame.error.code), String(frame.error.message)))
    } else if ('result' in frame) {
      pending.resolve(frame.result)
    } else {
      pending.reject(new Error('桥接响应缺少结果'))
    }
  }

  disconnect(): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(new AiBridgeRpcError('disconnected', '连接已断开；Note Bridge 中的回答会继续，重连后将重新载入'))
    }
    this.pending.clear()
  }
}

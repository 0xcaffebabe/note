import { AI_MAX_FRAME_BYTES } from '@/core/domain/AiLimits'
import type { SocketCallbacks, SocketFactory } from './AiBridgeConnectionTypes'

/**
 * 单个 WebSocket 的传输生命周期：本机地址、帧大小、握手期限和心跳。
 * 不解释授权或聊天内容；替换连接后屏蔽旧 socket 的迟到事件。
 */
export class AiBridgeSocket {
  private socket?: WebSocket
  private handshakeTimer?: ReturnType<typeof setTimeout>
  private heartbeat?: ReturnType<typeof setInterval>
  private awaitingPong = false

  constructor(private readonly createSocket: SocketFactory) {}

  open(port: number, firstFrame: Record<string, unknown>, callbacks: SocketCallbacks): void {
    let socket: WebSocket
    try {
      socket = this.createSocket(`ws://127.0.0.1:${port}/ws`)
    } catch {
      callbacks.onFailure('浏览器无法访问本地桥接，请检查本地网络权限与桌面端状态')
      return
    }
    this.socket = socket
    const current = () => this.socket === socket
    const pairing = firstFrame.type === 'pair'
    this.handshakeTimer = setTimeout(() => {
      callbacks.onFailure(pairing ? '配对超时，请检查配对码和桌面端状态' : '连接认证超时，稍后自动重试')
    }, pairing ? 15000 : 12000)
    socket.onopen = () => {
      if (!current()) {
        return
      }
      try {
        this.send(firstFrame)
      } catch {
        callbacks.onFailure('连接已断开，稍后自动重试')
      }
    }
    socket.onerror = () => {
      if (current()) {
        callbacks.onFailure('连接失败，请检查 Note Bridge、端口或本地网络权限')
      }
    }
    socket.onclose = () => {
      if (current()) {
        callbacks.onFailure('连接已断开，稍后自动重连；问题不会自动重发')
      }
    }
    socket.onmessage = event => {
      if (!current()) {
        return
      }
      try {
        if (
          typeof event.data !== 'string'
          || event.data.length > AI_MAX_FRAME_BYTES
          || new TextEncoder().encode(event.data).length > AI_MAX_FRAME_BYTES
        ) {
          throw new Error('invalid frame')
        }
        callbacks.onFrame(JSON.parse(event.data))
      } catch {
        callbacks.onInvalidFrame()
      }
    }
  }

  /** 认证成功后才启用心跳；下一轮仍未收到 pong 则报告断连。 */
  authenticated(onFailure: (message: string) => void): void {
    clearTimeout(this.handshakeTimer)
    this.heartbeat = setInterval(() => {
      if (this.awaitingPong) {
        onFailure('连接心跳超时，稍后自动重连')
        return
      }
      this.awaitingPong = true
      try {
        this.send({ type: 'ping' })
      } catch {
        onFailure('连接已断开，稍后自动重连')
      }
    }, 25000)
  }

  pong(): void {
    this.awaitingPong = false
  }

  send(frame: Record<string, unknown>): void {
    if (this.socket?.readyState !== 1) {
      throw new Error('连接已断开')
    }
    const encoded = JSON.stringify({ v: 2, ...frame })
    if (new TextEncoder().encode(encoded).length > AI_MAX_FRAME_BYTES) {
      throw new Error('桥接请求过大，请减少上下文')
    }
    this.socket.send(encoded)
  }

  close(): void {
    clearTimeout(this.handshakeTimer)
    clearInterval(this.heartbeat)
    const socket = this.socket
    this.socket = undefined
    this.awaitingPong = false
    if (socket) {
      socket.onclose = null
      socket.onerror = null
      socket.onmessage = null
      socket.onopen = null
      socket.close()
    }
  }
}

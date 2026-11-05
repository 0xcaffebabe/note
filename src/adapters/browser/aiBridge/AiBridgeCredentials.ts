import type { StoragePort } from '@/core/ports/StoragePort'
import type { SavedConnection } from './AiBridgeConnectionTypes'

export const AI_BRIDGE_STORAGE_KEY = 'note:ai-bridge:v1'

/** 配对凭证只允许协议约定的长度和字符集。 */
export function validConnectionToken(token: unknown): token is string {
  return typeof token === 'string'
    && token.length >= 16
    && token.length <= 512
    && /^[A-Za-z0-9._~-]+$/.test(token)
}

/** 比较端口和令牌，不依赖反序列化后的对象身份。 */
export function sameCredential(left: SavedConnection | undefined, right: SavedConnection | undefined): boolean {
  return left?.token === right?.token && left?.port === right?.port
}

/**
 * 管理当前页凭证和浏览器持久化副本。
 * 存储不可用不会中断当前授权；旧认证失败不能删除其他标签页的新授权。
 */
export class AiBridgeCredentials {
  current?: SavedConnection
  remembered = false

  constructor(private readonly storage: StoragePort) {}

  read(): SavedConnection | undefined {
    try {
      const raw = this.storage.getItem(AI_BRIDGE_STORAGE_KEY)
      if (!raw) {
        return
      }
      if (raw.length > 2048) {
        throw new Error('oversized credential')
      }
      const saved = JSON.parse(raw)
      if (
        saved?.version === 1
        && Number.isInteger(saved.port)
        && saved.port >= 1024
        && saved.port <= 65535
        && validConnectionToken(saved.token)
      ) {
        return { version: 1, port: saved.port, token: saved.token }
      }
      this.storage.removeItem(AI_BRIDGE_STORAGE_KEY)
    } catch {
      // 损坏或不可用的存储不能改变连接目的地。
    }
  }

  adopt(saved: SavedConnection | undefined): void {
    this.current = saved
    this.remembered = !!saved
  }

  save(port: number, token: string): boolean {
    this.current = { version: 1, port, token }
    try {
      const serialized = JSON.stringify(this.current)
      this.storage.setItem(AI_BRIDGE_STORAGE_KEY, serialized)
      this.remembered = this.storage.getItem(AI_BRIDGE_STORAGE_KEY) === serialized
    } catch {
      this.remembered = false
    }
    return this.remembered
  }

  /** 仅删除本次认证所用的旧凭证，保留其他标签页刚保存的新授权。 */
  clear(expected?: SavedConnection): void {
    this.current = undefined
    this.remembered = false
    try {
      if (!expected || sameCredential(this.read(), expected)) {
        this.storage.removeItem(AI_BRIDGE_STORAGE_KEY)
      }
    } catch {
      // 桌面端已撤销的凭证不会因浏览器删除失败重新生效。
    }
  }
}

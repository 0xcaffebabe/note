// StoragePort 的浏览器实现: 包装 localStorage。读写做 try/catch 兜底,
// 兼容隐私模式/配额异常/无 window 的环境, 失败时降级为无持久化而非抛错。
import type { StoragePort } from '@/core/ports'

export class LocalStorageAdapter implements StoragePort {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* 配额满/隐私模式: 静默降级 */
    }
  }
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      /* 同上 */
    }
  }
}

export const browserStorage = new LocalStorageAdapter()

import type { StoragePort } from '../ports'

/**
 * 应用配置: KV 配置的持久化读写。通过注入的 StoragePort 持久化, 不直接依赖 localStorage。
 */
export class ConfigService {
  private static STORAGE_KEY = 'config-service::'

  constructor(private readonly storage: StoragePort) {}

  public get(key: string): any {
    return this.getConfigMap().get(key)
  }

  public set(key: string, val: any) {
    const map = this.getConfigMap()
    map.set(key, val)
    this.storage.setItem(ConfigService.STORAGE_KEY, JSON.stringify(Array.from(map)))
  }

  private getConfigMap(): Map<string, any> {
    const raw = this.storage.getItem(ConfigService.STORAGE_KEY)
    if (!raw) {
      return new Map()
    }
    return new Map(Array.from(JSON.parse(raw)))
  }
}

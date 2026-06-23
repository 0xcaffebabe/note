// 缓存端口: @cache 装饰器与各服务记忆化的抽象。core 只依赖本契约,
// 具体实现(进程内分 scope LRU)由 CacheService 提供, 实例由各组合根注入,
// core 不再持有任何全局可变单例。
export interface CachePort {
  get(id: string, cacheKey: string): any
  set(id: string, cacheKey: string, cacheValue: any): void
  has(id: string, cacheKey: string): boolean
}

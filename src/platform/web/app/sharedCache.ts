// 运行期共享缓存实例: core 的 CacheService 已无全局单例, 实例在此组合根创建,
// 注入各运行期服务(它们的 @cache 方法经 this.cache 使用之)。测试经此实例 clear() 隔离。
import CacheService from '@/core/cache/CacheService'

export const sharedCache = new CacheService()

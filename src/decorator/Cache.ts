import CacheService from '../service/CacheService'
import Cacheable from './Cacheable';
const cacheService = CacheService.getInstance()

/**
 * 缓存装饰器
 *
 * @param keyResolver 自定义缓存键提取函数
 *
 * 不传keyResolver（默认）：用JSON.stringify(arguments)做键，且只缓存Promise结果。
 * 部分同步方法（如TagService）依赖异步init填充的数据，过早缓存会把空结果永久冻结，
 * 因此默认不缓存同步结果。
 *
 * 传keyResolver：方法被视为纯函数，同步结果也会缓存。
 * 用于参数包含大对象（如整篇文档内容）的方法，避免每次查找都序列化大参数、
 * 缓存键本身也不再持有大字符串副本。
 */
export default function Cache(keyResolver?: (...args: any[]) => string){
  return function(target: Cacheable, propertyKey: string, descriptor: PropertyDescriptor){
      let originalFunction: Function = descriptor.value;
      const id = target.name() + "-" + propertyKey
      descriptor.value = function () {
        const cacheKey = keyResolver
          ? keyResolver(...arguments as unknown as any[])
          : JSON.stringify(arguments)
        if (cacheService.has(id, cacheKey)) {
          return cacheService.get(id, cacheKey)
        }
        const result = originalFunction.apply(this, arguments);
        // 对Promise特殊处理
        if (result instanceof Promise) {
          return result.then(data => {
            cacheService.set(id, cacheKey, data)
            return data
          })
        }
        if (keyResolver) {
          cacheService.set(id, cacheKey, result)
        }
        return result
    };
    return descriptor;
  }
}

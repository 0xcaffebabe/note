import CacheService from '@/service/CacheService'
import Cacheable from './Cacheable';
const cacheService = CacheService.getInstance()

export default function Cache(){
  return function(target: Cacheable, propertyKey: string, descriptor: PropertyDescriptor){
      let originalFunction: Function = descriptor.value;
      const id = target.name() + "-" + propertyKey
      descriptor.value = function () {
        const argsStringify = JSON.stringify(arguments)
        if (cacheService.has(id, argsStringify)) {
          return cacheService.get(id, argsStringify)
        }
        const result = originalFunction.apply(this, arguments);
        // 对Promise特殊处理
        if (result instanceof Promise) {
          return result.then(data => {
            cacheService.set(id, argsStringify, data)
            return data
          })
        }
        return result
    };
    return descriptor;
  }
}
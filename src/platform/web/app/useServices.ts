// Vue 侧取服务的入口: 合成根容器经 app.provide 注入, 组件用 useServices()(setup)
// 或 this.$services(Options API)取用。fallback 到模块级 services, 保证非 provide 上下文(如单测)也可用。
import { inject, type InjectionKey } from 'vue'
import { services, type Services } from './container'

export const SERVICES_KEY: InjectionKey<Services> = Symbol('services')

export function useServices(): Services {
  // 优先用 provide 注入的容器; 不在 provide 上下文(或注入值缺失)时回落到模块级合成根单例。
  return inject(SERVICES_KEY, services) ?? services
}

export type { Services }
export { services }

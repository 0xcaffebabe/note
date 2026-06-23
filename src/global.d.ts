import type { Services } from '@/platform/web/app/container'

export{} // 必须保留
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $isMobile: () => boolean
    // 合成根服务容器: Options API 组件经 this.$services 取服务(由 main.ts 注入)
    $services: Services
  }
}

// echarts-gl 未随包提供类型声明, 这里给出最小模块声明(install 形态, 供 echarts.use)
declare module 'echarts-gl/charts' {
  export const Scatter3DChart: any
}
declare module 'echarts-gl/components' {
  export const Grid3DComponent: any
}
export{} // 必须保留
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $isMobile: () => boolean
  }
}

// echarts-gl 未随包提供类型声明, 这里给出最小模块声明(install 形态, 供 echarts.use)
declare module 'echarts-gl/charts' {
  export const Scatter3DChart: any
}
declare module 'echarts-gl/components' {
  export const Grid3DComponent: any
}
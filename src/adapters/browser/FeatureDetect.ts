// 能力探测适配器: 检测 WebGL 可用性(echarts-gl 的 scatter3D 需要 WebGL 上下文,
// 硬件加速关闭 / GPU 黑名单 / 虚拟机无 GPU / 上下文耗尽 等都会拿不到上下文)。
export function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

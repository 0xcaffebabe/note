import { ref, computed, readonly } from 'vue'
import { MOBILE_MAX, DESKTOP_MIN, WIDE_MIN, ULTRA_MIN, isMobileViewport } from '@/core/config/breakpoints'

// 响应式断点单例：窗口缩放/旋转/触屏判定都会实时更新，驱动模板与布局重渲染。
// 取代旧的 SysUtils.isMobile()(UA 永久缓存 + 一次性 matchMedia，非响应式)。
// SSR/node(单测) 环境无 window 时退化为桌面默认值，不抛错。
const hasWindow = typeof window !== 'undefined'

const width = ref(hasWindow ? window.innerWidth : 1440)
const coarse = ref(
  hasWindow && window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false
)

if (hasWindow) {
  // 缩放/旋转更新视口宽(passive，不阻塞滚动)
  window.addEventListener('resize', () => { width.value = window.innerWidth }, { passive: true })
  // 指针类型变化(如外接/拔掉触控笔，少见但廉价)
  if (window.matchMedia) {
    const coarseMql = window.matchMedia('(pointer: coarse)')
    coarseMql.addEventListener('change', e => { coarse.value = e.matches })
  }
}

/** 是否移动端布局/交互(视口为主 + 触屏兜底) */
export const isMobile = computed(() => isMobileViewport(width.value, coarse.value))
/** 是否触屏设备(供长按/手势/隐藏快捷键提示等触屏专属决策) */
export const isTouch = computed(() => coarse.value)
/** 视口分档(供三栏↔双栏↔单栏布局判定) */
export const isCompact = computed(() => width.value < MOBILE_MAX)
export const isMedium = computed(() => width.value >= MOBILE_MAX && width.value < DESKTOP_MIN)
export const isFull = computed(() => width.value >= DESKTOP_MIN)
/** 是否大屏宽档(>=WIDE_MIN): 仅供图表换 echarts 配置(cellSize/maxSize 等 CSS 够不到的项); 布局一律走 CSS */
export const isWide = computed(() => width.value >= WIDE_MIN)
/** 是否超宽档(>=ULTRA_MIN): 供"换 DOM"——文档关联内容从右列内联挪到独立第4列 */
export const isUltra = computed(() => width.value >= ULTRA_MIN)
/** 精确视口宽(只读) */
export const viewportWidth = readonly(width)

/** 组合式入口：在 setup() 中使用 */
export function useBreakpoint() {
  return { isMobile, isTouch, isCompact, isMedium, isFull, isWide, isUltra, width: viewportWidth }
}

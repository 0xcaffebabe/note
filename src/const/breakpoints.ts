// 响应式断点数值的唯一真源(JS 侧)。
// CSS 侧的 src/breakpoints.less 必须与此保持同值，由 tests/unit/breakpoint.test.ts 守护。
//
// 收敛历史上散落的 768/820/860/1180/1200/1280/1366：
//  - compact  (<MOBILE_MAX)              单栏 + 底部操作栏 + 抽屉式目录/章节 + 手势
//  - medium   [MOBILE_MAX, DESKTOP_MIN)  双栏(侧栏+正文)，TOC 浮动
//  - full     (>=DESKTOP_MIN)            完整三栏

/** 视口 <= 此值判移动端布局 */
export const MOBILE_MAX = 820
/** 视口 >= 此值为完整三栏 */
export const DESKTOP_MIN = 1280
/** 触屏设备(pointer:coarse)在此宽度内仍判移动端(手机横屏 ~915px 不误切三栏) */
export const COARSE_MAX = 1024

/**
 * 是否采用移动端布局/交互。视口为主 + 触屏兜底：
 * 窄视口一律移动端；触屏设备(手机横屏)在 COARSE_MAX 内也按移动端。
 * 纯函数，供 useBreakpoint 与单测共用(单测在 node 环境无 matchMedia)。
 */
export function isMobileViewport(width: number, coarse: boolean): boolean {
  return width <= MOBILE_MAX || (coarse && width <= COARSE_MAX)
}

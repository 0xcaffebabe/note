type IdleDeadlineLike = {
  timeRemaining(): number
  didTimeout: boolean
}

const requestIdle: (callback: (deadline: IdleDeadlineLike) => void) => void =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? callback => window.requestIdleCallback(callback, { timeout: 200 })
    : callback => setTimeout(() => callback({ timeRemaining: () => 8, didTimeout: true }), 0)

/**
 * 空闲分片执行：把列表处理分散到浏览器空闲时间，避免一次性长任务阻塞主线程
 * 返回取消函数，取消后剩余未处理的项不再执行
 */
export function runInIdleBatches<T>(items: T[], handler: (item: T) => void): () => void {
  let cancelled = false
  let index = 0
  const step = (deadline: IdleDeadlineLike) => {
    while (!cancelled && index < items.length) {
      handler(items[index++])
      if (deadline.timeRemaining() <= 0) {
        break
      }
    }
    if (!cancelled && index < items.length) {
      requestIdle(step)
    }
  }
  if (items.length > 0) {
    requestIdle(step)
  }
  return () => { cancelled = true }
}

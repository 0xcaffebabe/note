/**
 * 自动重连的退避调度器，只恢复认证，不保存或重放业务请求。
 * 手动断开暂停当前页；网络恢复事件仅在仍允许重试时唤醒连接。
 */
export class AiBridgeReconnect {
  private paused = false
  private enabled = false
  private attempt = 0
  private timer?: ReturnType<typeof setTimeout>

  constructor(private readonly reconnect: () => Promise<unknown>) {}

  get allowed(): boolean {
    return !this.paused && this.enabled
  }

  beginPairing(): void {
    this.paused = false
    this.enabled = false
    this.attempt = 0
  }

  beginAuthentication(): void {
    this.paused = false
    this.enabled = true
  }

  authenticated(): void {
    this.attempt = 0
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  clearTimer(): void {
    clearTimeout(this.timer)
    this.timer = undefined
  }

  pause(): void {
    this.paused = true
    this.enabled = false
    this.clearTimer()
  }

  schedule(): void {
    if (!this.allowed || this.timer) {
      return
    }
    const delay = Math.min(30000, 1000 * 2 ** Math.min(this.attempt++, 5))
    this.timer = setTimeout(() => {
      this.timer = undefined
      void this.reconnect().catch(() => {})
    }, delay)
  }
}

import type { AiProvider } from '@/core/domain/ai/AiModel'

/** 可注入的浏览器依赖，供宿主和测试隔离真实网络与生命周期。 */
export type SocketFactory = (url: string) => WebSocket
export type BrowserLifecycle = Pick<Window, 'addEventListener' | 'removeEventListener'>

/** 仅保存本机端口和授权凭证，不允许存储任意连接地址。 */
export interface SavedConnection {
  version: 1
  port: number
  token: string
}

/** 传输层只报告连接事件，认证策略由连接协调器决定。 */
export interface SocketCallbacks {
  onFrame: (frame: Record<string, unknown>) => void
  onFailure: (message: string) => void
  onInvalidFrame: () => void
}

/** 一次握手的上下文；捕获原凭证以识别其他标签页的新授权。 */
export interface AuthenticationAttempt {
  credential?: SavedConnection
  wasRemembered: boolean
  resolve: (providers: AiProvider[]) => void
}

/** 等待桌面端接受确认的请求；超时后不得自动重发。 */
export interface PendingRpc {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

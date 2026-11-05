import type { Provider } from './Provider';

/** 不含密钥和问答正文的运行日志。 */
export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  providerId?: string;
  model?: string;
  durationMs?: number;
}

/** 一次性配对窗口，时间戳单位为毫秒。 */
export interface PairingWindow {
  code: string;
  expiresAt: number;
}

/** 已持久化的网站授权，断开连接后依然保留。 */
export interface SiteAuthorization {
  id: string;
  origin: string;
  createdAt: number;
  lastConnectedAt: number;
  connected: boolean;
}

/** 当前活动的网站 WebSocket 连接。 */
export interface SiteConnection {
  id: string;
  origin: string;
  connectedAt: number;
}

/** 原生桥接服务的只读投影。页面通过刷新快照同步状态。 */
export interface Snapshot {
  running: boolean;
  port: number;
  allowedOrigins: string[];
  providers: Provider[];
  pairing: PairingWindow | null;
  authorizations: SiteAuthorization[];
  connections: SiteConnection[];
  logs: LogEntry[];
}

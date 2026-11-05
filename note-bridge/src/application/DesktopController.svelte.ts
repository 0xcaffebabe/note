import type { Snapshot } from '../core/domain/BridgeSnapshot';
import type { DesktopBridgePort } from '../core/ports/DesktopBridgePort';

/**
 * 桌面管理页的状态与操作协调器。
 *
 * 维护快照轮询、统一的操作互斥和错误反馈。表单初值只取第一次快照，
 * 防止后续轮询覆盖尚未提交的端口或 Origin。组件销毁时须调用 start 的清理函数。
 */
export class DesktopController {
  snapshot = $state<Snapshot | null>(null);
  port = $state(19661);
  origins = $state('');
  busy = $state(false);
  error = $state('');
  notice = $state('');
  available = $state(true);
  now = $state(Date.now());

  private refreshing = false;

  constructor(readonly client: DesktopBridgePort) {}

  get enabledProviderCount(): number {
    return (
      this.snapshot?.providers.filter((provider) => provider.enabled).length ??
      0
    );
  }

  get pairingSecondsRemaining(): number {
    const expiresAt = this.snapshot?.pairing?.expiresAt ?? 0;
    return Math.max(0, Math.ceil((expiresAt - this.now) / 1000));
  }

  /** 启动原生快照同步；浏览器预览只展示不可用状态。 */
  start(): (() => void) | undefined {
    this.available = this.client.isAvailable();
    if (!this.available) {
      return;
    }
    void this.refresh();
    const timer = window.setInterval(() => void this.refresh(), 1000);
    return () => window.clearInterval(timer);
  }

  async refresh(): Promise<void> {
    if (this.refreshing || !this.available) {
      return;
    }
    this.refreshing = true;
    try {
      const next = await this.client.getSnapshot();
      if (!this.snapshot) {
        this.port = next.port;
        this.origins = next.allowedOrigins.join('\n');
      }
      this.snapshot = next;
      this.now = Date.now();
    } catch (cause) {
      this.error = String(cause);
    } finally {
      this.refreshing = false;
    }
  }

  /** 串行执行用户操作；完成后同步快照，失败时保留当前表单供用户修正。 */
  async perform(action: () => Promise<unknown>, success = ''): Promise<void> {
    if (this.busy || !this.available) {
      return;
    }
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await action();
      if (success) {
        this.notice = success;
      }
      await this.refresh();
    } catch (cause) {
      this.error = String(cause);
    } finally {
      this.busy = false;
    }
  }

  toggleServer(): Promise<void> {
    return this.perform(() => {
      if (this.snapshot?.running) {
        return this.client.stop();
      }
      const origins = this.origins
        .split(/\r?\n/)
        .map((origin) => origin.trim())
        .filter(Boolean);
      return this.client.start(this.port, origins);
    });
  }

  openPairing(): Promise<void> {
    return this.perform(() => this.client.openPairing());
  }

  revokeAuthorization(id: string): Promise<void> {
    return this.perform(
      () => this.client.revokeAuthorization(id),
      '网站授权已撤销，再次连接需要重新配对。',
    );
  }

  clearLogs(): Promise<void> {
    return this.perform(() => this.client.clearLogs());
  }

  exportLogs(): Promise<void> {
    return this.perform(async () => {
      const saved = await this.client.saveLogs();
      if (saved) {
        this.notice = `日志已导出到 ${saved}`;
      }
    });
  }
}

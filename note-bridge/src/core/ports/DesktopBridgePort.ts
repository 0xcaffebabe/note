import type { PairingWindow, Snapshot } from '../domain/BridgeSnapshot';
import type {
  DiscoveredProvider,
  DiscoveryPaths,
  ModelOption,
  Provider,
  ProviderInput,
} from '../domain/Provider';

/**
 * 桌面管理界面访问本机服务的端口。
 *
 * 隔离 Tauri 的命令名和序列化参数，使应用状态与表单逻辑无需依赖原生 API。
 * 所有失败均通过 Promise rejection 返回，由调用方统一提供用户反馈。
 */
export interface DesktopBridgePort {
  isAvailable(): boolean;
  getSnapshot(): Promise<Snapshot>;
  start(port: number, origins: string[]): Promise<void>;
  stop(): Promise<void>;
  openPairing(): Promise<PairingWindow>;
  revokeAuthorization(id: string): Promise<void>;
  discoverProviders(paths: DiscoveryPaths): Promise<DiscoveredProvider[]>;
  importProvider(candidateId: string): Promise<Provider>;
  saveProvider(input: ProviderInput): Promise<Provider>;
  removeProvider(id: string): Promise<void>;
  fetchProviderModels(id: string): Promise<ModelOption[]>;
  testProvider(id: string): Promise<void>;
  clearLogs(): Promise<void>;
  saveLogs(): Promise<string | null>;
}

import { invoke, isTauri } from '@tauri-apps/api/core';
import type { DesktopBridgePort } from '../core/ports/DesktopBridgePort';
import type { PairingWindow, Snapshot } from '../core/domain/BridgeSnapshot';
import type {
  DiscoveredProvider,
  DiscoveryPaths,
  ModelOption,
  Provider,
  ProviderInput,
} from '../core/domain/Provider';

/**
 * Tauri 桌面命令适配器。
 *
 * 只负责命令映射和返回类型，不缓存原生状态或保留服务凭据。
 * 浏览器预览通过 isAvailable 降级，避免调用不存在的原生能力。
 */
export class TauriDesktopBridge implements DesktopBridgePort {
  isAvailable(): boolean {
    return isTauri();
  }

  getSnapshot(): Promise<Snapshot> {
    return invoke('get_snapshot');
  }

  start(port: number, origins: string[]): Promise<void> {
    return invoke('start_bridge', { port, origins });
  }

  stop(): Promise<void> {
    return invoke('stop_bridge');
  }

  openPairing(): Promise<PairingWindow> {
    return invoke('open_pairing');
  }

  revokeAuthorization(id: string): Promise<void> {
    return invoke('revoke_authorization', { id });
  }

  discoverProviders(paths: DiscoveryPaths): Promise<DiscoveredProvider[]> {
    return invoke('discover_providers', { paths });
  }

  importProvider(candidateId: string): Promise<Provider> {
    return invoke('import_provider', { candidateId });
  }

  saveProvider(input: ProviderInput): Promise<Provider> {
    return invoke('save_provider', { input });
  }

  removeProvider(id: string): Promise<void> {
    return invoke('remove_provider', { id });
  }

  fetchProviderModels(id: string): Promise<ModelOption[]> {
    return invoke('fetch_provider_models', { id });
  }

  testProvider(id: string): Promise<void> {
    return invoke('test_provider', { id });
  }

  clearLogs(): Promise<void> {
    return invoke('clear_logs');
  }

  saveLogs(): Promise<string | null> {
    return invoke('save_logs');
  }
}

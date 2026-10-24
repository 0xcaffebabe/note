import type { DiscoveredProvider, Provider } from '../core/domain/Provider';
import type { DesktopController } from './DesktopController.svelte';

/** 本机配置扫描与服务列表操作；保留扫描结果，使切换页面不会丢失候选配置。 */
export class ProviderCatalogController {
  claudeDir = $state('');
  codexDir = $state('');
  discovered = $state<DiscoveredProvider[]>([]);
  scanned = $state(false);
  deleteTarget = $state<Provider | null>(null);

  constructor(private readonly desktop: DesktopController) {}

  discover(): Promise<void> {
    return this.desktop.perform(async () => {
      this.discovered = await this.desktop.client.discoverProviders({
        claudeDir: this.claudeDir.trim() || undefined,
        codexDir: this.codexDir.trim() || undefined,
      });
      this.scanned = true;
    });
  }

  importProvider(candidateId: string): Promise<void> {
    return this.desktop.perform(async () => {
      await this.desktop.client.importProvider(candidateId);
      this.discovered = this.discovered.filter(
        (entry) => entry.id !== candidateId,
      );
    }, '配置已导入并启用。');
  }

  toggleProvider(provider: Provider): Promise<void> {
    return this.desktop.perform(() =>
      this.desktop.client.saveProvider({
        ...provider,
        enabled: !provider.enabled,
      }),
    );
  }

  testProvider(provider: Provider): Promise<void> {
    return this.desktop.perform(
      () => this.desktop.client.testProvider(provider.id),
      `${provider.name} 测试成功。`,
    );
  }

  /** 删除成功后关闭确认框；失败时保留目标，便于重试或取消。 */
  removeProvider(): Promise<void> {
    const target = this.deleteTarget;
    if (!target) {
      return Promise.resolve();
    }
    return this.desktop.perform(async () => {
      await this.desktop.client.removeProvider(target.id);
      this.deleteTarget = null;
    }, '模型服务已删除。');
  }
}

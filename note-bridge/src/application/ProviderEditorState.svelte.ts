import type {
  Effort,
  ModelOption,
  Provider,
  ProviderInput,
} from '../core/domain/Provider';
import {
  copyProviderModels,
  MAX_PROVIDER_MODELS,
  newProvider,
  prepareProviderInput,
} from '../core/domain/ProviderDraft';
import type { DesktopController } from './DesktopController.svelte';

/**
 * 服务编辑会话，负责草稿生命周期、模型选择与异步查询结果的归属校验。
 *
 * 编辑只操作复制后的模型。关闭或提交后立即清空凭据；API 查询结果只允许
 * 应用于发起查询时的服务配置，避免修改地址或切换草稿后混入旧模型列表。
 */
export class ProviderEditorState {
  opened = $state(false);
  draft = $state<ProviderInput>(newProvider());
  models = $state<ModelOption[]>([]);
  fetchedModels = $state<ModelOption[]>([]);
  selectedModels = $state<string[]>([]);
  modelSearch = $state('');
  fetchingModels = $state(false);

  private fetched = $state(false);
  private fetchedIdentity = $state('');

  constructor(private readonly desktop: DesktopController) {}

  get canFetchModels(): boolean {
    const saved = this.desktop.snapshot?.providers.find(
      (provider) => provider.id === this.draft.id,
    );
    return (
      !!saved &&
      !this.draft.apiKey?.trim() &&
      this.draft.baseUrl.trim() === saved.baseUrl &&
      this.draft.authKind === saved.authKind &&
      this.draft.protocol === saved.protocol
    );
  }

  private get modelIdentity(): string {
    return JSON.stringify([
      this.draft.id,
      this.draft.baseUrl.trim(),
      this.draft.protocol,
      this.draft.authKind,
      this.draft.apiKey?.trim() ? 'edited' : 'saved',
    ]);
  }

  get validFetched(): boolean {
    return (
      this.fetched &&
      this.fetchedIdentity === this.modelIdentity &&
      this.canFetchModels
    );
  }

  get filteredModels(): ModelOption[] {
    return this.fetchedModels.filter((model) =>
      `${model.name} ${model.id}`
        .toLowerCase()
        .includes(this.modelSearch.toLowerCase()),
    );
  }

  open(provider?: Provider): void {
    this.desktop.error = '';
    this.draft = provider ? { ...provider, apiKey: '' } : newProvider();
    this.models = copyProviderModels(provider);
    this.fetchedModels = [];
    this.selectedModels = [];
    this.modelSearch = '';
    this.fetched = false;
    this.opened = true;
  }

  close(): void {
    this.draft.apiKey = '';
    this.opened = false;
  }

  updateModelId(index: number, id: string): void {
    if (this.draft.model === this.models[index].id) {
      this.draft.model = id;
    }
    this.models[index].id = id;
  }

  addModel(): void {
    if (this.models.length >= MAX_PROVIDER_MODELS) {
      return;
    }
    this.models = [...this.models, { id: '', name: '', efforts: ['default'] }];
  }

  removeModel(index: number): void {
    const removed = this.models[index];
    this.models = this.models.filter((_, position) => position !== index);
    if (this.draft.model === removed.id) {
      this.draft.model = this.models[0]?.id ?? '';
    }
  }

  toggleEffort(index: number, effort: Effort, checked: boolean): void {
    const model = this.models[index];
    model.efforts = checked
      ? [...new Set([...model.efforts, effort])]
      : model.efforts.filter((value) => value !== effort);
    if (model.defaultEffort && !model.efforts.includes(model.defaultEffort)) {
      delete model.defaultEffort;
    }
  }

  async fetchModels(): Promise<void> {
    const providerId = this.draft.id;
    if (!this.canFetchModels || !providerId) {
      return;
    }
    const identity = this.modelIdentity;
    this.fetchingModels = true;
    try {
      await this.desktop.perform(async () => {
        const models =
          await this.desktop.client.fetchProviderModels(providerId);
        if (!this.opened || this.modelIdentity !== identity) {
          return;
        }
        this.fetchedModels = models;
        this.fetchedIdentity = identity;
        this.selectedModels = [];
        this.fetched = true;
      });
    } finally {
      this.fetchingModels = false;
    }
  }

  addSelectedModels(): void {
    if (!this.validFetched) {
      return;
    }
    const existing = new Set(this.models.map((model) => model.id.trim()));
    const additions = this.fetchedModels.filter(
      (model) =>
        this.selectedModels.includes(model.id) && !existing.has(model.id),
    );
    if (this.models.length + additions.length > MAX_PROVIDER_MODELS) {
      this.desktop.error = '每个服务最多配置 200 个模型';
      return;
    }
    this.models = [
      ...this.models,
      ...additions.map((model) => ({ ...model, efforts: [...model.efforts] })),
    ];
    if (!this.draft.model) {
      this.draft.model = this.models[0]?.id ?? '';
    }
    this.selectedModels = [];
  }

  save(): Promise<void> {
    return this.desktop.perform(async () => {
      try {
        const input = prepareProviderInput(this.draft, this.models);
        await this.desktop.client.saveProvider(input);
        this.opened = false;
      } finally {
        this.draft.apiKey = '';
      }
    }, '服务配置已保存。');
  }
}

import type { ModelOption, Provider, ProviderInput } from './Provider';

export const MAX_PROVIDER_MODELS = 200;
export const DEFAULT_CONTEXT_TOKENS = 1_000_000;
export const DEFAULT_OUTPUT_TOKENS = 16_384;

/** 创建未保存服务的编辑初值；不会复用或复制其他服务的凭据。 */
export function newProvider(): ProviderInput {
  return {
    name: '',
    protocol: 'anthropic',
    baseUrl: '',
    model: '',
    authKind: 'apiKey',
    enabled: true,
    apiKey: '',
  };
}

/** 将已保存模型复制到草稿，避免编辑过程影响后台快照。 */
export function copyProviderModels(provider?: Provider): ModelOption[] {
  if (provider?.models?.length) {
    return provider.models.map((model) => ({
      ...model,
      efforts: [...model.efforts],
    }));
  }
  if (!provider) {
    return [];
  }
  return [
    {
      id: provider.model,
      name: provider.model,
      efforts: ['default', 'low', 'medium', 'high'],
    },
  ];
}

/** 按 UTF-8 字节限制生成默认名称，与原生配置校验的 120 字节上限一致。 */
function fallbackModelName(id: string): string {
  let result = '';
  const encoder = new TextEncoder();
  for (const character of id) {
    if (encoder.encode(result + character).length > 120) {
      break;
    }
    result += character;
  }
  return result;
}

/** 小窗口模型的默认输出不超过窗口的一半。 */
export function defaultOutputTokens(model: ModelOption): number {
  const context = model.contextWindowTokens ?? DEFAULT_CONTEXT_TOKENS;
  return Math.min(DEFAULT_OUTPUT_TOKENS, Math.floor(context / 2));
}

/** 返回可直接展示的预算错误；空字符串表示预算满足本机运行约束。 */
export function modelBudgetError(model: ModelOption): string {
  const context = model.contextWindowTokens ?? DEFAULT_CONTEXT_TOKENS;
  const output = model.maxOutputTokens ?? defaultOutputTokens(model);
  if (!Number.isInteger(context) || context < 16_384 || context > 2_000_000) {
    return '上下文预算须为 16,384 至 2,000,000 tokens 的整数';
  }
  if (!Number.isInteger(output) || output < 256 || output > 65_536) {
    return '输出预算须为 256 至 65,536 tokens 的整数';
  }
  if (output > Math.floor(context / 2)) {
    return '输出预算不能超过上下文预算的一半，请调低输出或调高上下文预算';
  }
  return '';
}

/**
 * 构建一次保存命令，集中校验模型列表并补齐默认模型。
 *
 * 不填凭据表示保留本机密钥，none 表示由原生层清除已有密钥。
 * 调用方无论保存成功与否，都必须在 finally 中清理原始草稿的凭据。
 */
export function prepareProviderInput(
  draft: ProviderInput,
  draftModels: ModelOption[],
): ProviderInput {
  const models = draftModels.map((model) => ({
    ...model,
    id: model.id.trim(),
    name: model.name.trim() || fallbackModelName(model.id.trim()),
  }));
  if (
    models.some((model) => !model.id) ||
    new Set(models.map((model) => model.id)).size !== models.length
  ) {
    throw new Error('模型标识不能为空或重复');
  }
  if (!models.some((model) => model.id === draft.model.trim())) {
    models.unshift({
      id: draft.model.trim(),
      name: fallbackModelName(draft.model.trim()),
      efforts: ['default'],
    });
  }
  if (models.length > MAX_PROVIDER_MODELS) {
    throw new Error('每个服务最多配置 200 个模型');
  }
  for (const [index, model] of models.entries()) {
    const budgetError = modelBudgetError(model);
    if (budgetError) {
      throw new Error(`模型 ${index + 1}：${budgetError}`);
    }
  }
  return {
    ...draft,
    name: draft.name.trim(),
    baseUrl: draft.baseUrl.trim(),
    model: draft.model.trim(),
    models,
    apiKey:
      draft.authKind === 'none' || !draft.apiKey?.trim()
        ? undefined
        : draft.apiKey,
  };
}

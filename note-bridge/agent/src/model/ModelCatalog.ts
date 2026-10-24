import { AgentError } from '../domain/AgentError.js';
import type { RuntimeProvider, ModelOption, Effort } from '../domain/Model.js';

/** 使用原生配置的模型目录；不读取环境变量、磁盘凭据或推断官方 provider。 */
export function modelOptions(p: RuntimeProvider): ModelOption[] {
  return p.models?.length
    ? p.models
    : [
        {
          id: p.model,
          name: p.model,
          efforts: ['default', 'low', 'medium', 'high'],
        },
      ];
}

/** 同时校验模型、effort 与凭据可用性；错误码可直接返回站点客户端。 */
export function selectedModel(
  providers: RuntimeProvider[],
  id: string,
  model: string,
  effort: Effort,
): {
  provider: RuntimeProvider;
  option: ModelOption;
} {
  const provider = providers.find((p) => p.enabled && p.id === id);
  const option = provider && modelOptions(provider).find((m) => m.id === model);
  if (!provider || !option) {
    throw new AgentError(
      'model_unavailable',
      '所选模型不可用，请检查 Note Bridge 模型配置',
    );
  }
  if (effort !== 'default' && !option.efforts?.includes(effort)) {
    throw new AgentError('unsupported_effort', '此模型未配置所选 effort');
  }
  if (
    provider.protocol === 'anthropic' &&
    ['minimal', 'ultra'].includes(effort)
  ) {
    throw new AgentError(
      'unsupported_effort',
      'Anthropic 协议不支持此 effort；请在模型设置中选择 low/medium/high/xhigh/max',
    );
  }
  if (provider.authKind !== 'none' && !provider.secret) {
    throw new AgentError('credential_unavailable', '此服务的凭据不可用');
  }
  return { provider, option };
}

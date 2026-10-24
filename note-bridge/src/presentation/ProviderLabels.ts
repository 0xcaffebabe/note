import type { Effort } from '../core/domain/Provider';

export const protocolNames = {
  anthropic: 'Anthropic Messages',
  responses: 'OpenAI Responses',
  chatCompletions: 'OpenAI Chat Completions',
};

export const statusNames = {
  ready: '可导入',
  missingCredential: '缺少凭据',
  unsupported: '暂不支持',
  invalid: '配置无效',
};

export const effortNames: Record<Effort, string> = {
  default: '默认',
  none: '无',
  minimal: '最少',
  low: '低',
  medium: '中',
  high: '高',
  xhigh: '很高',
  max: '最大',
  ultra: '超高',
};

export const explicitEfforts = Object.keys(effortNames).filter(
  (value) => value !== 'default',
) as Effort[];

/** 模型服务支持的 HTTP 协议；与 bridge-core 的序列化值保持一致。 */
export type Protocol = 'anthropic' | 'responses' | 'chatCompletions';

/** 本机 API 凭据的认证方式。none 同时用于明确清除已保存凭据。 */
export type AuthKind = 'apiKey' | 'bearer' | 'none';

/** 服务明确声明支持的推理强度；default 表示采用服务默认行为。 */
export type Effort =
  | 'default'
  | 'none'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'max'
  | 'ultra';

/** 网站可选模型及其能力声明。预算留空时由 bridge 采用自适应默认值。 */
export interface ModelOption {
  id: string;
  name: string;
  efforts: Effort[];
  defaultEffort?: Effort;
  contextWindowTokens?: number;
  maxOutputTokens?: number;
}

/** 可安全展示的模型服务配置，不包含凭据。 */
export interface Provider {
  id: string;
  name: string;
  protocol: Protocol;
  baseUrl: string;
  model: string;
  models?: ModelOption[];
  authKind: AuthKind;
  enabled: boolean;
  source?: string;
}

/** 保存命令的输入。apiKey 只在提交时存在，省略表示保留已有凭据。 */
export interface ProviderInput extends Omit<Provider, 'id'> {
  id?: string;
  apiKey?: string;
}

/** 本机 CLI 扫描结果；凭据只由原生层保存，页面通过候选 ID 请求导入。 */
export interface DiscoveredProvider {
  id: string;
  name: string;
  protocol: Protocol;
  baseUrl: string;
  model: string;
  models?: ModelOption[];
  authKind: AuthKind;
  source: string;
  status: 'ready' | 'missingCredential' | 'unsupported' | 'invalid';
  message: string;
}

/** 用户可选的 CLI 配置目录；省略时遵循各 CLI 的默认目录规则。 */
export interface DiscoveryPaths {
  claudeDir?: string;
  codexDir?: string;
}

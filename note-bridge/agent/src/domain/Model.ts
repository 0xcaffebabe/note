/** 用户指定的推理强度；default 表示省略上游请求中的 effort 字段。 */
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

/** 原生配置允许的模型及其能力预算；第三方服务可覆盖默认上下文和输出上限。 */
export type ModelOption = {
  id: string;
  name: string;
  efforts?: Effort[];
  defaultEffort?: Effort;
  contextWindowTokens?: number;
  maxOutputTokens?: number;
};

/** 原生宿主注入的模型配置。secret 仅驻留内存，不进入 Pi 文档或客户端投影。 */
export type RuntimeProvider = {
  id: string;
  name: string;
  protocol: 'anthropic' | 'responses' | 'chatCompletions';
  baseUrl: string;
  model: string;
  models?: ModelOption[];
  authKind: 'apiKey' | 'bearer' | 'none';
  enabled: boolean;
  secret?: string;
};

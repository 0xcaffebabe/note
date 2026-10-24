import type { Api, Model } from '@earendil-works/pi-ai';
import type { Effort } from '../domain/Model.js';

/** 一次模型请求的预算凭证。check 必须在真正发送 HTTP 前调用，release 在所有退出路径执行。 */
export type RequestPermit = {
  effort: Effort;
  final: boolean;
  signal: AbortSignal;
  check: () => Promise<void>;
  release: () => void;
};

/** Pi 在 generation/compaction 请求前调用的授权与预算端口。 */
export type ModelGuard = (
  sessionId: string | undefined,
  model: Model<Api>,
  kind: 'generation' | 'compaction',
) => Promise<RequestPermit>;

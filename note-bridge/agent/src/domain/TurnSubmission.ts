import type { Effort } from './Model.js';

/** 用户选择的站点附件；contentHash 用于拒绝已发布更新的过期选择。 */
export type AttachmentSelection = {
  docId: string;
  headingIds?: string[];
  contentHash?: string;
};

/** 已规范化的提问；hash 覆盖内容与模型选择，保持 clientRequestId 的幂等语义。 */
export type TurnSubmission = {
  requestId: string;
  hash: string;
  text: string;
  providerId: string;
  model: string;
  effort: Effort;
  attachments: AttachmentSelection[];
};

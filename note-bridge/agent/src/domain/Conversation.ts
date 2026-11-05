import type { Effort } from './Model.js';

/** 被工具实际读取的证据标识；结束回合会冻结发布版本和内容散列。 */
export type Citation = {
  sourceId: string;
  title: string;
  url: string;
  contentHash?: string;
  revision?: string;
};

/** 面向用户的工具概览；投影阶段裁剪文本，不影响 Pi 保存的原始结果。 */
export type Overview = {
  input: {
    label: string;
    value: string;
  }[];
  summary?: string;
  items?: string[];
  note?: string;
};

/** 客户端工具调用状态，callId 对应 Pi 的原始工具请求。 */
export type ToolCallRecord = {
  callId: string;
  name: string;
  status: 'running' | 'complete' | 'error';
  message?: string;
  overview?: Overview;
};

/** v2 会话目录投影；revision 是 Pi 提交序号，用于丢弃过期快照。 */
export type SessionSummary = {
  id: string;
  title: string;
  providerId: string;
  model: string;
  effort: Effort;
  createdAt: number;
  updatedAt: number;
  status: 'idle' | 'running' | 'error';
  revision: number;
};

/** v2 回合投影；浏览器重连读取此快照，不重新发送原始问题。 */
export type ChatTurn = {
  id: string;
  question: string;
  answer: string;
  status: 'running' | 'complete' | 'cancelled' | 'error';
  sources: Citation[];
  toolCalls: ToolCallRecord[];
  error?: string;
  contextNotice?: string;
  createdAt: number;
};

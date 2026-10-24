/** 单轮执行和 IPC 的资源预算。测试可注入覆盖值；默认值保持 v2 协议约定。 */
export const LIMITS = {
  questionChars: 20000,
  answerChars: 200000,
  tools: 128,
  rounds: 32,
  deadlineMs: 20 * 60000,
  toolTimeoutMs: 60000,
  requestTimeoutMs: 180000,
  inputBytes: 16 * 1024 * 1024,
  outputBytes: 2 * 1024 * 1024,
  responseBytes: 64 * 1024 * 1024,
  ipcBytes: 16 * 1024 * 1024,
};

export type AgentLimits = typeof LIMITS;

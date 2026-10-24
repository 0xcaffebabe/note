export type Effort =
  | "default"
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max"
  | "ultra";
export type ModelOption = {
  id: string;
  name: string;
  efforts?: Effort[];
  defaultEffort?: Effort;
  contextWindowTokens?: number;
  maxOutputTokens?: number;
};
export type RuntimeProvider = {
  id: string;
  name: string;
  protocol: "anthropic" | "responses" | "chatCompletions";
  baseUrl: string;
  model: string;
  models?: ModelOption[];
  authKind: "apiKey" | "bearer" | "none";
  enabled: boolean;
  secret?: string;
};
export type Authorization = { id: string; origin: string };
export type Citation = {
  sourceId: string;
  title: string;
  url: string;
  contentHash?: string;
  revision?: string;
};
export type Overview = {
  input: { label: string; value: string }[];
  summary?: string;
  items?: string[];
  note?: string;
};
export type ToolCallRecord = {
  callId: string;
  name: string;
  status: "running" | "complete" | "error";
  message?: string;
  overview?: Overview;
};
export type SessionSummary = {
  id: string;
  title: string;
  providerId: string;
  model: string;
  effort: Effort;
  createdAt: number;
  updatedAt: number;
  status: "idle" | "running" | "error";
  revision: number;
};
export type ChatTurn = {
  id: string;
  question: string;
  answer: string;
  status: "running" | "complete" | "cancelled" | "error";
  sources: Citation[];
  toolCalls: ToolCallRecord[];
  error?: string;
  contextNotice?: string;
  createdAt: number;
};
export type RpcContext = {
  connectionId: string;
  authorizationId: string;
  origin: string;
};
export type Push = {
  event: "session.updated" | "sessions.changed";
  connectionId: string;
  data: Record<string, unknown>;
};
export class AgentError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AgentError";
  }
}
export const LIMITS = {
  questionChars: 20_000,
  answerChars: 200_000,
  tools: 128,
  rounds: 32,
  deadlineMs: 20 * 60_000,
  toolTimeoutMs: 60_000,
  requestTimeoutMs: 180_000,
  inputBytes: 16 * 1024 * 1024,
  outputBytes: 2 * 1024 * 1024,
  responseBytes: 64 * 1024 * 1024,
  ipcBytes: 16 * 1024 * 1024,
};

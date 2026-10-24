import { AgentRuntime } from "./runtime.js";
import { KnowledgeError } from "./knowledge.js";
import {
  AgentError,
  LIMITS,
  type RuntimeProvider,
  type Authorization,
  type RpcContext,
} from "./types.js";

// Private JSONL only. Lifecycle operations are ordered; configuration and cancellation
// never wait for a remote knowledge fetch performed by an ordinary browser request.
type Envelope = {
  id?: unknown;
  method: string;
  params?: Record<string, unknown>;
};
let runtime: AgentRuntime | undefined;
let input = Buffer.alloc(0),
  initializing: Promise<void> | undefined,
  ending = false;
let active = 0,
  priorityActive = 0,
  queuedBytes = 0;
const regular: { message: Envelope; bytes: number }[] = [];
const priority: Envelope[] = [];
const inflight = new Set<Promise<void>>();
const latestPushes = new Map<string, string>();
let pushBytes = 0;
const MAX_BUFFER_BYTES = 32 * 1024 * 1024;

function failPipe() {
  if (ending) return;
  ending = true;
  process.stderr.write("Agent IPC buffer exceeded its bound\n");
  process.stdin.destroy();
  // Exit preserves Pi's already-committed checkpoints, recovered by the next worker.
  process.exit(1);
}
function writeLine(line: string) {
  if (
    process.stdout.writableLength + Buffer.byteLength(line) >
    MAX_BUFFER_BYTES
  ) {
    failPipe();
    return;
  }
  process.stdout.write(line);
}
function output(value: unknown) {
  const line = JSON.stringify(value) + "\n";
  if (Buffer.byteLength(line) > LIMITS.ipcBytes)
    throw new AgentError("response_limit", "IPC 响应超过上限");
  const event = value as {
    event?: string;
    connectionId?: string;
    data?: { sessionId?: string };
  };
  if (event.event && process.stdout.writableNeedDrain) {
    const key = `${event.connectionId}:${event.event}:${event.data?.sessionId ?? ""}`;
    pushBytes -= Buffer.byteLength(latestPushes.get(key) ?? "");
    latestPushes.set(key, line);
    pushBytes += Buffer.byteLength(line);
    if (pushBytes > MAX_BUFFER_BYTES) failPipe();
    return;
  }
  writeLine(line);
}
process.stdout.on("drain", () => {
  for (const [key, line] of latestPushes) {
    latestPushes.delete(key);
    pushBytes -= Buffer.byteLength(line);
    writeLine(line);
    if (process.stdout.writableNeedDrain) break;
  }
});
function errorReply(message: Envelope, code: string, text: string) {
  output({ id: message.id, error: { code, message: text } });
}
async function dispatch(message: Envelope) {
  try {
    const params = message.params ?? {};
    let result: unknown;
    switch (message.method) {
      case "initialize":
        if (runtime)
          throw new AgentError("already_initialized", "Agent 已初始化");
        if (
          typeof params.dataDir !== "string" ||
          !Array.isArray(params.providers) ||
          !Array.isArray(params.authorizations)
        )
          throw new AgentError("invalid_request", "初始化参数无效");
        runtime = await AgentRuntime.open({
          dataDir: params.dataDir,
          providers: params.providers as RuntimeProvider[],
          authorizations: params.authorizations as Authorization[],
          emit: output,
        });
        result = { ready: true, version: 2 };
        break;
      case "configure":
        if (!runtime)
          throw new AgentError("not_initialized", "Agent 尚未初始化");
        result = await runtime.configure(
          params.providers as RuntimeProvider[],
          params.authorizations as Authorization[],
        );
        break;
      case "request": {
        if (!runtime)
          throw new AgentError("not_initialized", "Agent 尚未初始化");
        const request = params.request as {
          method: string;
          params?: Record<string, unknown>;
        };
        result = await runtime.request(
          params as unknown as RpcContext,
          request.method,
          request.params,
        );
        break;
      }
      case "detach":
        result = runtime?.detach(String(params.connectionId)) ?? { ok: true };
        break;
      case "shutdown":
        await runtime?.close();
        result = { ok: true };
        break;
      default:
        throw new AgentError("unknown_method", "未知 IPC 方法");
    }
    output({ id: message.id, result });
  } catch (error) {
    output({
      id: message.id,
      error: {
        code:
          error instanceof AgentError || error instanceof KnowledgeError
            ? error.code
            : "agent_error",
        message:
          error instanceof AgentError || error instanceof KnowledgeError
            ? error.message
            : "Agent 操作失败，请检查配置或重启 Note Bridge",
      },
    });
  }
}
function launch(message: Envelope, urgent: boolean) {
  if (urgent) priorityActive++;
  else active++;
  const task = dispatch(message).finally(() => {
    inflight.delete(task);
    if (urgent) priorityActive--;
    else active--;
    pump();
  });
  inflight.add(task);
}
function pump() {
  if (initializing || ending) return;
  // One configuration/cancel lane preserves configuration order while ordinary
  // requests have a separate bounded concurrency pool.
  if (priorityActive === 0 && priority.length) launch(priority.shift()!, true);
  while (active < 8 && regular.length) {
    const next = regular.shift()!;
    queuedBytes -= next.bytes;
    launch(next.message, false);
  }
}
function removeQueued(
  predicate: (message: Envelope) => boolean,
  reason: string,
) {
  for (let i = regular.length - 1; i >= 0; i--)
    if (predicate(regular[i]!.message)) {
      const [entry] = regular.splice(i, 1);
      queuedBytes -= entry!.bytes;
      errorReply(entry!.message, "cancelled", reason);
    }
}
function accept(message: Envelope, bytes: number) {
  if (ending) {
    errorReply(message, "runtime_unavailable", "Agent 正在关闭");
    return;
  }
  if (message.method === "initialize") {
    if (initializing || runtime) {
      errorReply(message, "already_initialized", "Agent 已初始化");
      return;
    }
    initializing = dispatch(message).finally(() => {
      initializing = undefined;
      if (ending) void runtime?.close();
      else pump();
    });
    return;
  }
  if (message.method === "shutdown") {
    ending = true;
    removeQueued(() => true, "Agent 正在关闭");
    for (const queued of priority.splice(0))
      errorReply(queued, "runtime_unavailable", "Agent 正在关闭");
    void (async () => {
      await initializing;
      await runtime?.close();
      await Promise.allSettled([...inflight]);
      await dispatch(message);
      process.stdin.destroy();
    })();
    return;
  }
  const request = message.params?.request as
    | { method?: string; params?: { sessionId?: string } }
    | undefined;
  if (message.method === "detach") {
    const connectionId = message.params?.connectionId;
    removeQueued(
      (item) =>
        item.method === "request" && item.params?.connectionId === connectionId,
      "浏览器已断开",
    );
  }
  if (request?.method === "runs.cancel") {
    const sessionId = request.params?.sessionId;
    const origin = message.params?.origin;
    removeQueued(
      (item) =>
        typeof origin === "string" &&
        item.params?.origin === origin &&
        item.method === "request" &&
        (item.params?.request as typeof request)?.method === "messages.send" &&
        (item.params?.request as typeof request)?.params?.sessionId ===
          sessionId,
      "回答已停止",
    );
  }
  const urgent =
    message.method === "configure" ||
    message.method === "detach" ||
    request?.method === "runs.cancel";
  if (urgent) {
    if (priority.length >= 64) {
      errorReply(message, "capacity", "控制请求过多");
      return;
    }
    priority.push(message);
  } else {
    if (regular.length >= 64 || queuedBytes + bytes > LIMITS.ipcBytes) {
      errorReply(message, "capacity", "Agent 请求队列已满");
      return;
    }
    regular.push({ message, bytes });
    queuedBytes += bytes;
  }
  pump();
}
process.stdin.on("data", (chunk: Buffer) => {
  input = Buffer.concat([input, chunk]);
  for (;;) {
    const end = input.indexOf(10);
    if (end < 0) break;
    const line = input.subarray(0, end);
    input = input.subarray(end + 1);
    if (!line.length) continue;
    if (line.byteLength > LIMITS.ipcBytes) {
      output({ error: { code: "request_limit", message: "IPC 请求超过上限" } });
      continue;
    }
    try {
      const message = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(line),
      );
      if (
        !message ||
        typeof message !== "object" ||
        typeof message.method !== "string"
      )
        throw new Error();
      accept(message, line.byteLength);
    } catch {
      output({ error: { code: "invalid_json", message: "IPC JSON 无效" } });
    }
  }
  if (input.byteLength > LIMITS.ipcBytes) failPipe();
});
process.stdin.on("end", () => {
  ending = true;
  void runtime?.close();
});
process.on("SIGTERM", () => {
  ending = true;
  void runtime?.close().finally(() => process.exit(0));
});

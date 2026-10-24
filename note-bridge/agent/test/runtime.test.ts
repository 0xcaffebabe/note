import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { AgentRuntime } from "../src/runtime.js";
import {
  AUTH,
  ORIGIN,
  provider,
  mockFetch,
  answer,
  toolAnswer,
  sse,
} from "./fixtures.js";
import type { ChatTurn, SessionSummary } from "../src/types.js";
async function dir() {
  return mkdtemp(join(tmpdir(), "note-agent-test-"));
}
async function session(runtime: AgentRuntime) {
  return (await runtime.request(AUTH, "sessions.create", {
    providerId: "custom",
    model: "custom-model",
  })) as SessionSummary;
}
async function send(
  runtime: AgentRuntime,
  id: string,
  request = "request-1",
  extra = {},
) {
  return runtime.request(AUTH, "messages.send", {
    sessionId: id,
    clientRequestId: request,
    text: "Find evidence in the knowledge base",
    providerId: "custom",
    model: "custom-model",
    ...extra,
  });
}
async function settled(runtime: AgentRuntime, id: string) {
  for (let i = 0; i < 100; i++) {
    const result = (await runtime.request(AUTH, "sessions.get", {
      sessionId: id,
    })) as { turns: ChatTurn[] };
    if (result.turns.at(-1)?.status !== "running") return result;
    await delay(20);
  }
  throw new Error("Timed out waiting for answer");
}
for (const protocol of ["chatCompletions", "responses", "anthropic"] as const)
  test(`${protocol}: Pi + SQLite, default effort omitted, no auth headers, persisted restart`, async () => {
    const dataDir = await dir();
    const requests: Record<string, any>[] = [];
    const fetch = mockFetch(({ body, headers }) => {
      requests.push(body);
      assert.equal(headers.has("authorization"), false);
      assert.equal(headers.has("x-api-key"), false);
      assert.equal(body.reasoning, undefined);
      assert.equal(body.reasoning_effort, undefined);
      assert.equal(body.thinking, undefined);
      assert.equal(body.output_config, undefined);
      return answer(protocol);
    });
    let runtime = await AgentRuntime.open({
      dataDir,
      providers: [provider(protocol)],
      authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
      fetch,
    });
    try {
      const created = await session(runtime);
      const ids = await send(runtime, created.id);
      const result = await settled(runtime, created.id);
      assert.equal(result.turns[0]?.status, "complete", JSON.stringify(result));
      assert.match(result.turns[0]!.answer, /Answered/);
      assert.equal(requests.length, 1);
      await runtime.close();
      runtime = await AgentRuntime.open({
        dataDir,
        providers: [provider(protocol)],
        authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
        fetch,
      });
      assert.deepEqual(await send(runtime, created.id), ids);
      assert.equal(requests.length, 1);
      const restored = await settled(runtime, created.id);
      assert.equal(restored.turns[0]!.answer, result.turns[0]!.answer);
      await assert.rejects(
        () =>
          send(runtime, created.id, "request-1", { text: "Different text" }),
        /相同请求 ID/,
      );
      await assert.rejects(
        () =>
          runtime.request(
            { ...AUTH, origin: "https://foreign.test" },
            "sessions.get",
            { sessionId: created.id },
          ),
        /授权/,
      );
    } finally {
      await runtime.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  });
test("tool output, overview, citations and user input persist; browser detach does not cancel", async () => {
  const dataDir = await dir();
  let calls = 0;
  const fetch = mockFetch(() =>
    calls++ === 0
      ? toolAnswer()
      : answer("chatCompletions", "See [Example](#source:test)."),
  );
  let runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    runtime.detach(AUTH.connectionId);
    const result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.status, "complete", JSON.stringify(result));
    assert.equal(calls, 2);
    assert.equal(result.turns[0]!.toolCalls.length, 1);
    assert.equal(result.turns[0]!.toolCalls[0]!.status, "complete");
    assert.match(result.turns[0]!.toolCalls[0]!.overview!.summary!, /读取/);
    assert.equal(
      result.turns[0]!.sources[0]!.contentHash?.startsWith("sha256:"),
      true,
    );
    assert.equal(
      result.turns[0]!.question,
      "Find evidence in the knowledge base",
    );
    await runtime.close();
    runtime = await AgentRuntime.open({
      dataDir,
      providers: [provider()],
      authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
      fetch,
    });
    assert.deepEqual((await settled(runtime, created.id)).turns, result.turns);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});
test("32+1 policy uses Pi loop and final tool_choice:none; tools remain read-only", async () => {
  const dataDir = await dir();
  let calls = 0;
  const fetch = mockFetch(({ body }) => {
    calls++;
    return body.tool_choice === "none"
      ? answer("chatCompletions", "Final synthesis")
      : toolAnswer(calls);
  });
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
    limits: { rounds: 2, tools: 128 },
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    const result = await settled(runtime, created.id);
    assert.equal(calls, 3);
    assert.equal(result.turns[0]!.toolCalls.length, 2);
    assert.equal(result.turns[0]!.answer, "Final synthesis");
    assert.match(result.turns[0]!.contextNotice!, /预算/);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});
test("explicit cancellation persists and credentials are absent from SQLite", async () => {
  const dataDir = await dir();
  let started = false;
  const fetch = mockFetch(({ headers, signal }) => {
    assert.equal(
      headers.get("authorization"),
      "Bearer test-memory-only-secret",
    );
    started = true;
    return new Promise<Response>((_resolve, reject) => {
      signal!.addEventListener("abort", () => reject(new Error("aborted")), {
        once: true,
      });
    });
  });
  let runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider("chatCompletions", "bearer")],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    while (!started) await delay(10);
    await runtime.request(AUTH, "runs.cancel", { sessionId: created.id });
    const result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.status, "cancelled");
    await runtime.close();
    const bytes = await readFile(join(dataDir, "agent-v2.sqlite"));
    assert.equal(bytes.includes(Buffer.from("test-memory-only-secret")), false);
    runtime = await AgentRuntime.open({
      dataDir,
      providers: [provider("chatCompletions", "bearer")],
      authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
      fetch,
    });
    assert.equal(
      (await settled(runtime, created.id)).turns[0]!.status,
      "cancelled",
    );
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("committed streaming updates are emitted before completion and survive page detachment", async () => {
  const dataDir = await dir();
  const pushes: import("../src/types.js").Push[] = [];
  let release!: () => void;
  const wait = new Promise<void>((resolve) => (release = resolve));
  const fetch = mockFetch(
    () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                "data: " +
                  JSON.stringify({
                    id: "a1",
                    object: "chat.completion.chunk",
                    choices: [
                      {
                        index: 0,
                        delta: { role: "assistant", content: "Partial answer" },
                        finish_reason: null,
                      },
                    ],
                  }) +
                  "\n\n",
              ),
            );
            void wait.then(() => {
              controller.enqueue(
                new TextEncoder().encode(
                  "data: " +
                    JSON.stringify({
                      id: "a1",
                      object: "chat.completion.chunk",
                      choices: [
                        {
                          index: 0,
                          delta: { content: " completed" },
                          finish_reason: "stop",
                        },
                      ],
                    }) +
                    "\n\ndata: [DONE]\n\n",
                ),
              );
              controller.close();
            });
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      ),
  );
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
    emit: (p) => pushes.push(p),
  });
  try {
    const created = await session(runtime);
    await runtime.request(AUTH, "session.subscribe", { sessionId: created.id });
    await send(runtime, created.id);
    for (
      let i = 0;
      i < 100 &&
      !pushes.some(
        (p) =>
          (p.data.turn as ChatTurn | undefined)?.answer === "Partial answer",
      );
      i++
    )
      await delay(10);
    assert.ok(
      pushes.some(
        (p) =>
          (p.data.turn as ChatTurn | undefined)?.answer === "Partial answer",
      ),
    );
    runtime.detach(AUTH.connectionId);
    release();
    assert.equal(
      (await settled(runtime, created.id)).turns[0]!.answer,
      "Partial answer completed",
    );
  } finally {
    release();
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("interrupted worker resumes durable submission, retains history and original request identity", async () => {
  const dataDir = await dir();
  let started = false,
    calls = 0;
  const fetch = mockFetch(({ signal }) => {
    calls++;
    if (calls > 1) return answer("chatCompletions", "Recovered after restart");
    started = true;
    return new Promise<Response>((_resolve, reject) =>
      signal!.addEventListener(
        "abort",
        () => reject(new Error("interrupted")),
        { once: true },
      ),
    );
  });
  let runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
  });
  try {
    const created = await session(runtime);
    const ids = await send(runtime, created.id);
    while (!started) await delay(5);
    await runtime.close();
    runtime = await AgentRuntime.open({
      dataDir,
      providers: [provider()],
      authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
      fetch,
    });
    const result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.status, "complete", JSON.stringify(result));
    assert.equal(result.turns[0]!.answer, "Recovered after restart");
    assert.deepEqual(await send(runtime, created.id), ids);
    assert.equal(calls, 2);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("full 20k questions, attachments, persisted pagination, origin isolation, archival", async () => {
  const dataDir = await dir();
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [
      { id: AUTH.authorizationId, origin: ORIGIN },
      { id: "other-grant", origin: "https://other.test" },
    ],
    fetch: mockFetch(() => answer("chatCompletions")),
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id, "long", {
      text: "长".repeat(20_000),
      attachments: [{ docId: "guide-example", headingIds: ["intro"] }],
    });
    let result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.question.length, 20_000);
    assert.equal(result.turns[0]!.sources.length, 1);
    await send(runtime, created.id, "second");
    await settled(runtime, created.id);
    const last = (await runtime.request(AUTH, "sessions.get", {
      sessionId: created.id,
      limit: 1,
    })) as { turns: ChatTurn[]; nextCursor: string };
    assert.equal(last.turns.length, 1);
    const earlier = (await runtime.request(AUTH, "sessions.get", {
      sessionId: created.id,
      limit: 1,
      cursor: last.nextCursor,
    })) as { turns: ChatTurn[] };
    assert.equal(earlier.turns[0]!.question.length, 20_000);
    await assert.rejects(
      () =>
        runtime.request(
          {
            ...AUTH,
            authorizationId: "other-grant",
            origin: "https://other.test",
          },
          "sessions.get",
          { sessionId: created.id },
        ),
      /不存在/,
    );
    await runtime.request(AUTH, "sessions.archive", { sessionId: created.id });
    await assert.rejects(
      () => runtime.request(AUTH, "sessions.get", { sessionId: created.id }),
      /不存在/,
    );
    const listed = (await runtime.request(AUTH, "sessions.list", {})) as {
      sessions: unknown[];
    };
    assert.equal(listed.sessions.length, 0);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("hard deadline stops a running provider and remains terminal on reopen", async () => {
  const dataDir = await dir();
  const fetch = mockFetch(
    ({ signal }) =>
      new Promise<Response>((_resolve, reject) =>
        signal!.addEventListener("abort", () => reject(new Error("deadline")), {
          once: true,
        }),
      ),
  );
  let runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
    limits: { deadlineMs: 80 },
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    const result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.status, "error");
    assert.match(result.turns[0]!.error!, /时限/);
    await runtime.close();
    runtime = await AgentRuntime.open({
      dataDir,
      providers: [provider()],
      authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
      fetch,
    });
    assert.equal(
      (await settled(runtime, created.id)).turns[0]!.status,
      "error",
    );
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("tool limit triggers one final synthesis; a disobedient final tool cannot execute", async () => {
  const dataDir = await dir();
  let calls = 0,
    docReads = 0;
  const base = mockFetch(() => {
    calls++;
    return toolAnswer(calls);
  });
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/ai/objects/")) docReads++;
    return base(input, init);
  };
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
    limits: { tools: 1, rounds: 32 },
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    const result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.status, "error");
    assert.equal(calls, 2);
    assert.equal(docReads, 2);
    assert.equal(
      result.turns[0]!.toolCalls.filter((t) => t.status === "complete").length,
      1,
    );
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("provider revocation aborts already running calls and rejects further access", async () => {
  const dataDir = await dir();
  let started = false;
  const fetch = mockFetch(({ signal }) => {
    started = true;
    return new Promise<Response>((_resolve, reject) =>
      signal!.addEventListener("abort", () => reject(new Error("revoked")), {
        once: true,
      }),
    );
  });
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    while (!started) await delay(5);
    await runtime.configure([provider()], []);
    await assert.rejects(
      () => runtime.request(AUTH, "sessions.get", { sessionId: created.id }),
      /授权/,
    );
    await runtime.configure(
      [provider()],
      [{ id: AUTH.authorizationId, origin: ORIGIN }],
    );
    assert.equal(
      (await settled(runtime, created.id)).turns[0]!.status,
      "error",
    );
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

for (const protocol of ["responses", "chatCompletions", "anthropic"] as const)
  test(`${protocol}: configured effort and auth use only in-memory credentials`, async () => {
    const dataDir = await dir();
    const p = provider(protocol, "apiKey");
    let requests = 0;
    const runtime = await AgentRuntime.open({
      dataDir,
      providers: [p],
      authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
      fetch: mockFetch(({ body, headers }) => {
        requests++;
        assert.equal(
          headers.get(protocol === "anthropic" ? "x-api-key" : "authorization"),
          protocol === "anthropic" ? p.secret : `Bearer ${p.secret}`,
        );
        if (protocol === "anthropic") {
          assert.deepEqual(body.thinking, { type: "adaptive" });
          assert.deepEqual(body.output_config, { effort: "low" });
        } else if (protocol === "responses")
          assert.deepEqual(body.reasoning, { effort: "low" });
        else assert.equal(body.reasoning_effort, "low");
        return answer(protocol);
      }),
    });
    try {
      const created = await session(runtime);
      await send(runtime, created.id, "effort", { effort: "low" });
      assert.equal(
        (await settled(runtime, created.id)).turns[0]!.status,
        "complete",
      );
      assert.equal(requests, 1);
    } finally {
      await runtime.close();
      assert.equal(
        (await readFile(join(dataDir, "agent-v2.sqlite"))).includes(
          Buffer.from(p.secret!),
        ),
        false,
      );
      await rm(dataDir, { recursive: true, force: true });
    }
  });

test("the production 32-round budget produces exactly one final synthesis request", async () => {
  const dataDir = await dir();
  let calls = 0;
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch: mockFetch(({ body }) => {
      calls++;
      return body.tool_choice === "none"
        ? answer("chatCompletions", "Final 33rd response")
        : toolAnswer(calls);
    }),
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    const result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.status, "complete");
    assert.equal(result.turns[0]!.toolCalls.length, 32);
    assert.equal(calls, 33);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("Pi compacts a small configured context while preserving all original turn pages", async () => {
  const dataDir = await dir();
  const p = provider();
  p.models![0]!.contextWindowTokens = 16_384;
  p.models![0]!.maxOutputTokens = 1024;
  let compactions = 0;
  const fetch = mockFetch(async ({ body }) => {
    const isCompaction = JSON.stringify(body.messages).includes(
      "context summarization assistant",
    );
    if (isCompaction) {
      compactions++;
      return answer(
        "chatCompletions",
        "## Goal\nRead knowledge.\n## Progress\nPrior evidence is summarized.",
      );
    }
    const response = answer(
      "chatCompletions",
      "A detailed answer. ".repeat(500),
    );
    return new Response(
      (await response.text()).replace(
        '"prompt_tokens":20',
        '"prompt_tokens":14500',
      ),
      { headers: response.headers },
    );
  });
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [p],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
  });
  try {
    const created = await session(runtime);
    for (let i = 0; i < 4; i++) {
      await send(runtime, created.id, `q${i}`, {
        text: "Please analyze this knowledge. ".repeat(500),
      });
      const result = await settled(runtime, created.id);
      assert.equal(
        result.turns.at(-1)!.status,
        "complete",
        JSON.stringify(result),
      );
    }
    assert.ok(compactions > 0, "Pi should run its compaction task");
    const result = (await runtime.request(AUTH, "sessions.get", {
      sessionId: created.id,
    })) as { turns: ChatTurn[] };
    assert.equal(result.turns.length, 4);
    assert.ok(result.turns.every((t) => t.question.length > 10000));
    assert.ok(result.turns.some((t) => t.contextNotice?.includes("压缩")));
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("a burst of 130 calls executes only 128 tools and then synthesizes once", async () => {
  const dataDir = await dir();
  let modelCalls = 0;
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch: mockFetch(({ body }) => {
      modelCalls++;
      if (modelCalls > 1) {
        assert.equal(body.tool_choice, "none");
        const results = body.messages.filter(
          (m: Record<string, unknown>) => m.role === "tool",
        );
        assert.equal(
          results.filter((m: { content: string }) =>
            m.content.includes("Knowledge comes from"),
          ).length,
          128,
        );
        assert.equal(
          results.filter((m: { content: string }) =>
            m.content.includes("budget_exhausted"),
          ).length,
          2,
        );
        return answer("chatCompletions", "Done");
      }
      return sse([
        {
          id: "burst",
          object: "chat.completion.chunk",
          choices: [
            {
              index: 0,
              delta: {
                role: "assistant",
                tool_calls: Array.from({ length: 130 }, (_, index) => ({
                  index,
                  id: `burst-${index}`,
                  type: "function",
                  function: {
                    name: "get_document",
                    arguments: JSON.stringify({ docId: "guide-example" }),
                  },
                })),
              },
              finish_reason: null,
            },
          ],
        },
        {
          id: "burst",
          object: "chat.completion.chunk",
          choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
        },
        "[DONE]",
      ]);
    }),
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    const result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.status, "complete", JSON.stringify(result));
    assert.equal(modelCalls, 2);
    assert.equal(result.turns[0]!.toolCalls.length, 128);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("even malformed model arguments produce bounded safe tool overviews", async () => {
  const dataDir = await dir();
  let calls = 0;
  const args = Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [
      `${i}${"long".repeat(20)}`,
      `prefix\u202e\n${"value".repeat(300)}`,
    ]),
  );
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch: mockFetch(() =>
      calls++
        ? answer("chatCompletions")
        : sse([
            {
              id: "bad",
              object: "chat.completion.chunk",
              choices: [
                {
                  index: 0,
                  delta: {
                    tool_calls: [
                      {
                        index: 0,
                        id: "bad-call",
                        type: "function",
                        function: {
                          name: "get_document",
                          arguments: JSON.stringify(args),
                        },
                      },
                    ],
                  },
                  finish_reason: "tool_calls",
                },
              ],
            },
            "[DONE]",
          ]),
    ),
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    const result = await settled(runtime, created.id);
    const overview = result.turns[0]!.toolCalls[0]!.overview!;
    assert.equal(overview.input.length, 8);
    assert.ok(
      overview.input.every(
        (item) =>
          item.label.length <= 32 &&
          item.value.length <= 256 &&
          !/[\u0000-\u001f\u202e]/.test(item.value),
      ),
    );
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("list-only connections receive changes and duplicate receipts survive provider removal", async () => {
  const dataDir = await dir();
  const pushes: import("../src/types.js").Push[] = [];
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch: mockFetch(() => answer("chatCompletions")),
    emit: (p) => pushes.push(p),
  });
  try {
    await runtime.request(
      { ...AUTH, connectionId: "empty-tab" },
      "sessions.list",
      {},
    );
    const created = await session(runtime);
    assert.ok(
      pushes.some(
        (p) => p.connectionId === "empty-tab" && p.event === "sessions.changed",
      ),
    );
    const receipt = await send(runtime, created.id);
    await settled(runtime, created.id);
    await runtime.configure([], [{ id: AUTH.authorizationId, origin: ORIGIN }]);
    assert.deepEqual(await send(runtime, created.id), receipt);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("an SSE body that goes idle after headers is bounded independently of the SDK", async () => {
  const dataDir = await dir();
  let calls = 0,
    cancelled = 0;
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch: mockFetch(() => {
      calls++;
      return new Response(
        new ReadableStream({
          cancel() {
            cancelled++;
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    }),
    limits: { requestTimeoutMs: 20 },
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    const result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.status, "error");
    assert.ok(calls <= 3);
    assert.equal(cancelled, calls);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("the persisted run deadline includes initial knowledge preparation time", async () => {
  const dataDir = await dir();
  let now = 1000;
  const base = mockFetch(() => answer("chatCompletions"));
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const response = await base(input, init);
    if (String(input).endsWith("/ai/manifest.json")) now += 70;
    return response;
  };
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch,
    now: () => now,
    limits: { deadlineMs: 100 },
  });
  try {
    const created = await session(runtime);
    await send(runtime, created.id);
    const result = await settled(runtime, created.id);
    assert.equal(result.turns[0]!.createdAt, 1000);
    assert.equal(result.turns[0]!.status, "complete");
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

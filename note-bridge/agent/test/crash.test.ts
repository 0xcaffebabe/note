import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer } from "node:http";
import { createInterface } from "node:readline";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { fixtureKnowledge, answer, provider } from "./fixtures.js";

class Worker {
  child: ChildProcessWithoutNullStreams;
  counter = 0;
  pending = new Map<
    number,
    { resolve: (value: any) => void; reject: (reason: Error) => void }
  >();
  constructor() {
    this.child = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        fileURLToPath(new URL("../src/index.ts", import.meta.url)),
      ],
      {
        cwd: dirname(
          fileURLToPath(new URL("../package.json", import.meta.url)),
        ),
        stdio: "pipe",
      },
    );
    createInterface({ input: this.child.stdout }).on("line", (line) => {
      const result = JSON.parse(line);
      if (typeof result.id !== "number") return;
      const promise = this.pending.get(result.id);
      this.pending.delete(result.id);
      if (result.error)
        promise?.reject(new Error(JSON.stringify(result.error)));
      else promise?.resolve(result.result);
    });
    this.child.stderr.resume();
    this.child.on("exit", () => {
      for (const promise of this.pending.values())
        promise.reject(new Error("Worker exited"));
      this.pending.clear();
    });
  }
  call(method: string, params: unknown) {
    const id = ++this.counter;
    return new Promise<any>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child.stdin.write(JSON.stringify({ id, method, params }) + "\n");
    });
  }
  async kill() {
    if (this.child.exitCode !== null || this.child.signalCode !== null) return;
    this.child.kill("SIGKILL");
    await once(this.child, "exit");
  }
}
test("SIGKILL during SSE is recovered from SQLite by a fresh private JSONL worker", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "note-agent-crash-"));
  const knowledge = fixtureKnowledge();
  let calls = 0;
  const server = createServer(async (req, res) => {
    if (req.url?.startsWith("/ai/")) {
      const value = knowledge.get(req.url);
      res.writeHead(value ? 200 : 404, { "content-type": "application/json" });
      res.end(value ?? "missing");
      return;
    }
    for await (const _chunk of req) {
    }
    calls++;
    res.writeHead(200, { "content-type": "text/event-stream" });
    if (calls === 1) {
      res.write(
        "data: " +
          JSON.stringify({
            id: "partial",
            object: "chat.completion.chunk",
            choices: [
              {
                index: 0,
                delta: { role: "assistant", content: "Saved partial. " },
                finish_reason: null,
              },
            ],
          }) +
          "\n\n",
      );
      return;
    }
    res.end(
      await answer("chatCompletions", "Recovered complete answer").text(),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  const p = { ...provider(), baseUrl: origin + "/v1" },
    authorization = { id: "grant", origin },
    context = { connectionId: "tab", authorizationId: "grant", origin };
  let worker = new Worker();
  try {
    await worker.call("initialize", {
      dataDir,
      providers: [p],
      authorizations: [authorization],
    });
    const session = await worker.call("request", {
      ...context,
      request: {
        id: "create",
        method: "sessions.create",
        params: { providerId: p.id, model: p.model },
      },
    });
    const params = {
      sessionId: session.id,
      clientRequestId: "same-request",
      text: "Read the knowledge base",
      providerId: p.id,
      model: p.model,
    };
    const receipt = await worker.call("request", {
      ...context,
      request: { id: "send", method: "messages.send", params },
    });
    for (let i = 0; i < 100 && calls === 0; i++) await delay(10);
    assert.equal(calls, 1);
    await delay(150);
    await worker.kill();
    worker = new Worker();
    await worker.call("initialize", {
      dataDir,
      providers: [p],
      authorizations: [authorization],
    });
    let result: any;
    for (let i = 0; i < 100; i++) {
      result = await worker.call("request", {
        ...context,
        request: {
          id: "get",
          method: "sessions.get",
          params: { sessionId: session.id },
        },
      });
      if (result.turns.at(-1)?.status === "complete") break;
      await delay(20);
    }
    assert.equal(result.turns[0].status, "complete", JSON.stringify(result));
    assert.match(result.turns[0].answer, /Recovered complete answer/);
    assert.deepEqual(
      await worker.call("request", {
        ...context,
        request: { id: "duplicate", method: "messages.send", params },
      }),
      receipt,
    );
    assert.equal(calls, 2);
    await worker.call("shutdown", {});
  } finally {
    await worker.kill();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(dataDir, { recursive: true, force: true });
  }
});

for (const operation of ["revoke", "cancel"] as const)
  test(`private IPC ${operation} interrupts a blocked knowledge preparation immediately`, async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "note-agent-control-"));
    let blocked = false,
      modelCalls = 0;
    const server = createServer(async (req, res) => {
      if (req.url?.startsWith("/ai/")) {
        blocked = true;
        return;
      }
      modelCalls++;
      res.end(await answer("chatCompletions").text());
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`,
      p = { ...provider(), baseUrl: origin + "/v1" },
      authorization = { id: "grant", origin },
      context = { connectionId: "tab", authorizationId: "grant", origin };
    const worker = new Worker();
    try {
      await worker.call("initialize", {
        dataDir,
        providers: [p],
        authorizations: [authorization],
      });
      const session = await worker.call("request", {
        ...context,
        request: {
          id: "create",
          method: "sessions.create",
          params: { providerId: p.id, model: p.model },
        },
      });
      const pending = worker.call("request", {
        ...context,
        request: {
          id: "blocked",
          method:
            operation === "cancel" ? "messages.send" : "knowledge.document",
          params:
            operation === "cancel"
              ? {
                  sessionId: session.id,
                  clientRequestId: "preparing",
                  text: "Read knowledge",
                  providerId: p.id,
                  model: p.model,
                }
              : { docId: "guide-example" },
        },
      });
      const rejected = assert.rejects(
        pending,
        /cancelled|configuration_changed/,
      );
      for (let i = 0; i < 100 && !blocked; i++) await delay(5);
      assert.ok(blocked);
      const started = Date.now();
      const control =
        operation === "revoke"
          ? worker.call("configure", { providers: [p], authorizations: [] })
          : worker.call("request", {
              ...context,
              request: {
                id: "cancel",
                method: "runs.cancel",
                params: { sessionId: session.id },
              },
            });
      await Promise.race([
        control,
        delay(1000).then(() => {
          throw new Error("urgent control blocked behind knowledge HTTP");
        }),
      ]);
      assert.ok(Date.now() - started < 1000);
      await rejected;
      assert.equal(modelCalls, 0);
      await worker.call("shutdown", {});
    } finally {
      await worker.kill();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(dataDir, { recursive: true, force: true });
    }
  });

test("a guessed foreign session ID cannot cancel another origin queued behind saturated IPC reads", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "note-agent-origin-queue-"));
  const knowledge = fixtureKnowledge();
  let hold = true;
  const releases: (() => void)[] = [];
  const serve = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
  ) => {
    if (res.headersSent || res.destroyed) return;
    const body = knowledge.get(req.url ?? "");
    res.writeHead(body ? 200 : 404, { "content-type": "application/json" });
    res.end(body ?? "missing");
  };
  const siteA = createServer((req, res) => {
    if (hold && req.url === "/ai/manifest.json") {
      releases.push(() => serve(req, res));
      return;
    }
    serve(req, res);
  });
  const siteB = createServer(async (req, res) => {
    if (req.url?.startsWith("/ai/")) {
      serve(req, res);
      return;
    }
    for await (const _chunk of req) {
    }
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.end(
      await answer("chatCompletions", "Foreign queued run completed").text(),
    );
  });
  siteA.listen(0, "127.0.0.1");
  siteB.listen(0, "127.0.0.1");
  await Promise.all([once(siteA, "listening"), once(siteB, "listening")]);
  const originA = `http://127.0.0.1:${(siteA.address() as { port: number }).port}`,
    originB = `http://127.0.0.1:${(siteB.address() as { port: number }).port}`;
  const a = {
      connectionId: "tab-a",
      authorizationId: "grant-a",
      origin: originA,
    },
    b = { connectionId: "tab-b", authorizationId: "grant-b", origin: originB },
    p = { ...provider(), baseUrl: originB + "/v1" },
    worker = new Worker();
  try {
    await worker.call("initialize", {
      dataDir,
      providers: [p],
      authorizations: [
        { id: a.authorizationId, origin: originA },
        { id: b.authorizationId, origin: originB },
      ],
    });
    const session = await worker.call("request", {
      ...b,
      request: {
        id: "create-b",
        method: "sessions.create",
        params: { providerId: p.id, model: p.model },
      },
    });
    const reads = Array.from({ length: 8 }, (_, i) =>
      worker.call("request", {
        ...a,
        request: {
          id: `read-${i}`,
          method: "knowledge.document",
          params: { docId: "guide-example" },
        },
      }),
    );
    const readsDone = Promise.allSettled(reads);
    for (let i = 0; i < 200 && releases.length < 8; i++) await delay(5);
    assert.equal(releases.length, 8, "all ordinary IPC slots must be occupied");
    const queued = worker.call("request", {
      ...b,
      request: {
        id: "send-b",
        method: "messages.send",
        params: {
          sessionId: session.id,
          clientRequestId: "foreign-queued",
          text: "Read my knowledge base",
          providerId: p.id,
          model: p.model,
        },
      },
    });
    const queuedResult = queued.then(
      (value) => ({ ok: true, value }),
      (error) => ({ ok: false, error }),
    );
    await assert.rejects(
      worker.call("request", {
        ...a,
        request: {
          id: "guess-cancel",
          method: "runs.cancel",
          params: { sessionId: session.id },
        },
      }),
      /not_found/,
    );
    hold = false;
    for (const release of releases) release();
    await readsDone;
    const receipt = await queuedResult;
    assert.equal(receipt.ok, true, JSON.stringify(receipt));
    let result: any;
    for (let i = 0; i < 100; i++) {
      result = await worker.call("request", {
        ...b,
        request: {
          id: "get-b",
          method: "sessions.get",
          params: { sessionId: session.id },
        },
      });
      if (result.turns.at(-1)?.status === "complete") break;
      await delay(10);
    }
    assert.equal(result.turns[0]?.answer, "Foreign queued run completed");
    await worker.call("shutdown", {});
  } finally {
    hold = false;
    for (const release of releases) release();
    await worker.kill();
    siteA.closeAllConnections();
    siteB.closeAllConnections();
    await Promise.all([
      new Promise<void>((resolve) => siteA.close(() => resolve())),
      new Promise<void>((resolve) => siteB.close(() => resolve())),
    ]);
    await rm(dataDir, { recursive: true, force: true });
  }
});

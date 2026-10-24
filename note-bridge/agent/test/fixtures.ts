import { createHash } from "node:crypto";
import type { RuntimeProvider } from "../src/types.js";
export const ORIGIN = "https://notes.test";
export const AUTH = {
  connectionId: "browser-1",
  authorizationId: "grant-1",
  origin: ORIGIN,
};
export function fixtureKnowledge() {
  const bodies = new Map<string, string>();
  const resource = (value: unknown) => {
    const body = JSON.stringify(value),
      sha256 = createHash("sha256").update(body).digest("hex"),
      path = `/ai/objects/${sha256}.json`;
    bodies.set(path, body);
    return { path, sha256, bytes: Buffer.byteLength(body) };
  };
  const doc = resource({
    schemaVersion: 1,
    docId: "guide-example",
    title: "Example",
    url: "/guide/example.html",
    headings: [{ id: "intro", title: "Intro" }],
    sections: [
      {
        headingId: "intro",
        title: "Intro",
        text: "Knowledge comes from the independently deployed website.",
      },
    ],
  });
  const catalog = resource({
    schemaVersion: 1,
    documents: [
      {
        docId: "guide-example",
        title: "Example",
        url: "/guide/example.html",
        category: "guide",
        contentHash: `sha256:${doc.sha256}`,
        resource: doc,
      },
    ],
  });
  const graph = resource({ schemaVersion: 1, edges: [] }),
    clusters = resource({ schemaVersion: 1, clusters: [] });
  bodies.set(
    "/ai/manifest.json",
    JSON.stringify({
      schemaVersion: 1,
      knowledgeBaseId: "note",
      revision: "a".repeat(64),
      capabilities: [
        "catalog",
        "documents",
        "toc",
        "network",
        "related",
        "search",
      ],
      resources: { catalog, graph, clusters },
    }),
  );
  return bodies;
}
export function provider(
  protocol: RuntimeProvider["protocol"] = "chatCompletions",
  authKind: RuntimeProvider["authKind"] = "none",
): RuntimeProvider {
  return {
    id: "custom",
    name: "Custom",
    protocol,
    authKind,
    baseUrl: "https://model.test/v1",
    enabled: true,
    model: "custom-model",
    models: [
      {
        id: "custom-model",
        name: "Custom model",
        efforts: ["default", "none", "low", "high", "ultra"],
      },
    ],
    ...(authKind === "none" ? {} : { secret: "test-memory-only-secret" }),
  };
}
export function sse(events: unknown[]): Response {
  return new Response(
    events
      .map((event) =>
        typeof event === "string"
          ? `data: ${event}\n\n`
          : `${event && typeof event === "object" && "type" in event ? `event: ${event.type}\n` : ""}data: ${JSON.stringify(event)}\n\n`,
      )
      .join(""),
    { headers: { "content-type": "text/event-stream" } },
  );
}
export function answer(
  protocol: RuntimeProvider["protocol"],
  text = "Answered from the knowledge base.",
): Response {
  if (protocol === "chatCompletions")
    return sse([
      {
        id: "a1",
        object: "chat.completion.chunk",
        created: 1,
        model: "custom-model",
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content: text },
            finish_reason: null,
          },
        ],
      },
      {
        id: "a1",
        object: "chat.completion.chunk",
        created: 1,
        model: "custom-model",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
      },
      "[DONE]",
    ]);
  if (protocol === "responses")
    return sse([
      {
        type: "response.created",
        response: { id: "r1", status: "in_progress", output: [] },
      },
      {
        type: "response.output_item.added",
        output_index: 0,
        item: { id: "msg1", type: "message", role: "assistant", content: [] },
      },
      {
        type: "response.content_part.added",
        item_id: "msg1",
        output_index: 0,
        content_index: 0,
        part: { type: "output_text", text: "", annotations: [] },
      },
      {
        type: "response.output_text.delta",
        item_id: "msg1",
        output_index: 0,
        content_index: 0,
        delta: text,
      },
      {
        type: "response.output_item.done",
        output_index: 0,
        item: {
          id: "msg1",
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text, annotations: [] }],
        },
      },
      {
        type: "response.completed",
        response: {
          id: "r1",
          status: "completed",
          output: [],
          usage: { input_tokens: 20, output_tokens: 10, total_tokens: 30 },
        },
      },
    ]);
  return sse([
    {
      type: "message_start",
      message: {
        id: "m1",
        type: "message",
        role: "assistant",
        model: "custom-model",
        content: [],
        stop_reason: null,
        usage: { input_tokens: 20, output_tokens: 0 },
      },
    },
    {
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text },
    },
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: "end_turn", stop_sequence: null },
      usage: { output_tokens: 10 },
    },
    { type: "message_stop" },
  ]);
}
export function toolAnswer(index = 0): Response {
  return sse([
    {
      id: `c${index}`,
      object: "chat.completion.chunk",
      model: "custom-model",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            tool_calls: [
              {
                index: 0,
                id: `tool-${index}`,
                type: "function",
                function: {
                  name: "get_document",
                  arguments: JSON.stringify({ docId: "guide-example" }),
                },
              },
            ],
          },
          finish_reason: null,
        },
      ],
    },
    {
      id: `c${index}`,
      object: "chat.completion.chunk",
      model: "custom-model",
      choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
    },
    "[DONE]",
  ]);
}
export function mockFetch(
  onModel: (request: {
    url: string;
    body: Record<string, any>;
    headers: Headers;
    signal: AbortSignal | undefined;
  }) => Response | Promise<Response>,
): typeof fetch {
  const knowledge = fixtureKnowledge();
  return (async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const target = new URL(url);
    if (target.origin === ORIGIN) {
      const body = knowledge.get(target.pathname);
      return new Response(body ?? "missing", {
        status: body ? 200 : 404,
        headers: { "content-type": "application/json" },
      });
    }
    return onModel({
      url,
      body: JSON.parse(String(init?.body)),
      headers: new Headers(init?.headers),
      signal: init?.signal ?? undefined,
    });
  }) as typeof fetch;
}

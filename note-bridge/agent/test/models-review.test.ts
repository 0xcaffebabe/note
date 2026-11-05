import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { AgentRuntime } from '../src/runtime.js';
import {
  AUTH,
  ORIGIN,
  provider,
  mockFetch,
  answer,
  toolAnswer,
} from './fixtures.js';
import type { ChatTurn, SessionSummary } from '../src/types.js';

test('mock knowledge routing requires the exact site origin', async () => {
  const modelRequests: string[] = [];
  const fetcher = mockFetch(({ url }) => {
    modelRequests.push(url);
    return new Response('model response');
  });
  const manifest = await fetcher(`${ORIGIN}/ai/manifest.json`);
  assert.equal(manifest.status, 200);
  assert.equal((await manifest.json()).schemaVersion, 1);

  const otherOrigins = [
    'https://notes.test.evil/ai/manifest.json',
    'https://notes.test@evil.test/ai/manifest.json',
    'https://notes.test:8443/ai/manifest.json',
  ];
  for (const url of otherOrigins) {
    const response = await fetcher(url, { method: 'POST', body: '{}' });
    assert.equal(await response.text(), 'model response');
  }
  assert.deepEqual(modelRequests, otherOrigins);
});

async function finish(runtime: AgentRuntime, sessionId: string) {
  for (let i = 0; i < 150; i++) {
    const page = (await runtime.request(AUTH, 'sessions.get', {
      sessionId,
    })) as { turns: ChatTurn[] };
    if (page.turns.at(-1)?.status !== 'running') return page.turns.at(-1)!;
    await delay(20);
  }
  throw new Error('The model did not finish');
}
async function create(runtime: AgentRuntime) {
  return runtime.request(AUTH, 'sessions.create', {
    providerId: 'custom',
    model: 'custom-model',
  }) as Promise<SessionSummary>;
}
async function send(
  runtime: AgentRuntime,
  sessionId: string,
  clientRequestId: string,
) {
  await runtime.request(AUTH, 'messages.send', {
    sessionId,
    clientRequestId,
    text: 'Explain the same evidence',
    providerId: 'custom',
    model: 'custom-model',
  });
  return finish(runtime, sessionId);
}

test('provider errors redact credentials before truncating and persisting their display text', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'note-review-errors-'));
  const p = provider('chatCompletions', 'bearer');
  const recognizablePrefix = 'review-private';
  p.secret = `${recognizablePrefix}-key-${'a'.repeat(70)}`;
  const upstream = mockFetch(
    () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'x'.repeat(960) + p.secret,
            type: 'invalid_request_error',
          },
        }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
  );
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [p],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch: upstream,
  });
  try {
    const session = await create(runtime);
    const turn = await send(runtime, session.id, 'bad-upstream');
    assert.equal(turn.status, 'error');
    assert.ok(turn.error);
    assert.equal(
      turn.error.includes(recognizablePrefix),
      false,
      'A key that straddles the 1000-character cutoff must not leak a recognizable prefix',
    );
    await runtime.close();
    const database = await readFile(join(dataDir, 'agent-v2.sqlite'));
    assert.equal(
      database.includes(Buffer.from(recognizablePrefix)),
      false,
      'The original partial key must never enter SQLite',
    );
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('follow-up citations reuse persisted prior evidence after restart and an independent site revision', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'note-review-citations-'));
  let calls = 0,
    sourceId = '',
    changedRevision = false;
  const underlying = mockFetch(({ body }) => {
    if (++calls === 1) return toolAnswer();
    if (!sourceId)
      sourceId = JSON.parse(
        body.messages.find(
          (message: { role: string }) => message.role === 'tool',
        ).content,
      ).sources[0].sourceId;
    return answer('chatCompletions', `The same evidence [${sourceId}]`);
  });
  const upstream: typeof fetch = async (input, init) => {
    const response = await underlying(input, init);
    if (changedRevision && String(input).endsWith('/ai/manifest.json')) {
      const manifest = (await response.json()) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ ...manifest, revision: 'b'.repeat(64) }),
        { headers: response.headers },
      );
    }
    return response;
  };
  const options = {
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch: upstream,
  };
  let runtime = await AgentRuntime.open(options);
  try {
    const session = await create(runtime);
    const first = await send(runtime, session.id, 'read-evidence');
    assert.equal(first.sources.length, 1);
    assert.equal(first.sources[0]!.revision, 'a'.repeat(64));
    await runtime.close();
    changedRevision = true;
    runtime = await AgentRuntime.open(options);
    const followup = await send(runtime, session.id, 'continue-after-restart');
    assert.equal(followup.status, 'complete');
    assert.equal(followup.toolCalls.length, 0);
    assert.equal(calls, 3);
    assert.deepEqual(
      followup.sources,
      first.sources,
      'A reused citation must keep the actual previously read content hash and revision',
    );
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('an odd-sized configured context sends a valid integer output limit', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'note-review-output-budget-'));
  const configured = provider();
  configured.models![0]!.contextWindowTokens = 16385;
  let outputLimit = 0;
  const runtime = await AgentRuntime.open({
    dataDir,
    providers: [configured],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    fetch: mockFetch(({ body }) => {
      outputLimit = body.max_tokens ?? body.max_completion_tokens;
      if (!Number.isInteger(outputLimit))
        return new Response(
          JSON.stringify({
            error: { message: 'max_tokens must be an integer' },
          }),
          { status: 400 },
        );
      return answer('chatCompletions');
    }),
  });
  try {
    const session = await create(runtime);
    const turn = await send(runtime, session.id, 'odd-window');
    assert.equal(turn.status, 'complete');
    assert.equal(outputLimit, 8192);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

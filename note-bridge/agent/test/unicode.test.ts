import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { AgentRuntime } from '../src/runtime.js';
import { JsonlOutput } from '../src/ipc/JsonlOutput.js';
import { sanitizeOverview } from '../src/projection/sanitizeOverview.js';
import { RuntimeConfiguration } from '../src/services/RuntimeConfiguration.js';
import type { ChatTurn, SessionSummary } from '../src/types.js';
import { AUTH, ORIGIN, provider, mockFetch, answer } from './fixtures.js';

async function settled(runtime: AgentRuntime, sessionId: string) {
  for (let attempt = 0; attempt < 150; attempt++) {
    const page = (await runtime.request(AUTH, 'sessions.get', {
      sessionId,
    })) as { session: SessionSummary; turns: ChatTurn[] };
    if (page.turns.at(-1)?.status !== 'running') {
      return page;
    }
    await delay(20);
  }
  throw new Error('Answer did not settle');
}

test('emoji at title and answer cutoffs preserves valid Unicode across restart', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'note-unicode-'));
  const question = 'q'.repeat(59) + '😀 question';
  const response = 'a'.repeat(59) + '😀 answer';
  const options = {
    dataDir,
    providers: [provider()],
    authorizations: [{ id: AUTH.authorizationId, origin: ORIGIN }],
    limits: { answerChars: 60 },
    fetch: mockFetch(() => answer('chatCompletions', response)),
  };
  let runtime = await AgentRuntime.open(options);
  try {
    const session = (await runtime.request(AUTH, 'sessions.create', {
      providerId: 'custom',
      model: 'custom-model',
    })) as SessionSummary;
    await runtime.request(AUTH, 'messages.send', {
      sessionId: session.id,
      clientRequestId: 'unicode-boundary',
      providerId: 'custom',
      model: 'custom-model',
      text: question,
    });
    const first = await settled(runtime, session.id);
    assert.equal(first.turns[0]!.status, 'complete');
    assert.equal(first.session.title, 'q'.repeat(59));
    assert.equal(first.turns[0]!.answer, 'a'.repeat(59));
    assert.equal(first.turns[0]!.question, question);
    await runtime.close();
    runtime = await AgentRuntime.open(options);
    const restored = await settled(runtime, session.id);
    assert.equal(restored.session.title, first.session.title);
    assert.deepEqual(restored.turns, first.turns);
    const list = (await runtime.request(AUTH, 'sessions.list')) as {
      sessions: SessionSummary[];
    };
    assert.equal(list.sessions[0]!.title, first.session.title);
  } finally {
    await runtime.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('all bounded tool overview fields preserve complete emoji at their limits', () => {
  const overview = sanitizeOverview({
    input: [{ label: 'l'.repeat(31) + '😀', value: 'v'.repeat(255) + '😀' }],
    summary: 's'.repeat(319) + '😀',
    note: 'n'.repeat(399) + '😀',
    items: ['i'.repeat(199) + '😀', '完整 😀'],
  });
  assert.deepEqual(overview, {
    input: [{ label: 'l'.repeat(31), value: 'v'.repeat(255) }],
    summary: 's'.repeat(319),
    note: 'n'.repeat(399),
    items: ['i'.repeat(199), '完整 😀'],
  });
});

test('runtime errors redact credentials before applying a Unicode-safe limit', () => {
  const configured = provider('chatCompletions', 'bearer');
  const configuration = new RuntimeConfiguration([configured], []);
  const text = 'x'.repeat(999) + '😀' + configured.secret;
  assert.equal(configuration.errorText(new Error(text)), 'x'.repeat(999));
  assert.equal(
    configuration.errorText(new Error('😀' + configured.secret)),
    '😀[redacted]',
  );
});

test('IPC repairs malformed legacy strings without modifying the stored projection', () => {
  const lines: string[] = [];
  const stdout = new Writable({
    write(chunk, _encoding, done) {
      lines.push(chunk.toString());
      done();
    },
  });
  const writer = new JsonlOutput(stdout, () =>
    assert.fail('Unexpected overflow'),
  );
  const projection = {
    session: { title: 'old\uD83D' },
    turn: { answer: 'valid 😀', error: '\uDE00 error', sources: [] },
  };
  writer.send({ id: 'history', result: projection });
  writer.send({
    event: 'session.updated',
    connectionId: 'c',
    data: projection,
  });
  for (const line of lines) {
    const frame = JSON.parse(line);
    assert.deepEqual(frame.result ?? frame.data, {
      session: { title: 'old�' },
      turn: { answer: 'valid 😀', error: '� error', sources: [] },
    });
  }
  assert.equal(lines.length, 2);
  assert.equal(projection.session.title, 'old\uD83D');
  assert.equal(projection.turn.error, '\uDE00 error');
});

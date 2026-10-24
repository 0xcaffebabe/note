import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeModels } from '../src/model/createModelRegistry.js';
import type { RuntimeProvider } from '../src/domain/Model.js';
import { answer, provider } from './fixtures.js';

const endpointCases: {
  protocol: RuntimeProvider['protocol'];
  baseUrl: string;
  endpoint: string;
}[] = [
  ...[
    ['', '/v1/messages'],
    ['/', '/v1/messages'],
    ['/v1', '/v1/messages'],
    ['/v1///', '/v1/messages'],
    ['/gateway/anthropic', '/gateway/anthropic/v1/messages'],
    ['/gateway/anthropic/', '/gateway/anthropic/v1/messages'],
    ['/gateway/anthropic/v1/', '/gateway/anthropic/v1/messages'],
    ['/v1/proxy', '/v1/proxy/v1/messages'],
  ].map(([base, endpoint]) => ({
    protocol: 'anthropic' as const,
    baseUrl: `https://model.test${base}`,
    endpoint: `https://model.test${endpoint}`,
  })),
  ...(['responses', 'chatCompletions'] as const).flatMap((protocol) =>
    ['/v1', '/gateway/v1/'].map((path) => ({
      protocol,
      baseUrl: `https://model.test${path}`,
      endpoint: `https://model.test${path.replace(/\/$/, '')}/${protocol === 'responses' ? 'responses' : 'chat/completions'}`,
    })),
  ),
];

for (const { protocol, baseUrl, endpoint } of endpointCases) {
  test(`${protocol}: SDK requests the configured endpoint from ${baseUrl}`, async () => {
    const configured = { ...provider(protocol, 'apiKey'), baseUrl };
    const requests: { url: string; headers: Headers }[] = [];
    let releases = 0;
    const models = makeModels(
      [configured],
      async () => ({
        effort: 'default',
        final: false,
        signal: new AbortController().signal,
        check: async () => {},
        release: () => {
          releases++;
        },
      }),
      async (input, init) => {
        requests.push({
          url: input instanceof Request ? input.url : String(input),
          headers: new Headers(init?.headers),
        });
        return answer(protocol);
      },
    );
    const model = models.getModel(configured.id, configured.model)!;
    const result = await models.completeSimple(model, {
      messages: [{ role: 'user', content: 'Reply OK.', timestamp: 0 }],
    });
    assert.equal(result.stopReason, 'stop', result.errorMessage);
    assert.deepEqual(
      requests.map(({ url }) => {
        const target = new URL(url);
        return target.origin + target.pathname;
      }),
      [endpoint],
    );
    assert.equal(
      requests[0].headers.get(
        protocol === 'anthropic' ? 'x-api-key' : 'authorization',
      ),
      protocol === 'anthropic'
        ? configured.secret
        : `Bearer ${configured.secret}`,
    );
    assert.equal(releases, 1);
    assert.equal(
      configured.baseUrl,
      baseUrl,
      'Normalization must not mutate native configuration',
    );
  });
}

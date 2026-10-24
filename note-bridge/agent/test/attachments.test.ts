import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import {
  KnowledgeClient,
  KNOWLEDGE_TOOL_RESULT_BYTES,
  type KnowledgeResource,
} from '../src/knowledge.js';

async function snapshotFor(
  sections: { headingId: string; title: string; text: string }[],
) {
  const assets = new Map<string, string>();
  const put = (value: unknown): KnowledgeResource => {
    const body = JSON.stringify(value);
    const sha256 = createHash('sha256').update(body).digest('hex');
    const path = `/ai/objects/${sha256}.json`;
    assets.set(path, body);
    return { path, sha256, bytes: Buffer.byteLength(body) };
  };
  const document = put({
    schemaVersion: 1,
    docId: 'attachment',
    title: 'Attachment document',
    url: '/attachment.html',
    headings: sections
      .filter((section) => section.headingId)
      .map((section) => ({ id: section.headingId, title: section.title })),
    sections,
  });
  const catalog = put({
    schemaVersion: 1,
    documents: [
      {
        docId: 'attachment',
        title: 'Attachment document',
        url: '/attachment.html',
        category: '(root)',
        contentHash: `sha256:${document.sha256}`,
        resource: document,
      },
    ],
  });
  const graph = put({ schemaVersion: 1, edges: [] });
  const clusters = put({ schemaVersion: 1, clusters: [] });
  assets.set(
    '/ai/manifest.json',
    JSON.stringify({
      schemaVersion: 1,
      knowledgeBaseId: 'test',
      revision: catalog.sha256,
      capabilities: ['catalog', 'document', 'toc'],
      resources: { catalog, graph, clusters },
    }),
  );
  const snapshot = await new KnowledgeClient('https://site.test', {
    fetch: async (input) => {
      const body = assets.get(new URL(String(input)).pathname);
      return new Response(body ?? 'missing', { status: body ? 200 : 404 });
    },
  }).pin();
  return { snapshot, contentHash: `sha256:${document.sha256}` };
}

const sections = [
  {
    headingId: '',
    title: 'Introduction',
    text: 'Introduction body must not be attached automatically.',
  },
  {
    headingId: 'first',
    title: 'First chapter',
    text: 'First chapter body must not be attached automatically.',
  },
  {
    headingId: 'second',
    title: 'Second chapter',
    text: 'Selected second chapter body.',
  },
];

test('omitted and empty attachment selections send only the TOC and metadata', async () => {
  const { snapshot, contentHash } = await snapshotFor(sections);
  const result = await snapshot.attachment('attachment');
  assert.deepEqual(result, await snapshot.attachment('attachment', []));
  assert.deepEqual(result.data.sections, []);
  assert.equal(result.data.totalSections, 0);
  assert.equal(result.data.contentHash, contentHash);
  assert.equal(result.data.revision, snapshot.revision);
  assert.equal(result.data.truncated, false);
  const toc = await snapshot.execute('get_toc', { docId: 'attachment' });
  assert.deepEqual(result.data.headings, toc.data.headings);
  assert.deepEqual(result.sources, toc.sources);
  for (const section of sections) {
    assert.equal(JSON.stringify(result).includes(section.text), false);
  }
  assert.match(result.overview!.summary!, /目录与元信息/);
});

test('explicit attachment selections include only chosen bodies with matching evidence', async () => {
  const { snapshot, contentHash } = await snapshotFor(sections);
  const selected = await snapshot.attachment('attachment', ['second']);
  const direct = await snapshot.execute('get_document', {
    docId: 'attachment',
    section: 2,
  });
  const bodies = selected.data.sections as {
    text: string;
    sourceId: string;
    section: number;
  }[];
  assert.equal(bodies.length, 1);
  assert.equal(bodies[0].text, sections[2].text);
  assert.equal(bodies[0].section, 2);
  assert.equal(bodies[0].sourceId, direct.data.sourceId);
  assert.deepEqual(selected.sources, direct.sources);
  assert.equal(selected.sources![0].contentHash, contentHash);
  assert.equal(selected.sources![0].revision, snapshot.revision);
  await assert.rejects(snapshot.attachment('attachment', ['missing']), /章节/);
});

test('empty documents remain attachable as metadata with a document citation', async () => {
  const { snapshot, contentHash } = await snapshotFor([]);
  const result = await snapshot.attachment('attachment', []);
  assert.deepEqual(result.data.sections, []);
  assert.deepEqual(result.data.headings, []);
  assert.equal(result.data.total, 0);
  assert.equal(result.data.nextOffset, null);
  assert.equal(result.data.truncated, false);
  assert.equal(result.sources![0].sourceId, result.data.sourceId);
  assert.equal(result.sources![0].contentHash, contentHash);
  assert.equal(result.sources![0].revision, snapshot.revision);
});

test('large attachment TOCs stay bounded and expose a precise continuation', async () => {
  const large = Array.from({ length: 300 }, (_, i) => ({
    headingId: `${i}-${'章'.repeat(400)}`,
    title: `Chapter ${i} ${'知识🙂'.repeat(200)}`,
    text: `Private body ${i}`,
  }));
  const { snapshot, contentHash } = await snapshotFor(large);
  const result = await snapshot.attachment('attachment');
  const headings = result.data.headings as {
    section: number;
    headingId: string;
  }[];
  assert.ok(
    headings.length > 0 && headings.length < 100,
    'The UTF-8 budget should shrink the first TOC page',
  );
  assert.ok(
    Buffer.byteLength(JSON.stringify(result)) <= KNOWLEDGE_TOOL_RESULT_BYTES,
  );
  assert.equal(result.data.total, large.length);
  assert.equal(result.data.nextOffset, headings.length);
  assert.equal(result.data.truncated, true);
  assert.deepEqual(result.data.sections, []);
  assert.match(result.overview!.note!, /继续读取/);
  assert.equal(JSON.stringify(result).includes('Private body'), false);
  for (const source of result.sources!) {
    assert.equal(source.contentHash, contentHash);
    assert.equal(source.revision, snapshot.revision);
  }
  const next = await snapshot.execute('get_toc', {
    docId: 'attachment',
    offset: result.data.nextOffset as number,
  });
  const nextHeadings = next.data.headings as typeof headings;
  assert.equal(nextHeadings[0].section, headings.length);
  assert.equal(nextHeadings[0].headingId, large[headings.length].headingId);
});

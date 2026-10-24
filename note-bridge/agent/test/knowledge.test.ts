import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:http'
import { KnowledgeClient, KNOWLEDGE_TOOL_RESULT_BYTES, type KnowledgeResource } from '../src/knowledge.js'

function fixture(text = '第一章\n知识正文', withSearch = false) {
  const assets = new Map<string, string>()
  const put = (value: unknown): KnowledgeResource => {
    const body = JSON.stringify(value); const sha256 = createHash('sha256').update(body).digest('hex')
    const path = `/ai/objects/${sha256}.json`; assets.set(path, body)
    return { path, sha256, bytes: Buffer.byteLength(body) }
  }
  const doc = put({ schemaVersion: 1, docId: '测试-文档', title: '文档', url: '/%E6%B5%8B%E8%AF%95/%E6%96%87%E6%A1%A3.html',
    headings: [{ id: 'first', title: '第一章' }, { id: 'second', title: '第二章' }],
    sections: [{ headingId: 'first', title: '第一章', text }, { headingId: 'second', title: '第二章', text: '第二章\n下一节' }] })
  const otherDoc = put({ schemaVersion: 1, docId: 'other', title: 'Other', url: '/other.html', headings: [], sections: [{ headingId: '', title: 'Other', text: 'other body' }] })
  const catalog = put({ schemaVersion: 1, documents: [
    { docId: '测试-文档', title: '文档', url: '/%E6%B5%8B%E8%AF%95/%E6%96%87%E6%A1%A3.html', category: '测试', resource: doc, contentHash: `sha256:${doc.sha256}` },
    { docId: 'other', title: 'Other', url: '/other.html', category: '(root)', resource: otherDoc, contentHash: `sha256:${otherDoc.sha256}` },
  ] })
  const graph = put({ schemaVersion: 1, edges: [{ from: '测试-文档', to: 'other', title: 'links to' }] })
  const clusters = put({ schemaVersion: 1, related: [{ docId: '测试-文档', docIds: ['other', 'missing', '测试-文档'] }] })
  const manifest = { schemaVersion: 1 as const, knowledgeBaseId: 'test', revision: catalog.sha256, resources: { catalog, graph, clusters }, capabilities: ['catalog', 'document', 'toc', 'graph', 'related'],
    ...(withSearch ? { search: { type: 'algolia' as const, applicationId: 'ABCDEF1234', indexName: 'note', searchOnlyApiKey: 'public-read-only-key', revisionConsistency: 'live' as const } } : {}) }
  assets.set('/ai/manifest.json', JSON.stringify(manifest))
  const calls: string[] = []
  const fetcher: typeof fetch = async target => {
    const url = new URL(String(target)); calls.push(url.pathname)
    return new Response(assets.get(url.pathname) || 'missing', { status: assets.has(url.pathname) ? 200 : 404 })
  }
  return { assets, manifest, doc, otherDoc, calls, fetcher, put }
}

test('real HTTP pinning is lazy, citations are stable and all six read-only tools operate without a browser', async () => {
  const data = fixture()
  const requests: string[] = []
  const server = createServer((request, response) => {
    requests.push(request.url!)
    const body = data.assets.get(request.url!)
    response.writeHead(body ? 200 : 404, { 'content-type': 'application/json' }); response.end(body || '{}')
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const address = server.address() as { port: number }
    const snapshot = await new KnowledgeClient(`http://127.0.0.1:${address.port}`).pin()
    assert.deepEqual(requests, ['/ai/manifest.json', data.manifest.resources.catalog.path])
    const overview = await snapshot.execute('get_knowledge_overview', { limit: 1 })
    assert.equal(overview.data.totalDocuments, 2); assert.equal(overview.data.nextOffset, 1)
    const toc = await snapshot.execute('get_toc', { docId: '测试-文档', limit: 1 })
    const text = await snapshot.execute('get_document', { docId: '测试-文档' })
    assert.equal(text.sources![0].sourceId, toc.sources![0].sourceId)
    assert.equal(text.sources![0].contentHash, `sha256:${data.doc.sha256}`)
    assert.equal(text.sources![0].revision, snapshot.revision)
    assert.equal(text.sources![0].url, '/%E6%B5%8B%E8%AF%95/%E6%96%87%E6%A1%A3.html?headingId=first')
    assert.ok(text.overview!.summary!.includes('第一章'))
    const graph = await snapshot.execute('get_knowledge_network', { docId: 'other', direction: 'incoming' })
    assert.equal((graph.data.edges as unknown[]).length, 1)
    const related = await snapshot.execute('get_related_documents', { docId: '测试-文档' })
    assert.equal((related.data.documents as unknown[]).length, 1)
    const search = await snapshot.execute('search_documents', { query: '文档', scope: 'fulltext' })
    assert.equal((search.data.fulltext as { status: string }).status, 'unavailable')
    assert.equal((search.data.documents as unknown[]).length, 1)
    assert.ok(!requests.includes(data.otherDoc.path), 'Discovery never fetches unrelated document bodies')
  } finally { await new Promise<void>(resolve => server.close(() => resolve())) }
})

test('long CJK and emoji sections page under the UTF-8 limit without dropping or splitting characters', async () => {
  const input = '知识🙂\n'.repeat(30000); const data = fixture(input)
  const snapshot = await new KnowledgeClient('https://site.test', { fetch: data.fetcher }).pin()
  let offset: number | null = 0; let output = ''
  while (offset !== null) {
    const result = await snapshot.execute('get_document', { docId: '测试-文档', offset, maxChars: 64000 })
    assert.ok(Buffer.byteLength(JSON.stringify(result)) <= KNOWLEDGE_TOOL_RESULT_BYTES)
    const text = result.data.text as string
    assert.equal(text, input.slice(offset, offset + text.length))
    assert.ok(!/[\uD800-\uDBFF]$/.test(text))
    output += text; offset = result.data.nextOffset as number | null
  }
  assert.equal(output, input)
  await assert.rejects(snapshot.execute('get_document', { docId: '测试-文档', offset: 3 }), /offset/)
})

test('persists the original manifest for crash recovery and rejects missing or modified old resources', async () => {
  const old = fixture(); const next = fixture('new body')
  const client = new KnowledgeClient('https://site.test', { fetch: old.fetcher })
  const snapshot = await client.pin()
  old.assets.set('/ai/manifest.json', JSON.stringify(next.manifest))
  const restored = await client.restore(JSON.parse(JSON.stringify(snapshot.manifest)))
  assert.equal((await restored.execute('get_document', { docId: '测试-文档' })).data.text, '第一章\n知识正文')
  await assert.rejects(client.pin(undefined, old.manifest.revision), (error: { code: string }) => error.code === 'stale_revision')
  old.assets.delete(old.doc.path)
  const expired = await client.restore(snapshot.manifest)
  await assert.rejects(expired.execute('get_document', { docId: '测试-文档' }), (error: { code: string }) => error.code === 'stale_revision')
  old.assets.set(old.doc.path, old.assets.get(old.otherDoc.path)!)
  await assert.rejects(expired.execute('get_document', { docId: '测试-文档' }), /hash 校验失败/)
})

test('validates catalog hashes, canonical links, same-origin hash paths, schemas and tool arguments before fetching', async () => {
  const data = fixture(); const client = new KnowledgeClient('https://site.test', { fetch: data.fetcher })
  const snapshot = await client.pin(); const before = data.calls.length
  for (const args of [{ docId: '../../etc' }, { docId: 'other', url: 'http://localhost/' }, { docId: 'missing' }, { docId: 'other', maxChars: 900000 }]) {
    await assert.rejects(snapshot.execute('get_document', args))
  }
  await assert.rejects(snapshot.execute('shell', {})); assert.equal(data.calls.length, before)
  const changed = structuredClone(data.manifest); changed.resources.catalog.path = 'http://localhost/admin'
  await assert.rejects(client.restore(changed), /路径/)
  await assert.rejects(client.restore({ ...data.manifest, schemaVersion: 2 }), /版本/)
  const catalog = JSON.parse(data.assets.get(data.manifest.resources.catalog.path)!)
  catalog.documents[0].url = 'javascript:alert(1)'
  const bad = data.put(catalog)
  await assert.rejects(client.restore({ ...data.manifest, resources: { ...data.manifest.resources, catalog: bad } }), /规范 HTML/)
})

test('does not follow HTTP redirects and bounds responses with or without Content-Length', async () => {
  const data = fixture()
  const oversized: typeof fetch = async () => new Response('x'.repeat(256 * 1024 + 1))
  await assert.rejects(new KnowledgeClient('https://site.test', { fetch: oversized }).pin(), /大小限制/)
  const header: typeof fetch = async () => new Response('{}', { headers: { 'content-length': '9999999' } })
  await assert.rejects(new KnowledgeClient('https://site.test', { fetch: header }).pin(), /大小限制/)
  const redirect: typeof fetch = async (_url, options) => {
    assert.equal(options?.redirect, 'error')
    return new Response(null, { status: 302, headers: { location: 'http://localhost/private' } })
  }
  await assert.rejects(new KnowledgeClient('https://site.test', { fetch: redirect }).pin(), /HTTP 302/)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(new KnowledgeClient('https://site.test', { fetch: data.fetcher }).pin(controller.signal), { name: 'AbortError' })
  assert.equal(data.calls.length, 0)
  let nested: unknown = {}
  for (let i = 0; i < 66; i++) nested = { nested }
  const deep: typeof fetch = async () => new Response(JSON.stringify({ ...data.manifest, additiveField: nested }))
  await assert.rejects(new KnowledgeClient('https://site.test', { fetch: deep }).pin(), /嵌套/)
})

test('uses only the supported public Algolia endpoint and labels live snippets as unpinned discovery', async () => {
  const data = fixture(undefined, true)
  const fetcher: typeof fetch = async (url, options) => {
    if (String(url).startsWith('https://site.test/')) return data.fetcher(url, options)
    assert.equal(String(url), 'https://abcdef1234-dsn.algolia.net/1/indexes/note/query')
    assert.equal(options?.method, 'POST'); assert.equal(options?.redirect, 'error')
    return new Response(JSON.stringify({ hits: [{ url: './doc/测试/文档.md', segments: [{ txt: '<script>do things</script>知识 <b>片段</b>' }] }, { url: 'http://localhost/secret' }] }))
  }
  const snapshot = await new KnowledgeClient('https://site.test', { fetch: fetcher }).pin()
  const result = await snapshot.execute('search_documents', { query: '知识', scope: 'fulltext' })
  assert.equal((result.data.fulltext as { status: string }).status, 'ok')
  assert.equal((result.data.fulltext as { revisionConsistency: string }).revisionConsistency, 'live')
  assert.equal((result.data.documents as { snippets: string[] }[])[0].snippets[0], '知识 片段')
  assert.ok(!data.calls.includes(data.doc.path))
})

test('failed fulltext returns explicit catalog fallback and attachments preserve chosen source ids and truncation', async () => {
  const data = fixture('知识🙂'.repeat(100000), true)
  const fetcher: typeof fetch = (url, options) => String(url).startsWith('https://site.test/') ? data.fetcher(url, options) : Promise.reject(new Error('offline'))
  const snapshot = await new KnowledgeClient('https://site.test', { fetch: fetcher }).pin()
  const result = await snapshot.execute('search_documents', { query: '文档', scope: 'fulltext' })
  assert.equal((result.data.fulltext as { status: string }).status, 'failed')
  assert.equal((result.data.documents as unknown[]).length, 1)
  const metadata = await snapshot.document('测试-文档'); assert.equal(metadata.headings[1].section, 1)
  const selected = await snapshot.attachment('测试-文档', ['second'])
  assert.equal((selected.data.sections as unknown[]).length, 1)
  const direct = await snapshot.execute('get_document', { docId: '测试-文档', section: 1 })
  assert.equal(selected.sources![0].sourceId, direct.sources![0].sourceId)
  const large = await snapshot.attachment('测试-文档', ['first'])
  assert.ok(large.data.truncated); assert.ok(Buffer.byteLength(JSON.stringify(large)) <= KNOWLEDGE_TOOL_RESULT_BYTES)
  await assert.rejects(snapshot.attachment('测试-文档', ['missing']), /章节/)
})

test('oversized live search results fail within the 4 MiB boundary and retain catalog fallback', async () => {
  const data = fixture(undefined, true)
  const fetcher: typeof fetch = (url, options) => String(url).startsWith('https://site.test/')
    ? data.fetcher(url, options) : Promise.resolve(new Response(' '.repeat(4 * 1024 * 1024 + 1)))
  const snapshot = await new KnowledgeClient('https://site.test', { fetch: fetcher }).pin()
  const result = await snapshot.execute('search_documents', { query: '文档', scope: 'fulltext' })
  assert.equal((result.data.fulltext as { status: string }).status, 'failed')
  assert.equal((result.data.documents as unknown[]).length, 1)
})

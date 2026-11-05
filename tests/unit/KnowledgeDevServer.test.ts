import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, ViteDevServer } from 'vite'
import { describe, expect, it, vi } from 'vitest'
import type {
  KnowledgeManifest,
  KnowledgePublication,
} from '@/core/domain/knowledge/KnowledgePublication'
import { KnowledgeDevServer } from '@/platform/node/plugins/knowledge/KnowledgeDevServer'

const objectPath = `/ai/objects/${'a'.repeat(64)}.json`

function publication(): KnowledgePublication {
  const resource = { path: objectPath, sha256: 'a'.repeat(64), bytes: 2 }
  const manifest: KnowledgeManifest = {
    schemaVersion: 1,
    knowledgeBaseId: 'test',
    revision: 'revision',
    capabilities: ['catalog'],
    resources: { catalog: resource, graph: resource, clusters: resource },
  }
  return {
    manifest,
    assets: new Map([
      [objectPath, '{}'],
      ['/ai/manifest.json', JSON.stringify(manifest)],
    ]),
  }
}

function setup(generate: () => Promise<KnowledgePublication>) {
  const watcher = new EventEmitter()
  const logger = { error: vi.fn() }
  let handler: Connect.NextHandleFunction
  const server = {
    watcher,
    middlewares: {
      use(middleware: Connect.NextHandleFunction) {
        handler = middleware
      },
    },
    config: { logger },
  } as unknown as ViteDevServer
  new KnowledgeDevServer(generate).install(server)

  function request(url: string, method = 'GET') {
    const response = { writeHead: vi.fn(), end: vi.fn() }
    const next = vi.fn()
    const completion = Promise.resolve(handler(
      { url, method } as IncomingMessage,
      response as unknown as ServerResponse,
      next,
    ))
    return { response, next, completion }
  }

  return { watcher, logger, request }
}

describe('knowledge development resource routing', () => {
  it('leaves other routes alone and rejects unsupported requests without generating assets', async () => {
    const generate = vi.fn(async () => publication())
    const { request } = setup(generate)
    const unrelated = request('/doc/example.html')
    const malformed = request('/ai/objects/invalid.json')
    const unsupported = request('/ai/manifest.json', 'POST')
    await Promise.all([unrelated.completion, malformed.completion, unsupported.completion])

    expect(unrelated.next).toHaveBeenCalledOnce()
    expect(unrelated.response.writeHead).not.toHaveBeenCalled()
    expect(malformed.response.writeHead).toHaveBeenCalledWith(404)
    expect(unsupported.response.writeHead).toHaveBeenCalledWith(405)
    expect(generate).not.toHaveBeenCalled()
  })

  it('shares one generation and serves manifest and immutable objects with distinct cache rules', async () => {
    const pending = Promise.withResolvers<KnowledgePublication>()
    const generate = vi.fn(() => pending.promise)
    const { request } = setup(generate)
    const manifest = request('/ai/manifest.json?revision=latest')
    const object = request(objectPath, 'HEAD')
    pending.resolve(publication())
    await Promise.all([manifest.completion, object.completion])

    expect(generate).toHaveBeenCalledOnce()
    expect(manifest.response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
    })
    expect(manifest.response.end).toHaveBeenCalledWith(JSON.stringify(publication().manifest))
    expect(object.response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
    expect(object.response.end).toHaveBeenCalledWith(undefined)

    const absent = request(`/ai/objects/${'b'.repeat(64)}.json`)
    await absent.completion
    expect(absent.response.writeHead).toHaveBeenCalledWith(404)
  })

  it('rejects a generation invalidated during rendering and serves the next coherent snapshot', async () => {
    const pending = Promise.withResolvers<KnowledgePublication>()
    const generate = vi.fn()
      .mockImplementationOnce(() => pending.promise)
      .mockResolvedValue(publication())
    const { request, watcher } = setup(generate)
    const stale = request('/ai/manifest.json')
    watcher.emit('all', 'change', '/site/doc/changed.md')
    const fresh = request('/ai/manifest.json')
    pending.resolve(publication())
    await Promise.all([stale.completion, fresh.completion])

    expect(generate).toHaveBeenCalledTimes(2)
    expect(stale.response.writeHead).toHaveBeenCalledWith(503, { 'Retry-After': '1' })
    expect(fresh.response.writeHead).toHaveBeenCalledWith(200, expect.any(Object))
  })

  it('retains a valid cache for unrelated changes and retries a failed generation', async () => {
    const generate = vi.fn()
      .mockRejectedValueOnce(new Error('unavailable source'))
      .mockResolvedValue(publication())
    const { request, watcher, logger } = setup(generate)
    const failed = request('/ai/manifest.json')
    await failed.completion
    expect(failed.response.writeHead).toHaveBeenCalledWith(503)
    expect(failed.response.end).toHaveBeenCalledWith('Knowledge data is unavailable')
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('unavailable source'))

    await request('/ai/manifest.json').completion
    watcher.emit('all', 'change', '/site/doc/image.png')
    watcher.emit('all', 'change', '/site/node_modules/package/README.md')
    await request('/ai/manifest.json').completion
    expect(generate).toHaveBeenCalledTimes(2)
  })
})

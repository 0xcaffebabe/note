import { beforeEach, describe, expect, it, vi } from 'vitest'

const { send } = vi.hoisted(() => ({ send: vi.fn() }))

// 使用真实 v5 SDK，只替换 HTTP 传输，覆盖索引替换而不写入远端数据。
vi.mock('algoliasearch', async (importOriginal) => {
  const sdk = await importOriginal<typeof import('algoliasearch')>()
  return {
    ...sdk,
    algoliasearch: (appId: string, apiKey: string) => sdk.algoliasearch(appId, apiKey, {
      requester: { send },
    }),
  }
})

import { AlgoliaIndexer } from '@/adapters/node/AlgoliaIndexer'

function response(data: unknown, status = 200) {
  return { status, content: JSON.stringify(data), isTimedOut: false }
}

beforeEach(() => {
  send.mockReset()
  send.mockImplementation(async ({ method }) => response(
    method === 'GET' ? { status: 'published' } : { taskID: 1, objectIDs: [] },
  ))
})

describe('AlgoliaIndexer (真实 SDK)', () => {
  it('上传全部记录到临时索引，并保留配置后替换目标索引', async () => {
    const objects = [{ objectID: 'doc-1', url: '/Docker.html', segments: [{ id: '安装', txt: 'Docker' }] }]
    await new AlgoliaIndexer().replaceAllObjects('app-id', 'write-key', 'note', objects)

    const requests = send.mock.calls.map(([request]) => request)
    const copy = requests.find(({ url, data }) => url.includes('/note/operation') && JSON.parse(data).operation === 'copy')
    const copyData = JSON.parse(copy.data)
    expect(copyData).toMatchObject({ scope: ['settings', 'rules', 'synonyms'] })
    expect(copyData.destination).toMatch(/^note_tmp_/)

    const batch = requests.find(({ url }) => url.includes(`/${copyData.destination}/batch`))
    expect(JSON.parse(batch.data)).toEqual({ requests: [{ action: 'addObject', body: objects[0] }] })
    const move = requests.find(({ url, data }) => url.includes(`/${copyData.destination}/operation`) && JSON.parse(data).operation === 'move')
    expect(JSON.parse(move.data)).toEqual({ operation: 'move', destination: 'note' })
    expect(requests.some(({ method, url }) => method === 'GET' && url.includes('/task/'))).toBe(true)
  })

  it('上传失败时向调用方报错，并保留原索引', async () => {
    send.mockImplementation(async ({ method, url }) => url.includes('/batch')
      ? response({ message: 'upload denied' }, 403)
      : response(method === 'GET' ? { status: 'published' } : { taskID: 1 }))

    await expect(new AlgoliaIndexer().replaceAllObjects('app-id', 'write-key', 'note', [{ objectID: 'doc-1' }]))
      .rejects.toMatchObject({ message: 'upload denied' })

    const requests = send.mock.calls.map(([request]) => request)
    expect(requests.some(({ method, url }) => method === 'DELETE' && /\/note_tmp_/.test(url))).toBe(true)
    expect(requests.some(({ data }) => data && JSON.parse(data).operation === 'move')).toBe(false)
  })
})

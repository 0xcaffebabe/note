import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DocService } from '@/core/service/DocService'
import CacheService from '@/core/cache/CacheService'
import DocFileInfo from '@/core/domain/DocFileInfo'
import type { CachePort } from '@/core/ports/CachePort'

/*
 * 任务 D(DocService 拆子服务)的护栏测试。
 *
 * 拆分后 DocService 变成瘦门面, public 方法只委托到 core/service/doc/ 下的子服务,
 * 但 @cache 装饰器仍留在本类 public 方法上。@cache 在装饰期捕获的缓存作用域
 *   id = name()('doc-service') + '-' + 方法名
 * 必须与拆分前逐字节一致, 否则记忆化跨版本失配。
 *
 * 本测试构造一个真实 DocService(直接 new, 不经平台单例), 注入一个会记录每次
 * (id, cacheKey) 的 CachePort 包装, 断言:
 *  ① 各 @cache 方法实际写入的 scope id 恰为 'doc-service-<方法名>'(锁住作用域 id 不变);
 *  ② 第二次调用命中缓存, 底层 api/render 只被调用一次(委托没破坏记忆化);
 *  ③ getDocFileInfo 内部对 resolveMetadata 的再调用走的是 'doc-service-resolveMetadata'
 *     这一同一作用域(委托链上的缓存回调正确回指本类装饰方法)。
 */

// 记录所有写入缓存的 scope id, 用于断言作用域不变
function makeRecordingCache(): { port: CachePort; writtenIds: Set<string> } {
  const inner = new CacheService()
  const writtenIds = new Set<string>()
  const port: CachePort = {
    get: (id, key) => inner.get(id, key),
    has: (id, key) => inner.has(id, key),
    set: (id, key, val) => {
      writtenIds.add(id)
      inner.set(id, key, val)
    },
  }
  return { port, writtenIds }
}

function mkFile(id: string, content = '# 标题\n正文'): DocFileInfo {
  const f = new DocFileInfo()
  f.id = id
  f.content = content
  f.metadata = 'tags:\n  - a\n  - b'
  return f
}

describe('DocService 拆分后: @cache 作用域 id 与记忆化不变', () => {
  let cache: ReturnType<typeof makeRecordingCache>
  let renderSpy: ReturnType<typeof vi.fn>
  let getDocFileInfoSpy: ReturnType<typeof vi.fn>
  let svc: DocService

  beforeEach(() => {
    cache = makeRecordingCache()
    renderSpy = vi.fn((md: string, _docId: string) => `<rendered>${md}</rendered>`)
    getDocFileInfoSpy = vi.fn(async (id: string) => mkFile(id))

    const api: any = {
      getDocFileInfo: getDocFileInfoSpy,
      getDocCluster: vi.fn().mockResolvedValue([{ name: 'root', children: [] }]),
      getDocQualityData: vi.fn().mockResolvedValue([]),
    }
    const docRender: any = { render: renderSpy }
    const tagService: any = { getTagSumList: () => [] }
    const knowledgeService: any = { getAllLinks: () => [] }
    const storage: any = { getItem: () => null, setItem: () => {} }
    // 极简 DOM 端口: 仅满足 renderMdFromText 缓存路径不触达 DOM 的方法
    const dom: any = { parse: () => ({ querySelector: () => null, querySelectorAll: () => [] }) }
    const yaml: any = { load: (s: string) => (s ? { tags: ['a', 'b'] } : undefined) }

    svc = new DocService(api, docRender, tagService, knowledgeService, storage, dom, yaml, cache.port)
  })

  it('renderMdFromText 写入 scope id 恰为 doc-service-renderMdFromText 且记忆化', () => {
    const r1 = svc.renderMdFromText('# x', 'docA')
    const r2 = svc.renderMdFromText('# x', 'docA')
    expect(r1).toBe('<rendered># x</rendered>')
    expect(r2).toBe(r1)
    // 第二次命中缓存, 底层 render 只调用一次
    expect(renderSpy).toHaveBeenCalledTimes(1)
    expect(cache.writtenIds.has('doc-service-renderMdFromText')).toBe(true)
  })

  it('renderMd 写入 doc-service-renderMd; 空内容直接返回空串', () => {
    const file = mkFile('docB', '# y')
    expect(svc.renderMd(file)).toBe('<rendered># y</rendered>')
    expect(cache.writtenIds.has('doc-service-renderMd')).toBe(true)

    const empty = mkFile('docEmpty', '')
    expect(svc.renderMd(empty)).toBe('')
  })

  it('resolveTagList / resolveMetadata 各写入对应 doc-service 作用域', () => {
    const file = mkFile('docC')
    expect(svc.resolveTagList(file)).toEqual(['a', 'b'])
    expect(cache.writtenIds.has('doc-service-resolveTagList')).toBe(true)

    expect(svc.resolveMetadata(file)).toBeTruthy()
    expect(cache.writtenIds.has('doc-service-resolveMetadata')).toBe(true)
  })

  it('getDocFileInfo: 委托链内对 resolveMetadata 的再调用走同一 doc-service 作用域且只取一次源', async () => {
    const a = await svc.getDocFileInfo('docD')
    const b = await svc.getDocFileInfo('docD')
    expect(b).toBe(a)
    // getDocFileInfo 自身被缓存 → 源只取一次
    expect(getDocFileInfoSpy).toHaveBeenCalledTimes(1)
    expect(cache.writtenIds.has('doc-service-getDocFileInfo')).toBe(true)
    // 取文档时内部回调进入 resolveMetadata 的缓存作用域
    expect(cache.writtenIds.has('doc-service-resolveMetadata')).toBe(true)
  })

  it('getSimliarDoc 写入 doc-service-getSimliarDoc(未命中聚类时降级为空数组)', async () => {
    const r = await svc.getSimliarDoc('docE')
    expect(r).toEqual([])
    expect(cache.writtenIds.has('doc-service-getSimliarDoc')).toBe(true)
  })
})

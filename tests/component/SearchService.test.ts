import { describe, it, expect, vi } from 'vitest'

// 在网络边界 mock 掉 algoliasearch: 既让 PR(无密钥)也能跑 又仍然走 SearchService 真实的
// 高亮过滤 / kwContains / appendMissingKw / 记录过滤 逻辑(这些是私有函数 只能经 public search 覆盖)
const { indexSearch } = vi.hoisted(() => ({ indexSearch: vi.fn() }))
vi.mock('algoliasearch', () => ({
  default: vi.fn(() => ({ initIndex: () => ({ search: indexSearch }) })),
}))

import searchService from '@/service/SearchService'

// algolia 返回的 hit 结构: _highlightResult.segments[].{id,txt}.value 内嵌 <mark> 高亮
function hit(url: string, segments: Array<{ id: string; txt: string }>) {
  return {
    url,
    createTime: '2020-01-01',
    _highlightResult: {
      url: { value: url },
      segments: segments.map((s) => ({ id: { value: s.id }, txt: { value: s.txt } })),
    },
  }
}

// 每个用例用不同关键词: search 被 @cache 按 JSON.stringify([kw,'algolia']) 记忆 同词会命中缓存不再调 mock
describe('SearchService.search(algolia)', () => {
  it('命中: 返回高亮片段 + took', async () => {
    indexSearch.mockResolvedValueOnce({
      processingTimeMS: 7,
      hits: [hit('/运维/Docker.html', [{ id: '安装 <mark>Docker</mark>', txt: '<mark>Docker</mark> 是容器引擎' }])],
    })
    const r = await searchService.search('docker', 'algolia')
    expect(r.took).toBe(7)
    expect(r.list).toHaveLength(1)
    expect(r.list[0].url).toBe('/运维/Docker.html')
    expect(r.list[0].hilighedSegement).toHaveLength(1)
    expect(r.list[0].hilighedSegement![0].txt).toContain('<mark>')
  })

  it('过滤无高亮片段 并对缺失关键词打标', async () => {
    indexSearch.mockResolvedValueOnce({
      processingTimeMS: 1,
      hits: [
        hit('/运维/Docker.html', [
          { id: '纯文本标题', txt: '没有高亮的正文' }, // 无 <mark> 会被剔除
          { id: '<mark>docker</mark> 配置', txt: '关于 docker 的说明' },
        ]),
      ],
    })
    const r = await searchService.search('docker nginx', 'algolia')
    expect(r.list[0].hilighedSegement).toHaveLength(1) // 无高亮片段已过滤
    expect(r.list[0].hilighedSegement![0].missingKeywords).toEqual(['nginx']) // nginx 未出现
  })

  it('既无高亮片段、目录名又不含关键词的记录被丢弃', async () => {
    indexSearch.mockResolvedValueOnce({
      processingTimeMS: 1,
      hits: [hit('/运维/Docker.html', [{ id: 'plain', txt: 'plain text' }])],
    })
    const r = await searchService.search('zzz', 'algolia')
    expect(r.list).toHaveLength(0)
  })

  it('无高亮片段但目录名含关键词的记录保留', async () => {
    indexSearch.mockResolvedValueOnce({
      processingTimeMS: 1,
      hits: [hit('/运维/Kubernetes.html', [{ id: 'plain', txt: 'plain' }])],
    })
    const r = await searchService.search('kubernetes', 'algolia')
    expect(r.list).toHaveLength(1)
    expect(r.list[0].hilighedSegement).toHaveLength(0)
  })

  it('空响应返回空列表', async () => {
    indexSearch.mockResolvedValueOnce(undefined)
    const r = await searchService.search('emptyresp', 'algolia')
    expect(r).toEqual({ took: 0, list: [] })
  })
})

describe('SearchService.getQuerySuggestions', () => {
  it('透传 algolia 的 query suggestions', async () => {
    indexSearch.mockResolvedValueOnce({ hits: [{ query: 'docker' }, { query: 'nginx' }] })
    const r = await searchService.getQuerySuggestions('sugkw')
    expect(r.map((s) => s.query)).toEqual(['docker', 'nginx'])
  })
})

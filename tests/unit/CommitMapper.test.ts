import { describe, it, expect } from 'vitest'
import { logEntryToCommitInfo, mapVcsLog, filterIgnoredRaw, IGNORE_COMMITS } from '@/core/vcs/CommitMapper'
import type { VcsLogEntry } from '@/core/ports/VersionControlPort'

// 守护从 build/GitService 下沉到 CommitMapper 的提交映射/黑名单过滤(5 处重复收敛)。

const entry = (over: Partial<VcsLogEntry>): VcsLogEntry => ({
  hash: 'h', date: '2024-01-01', message: 'msg', author_name: 'a',
  diff: { insertions: 1, deletions: 2 }, ...over,
})

describe('logEntryToCommitInfo 字段映射(message 取首行)', () => {
  it('映射各字段, message 只取首行', () => {
    const c = logEntryToCommitInfo(entry({ message: 'title\nbody\nmore', hash: 'x' }))
    expect(c.message).toBe('title')
    expect(c.hash).toBe('x')
    expect(c.author).toBe('a')
    expect(c.insertions).toBe(1)
    expect(c.deletions).toBe(2)
  })
})

describe('mapVcsLog 映射 + 剔除 IGNORE_COMMITS(保序)', () => {
  it('剔除黑名单 hash, 其余保留且保持原序', () => {
    const entries = [entry({ hash: 'keep1' }), entry({ hash: IGNORE_COMMITS[0] }), entry({ hash: 'keep2' })]
    expect(mapVcsLog(entries).map(c => c.hash)).toEqual(['keep1', 'keep2'])
  })
  it('空 -> 空', () => {
    expect(mapVcsLog([])).toEqual([])
  })
})

describe('filterIgnoredRaw 只过滤不映射(保留原始 VcsLogEntry)', () => {
  it('剔除黑名单, 保留原始字段(author_name 等, 未映射成 CommitInfo)', () => {
    const entries = [entry({ hash: 'keep' }), entry({ hash: IGNORE_COMMITS[1] })]
    const out = filterIgnoredRaw(entries)
    expect(out).toHaveLength(1)
    expect(out[0].hash).toBe('keep')
    expect(out[0].author_name).toBe('a')
  })
})

describe('IGNORE_COMMITS 黑名单逐字稳定', () => {
  it('3 项不变(顺序/内容)', () => {
    expect(IGNORE_COMMITS).toEqual([
      '30588a462801b5266eb892031f254c0ee99322c2',
      '75b476d27b17e66b2aeb2de677900355a4439eec',
      '1fdb2124651cb796a587fd8fc3f238f96e29cb6c',
    ])
  })
})

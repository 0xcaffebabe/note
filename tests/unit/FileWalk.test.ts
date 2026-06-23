import { describe, it, expect } from 'vitest'
import { listAllFile, listFilesBySuffix, DEFAULT_IGNORE_PREFIXES } from '@/core/fs/FileWalk'
import type { FileSystemPort, FileStats, FileBytes } from '@/core/ports/FileSystemPort'

// 守护从 build/BaseService 下沉到 core/fs/FileWalk 的目录遍历(经 FileSystemPort, 行为逐字不变):
// 递归列文件 + 按路径段剪枝忽略目录 + 大小写不敏感后缀过滤。用内存 fs 桩驱动, 不碰真磁盘。

// tree: 路径 -> 子项名数组(目录) 或 undefined(文件)
function makeFs(tree: Record<string, string[] | undefined>): FileSystemPort {
  const isDir = (p: string) => Array.isArray(tree[p])
  return {
    readdirSync: (p) => tree[p] ?? [],
    lstatSync: (p): FileStats => ({ isDirectory: () => isDir(p), size: 0 }),
    readFile: async (): Promise<FileBytes> => ({ toString: () => '' }),
    stat: async (): Promise<FileStats> => ({ isDirectory: () => false, size: 0 }),
    existsSync: () => true,
    mkdirSync: () => {},
  }
}

const fs = makeFs({
  doc: ['a.md', 'b.txt', 'sub', 'node_modules'],
  'doc/sub': ['c.md'],
  'doc/node_modules': ['junk.md'], // 应被剪枝
})

describe('listAllFile 递归遍历 + 忽略目录剪枝', () => {
  it('非 ./ 路径: 子项前缀化为 path/child, 递归进子目录', () => {
    expect(listAllFile(fs, 'doc')).toEqual(['doc/a.md', 'doc/b.txt', 'doc/sub/c.md'])
  })

  it('命中 ignorePrefixs 的目录整棵跳过(node_modules)', () => {
    // doc/node_modules/junk.md 不应出现
    expect(listAllFile(fs, 'doc')).not.toContain('doc/node_modules/junk.md')
  })

  it('按路径段精确匹配, 不误伤以忽略名为前缀的目录', () => {
    const f = makeFs({ root: ['docker'], 'root/docker': ['x.md'] }) // 'docker' != 'doc'/.git 等
    expect(listAllFile(f, 'root')).toEqual(['root/docker/x.md'])
  })

  it('默认忽略表含 .git/node_modules/dist/test-results 等', () => {
    expect(DEFAULT_IGNORE_PREFIXES).toEqual(
      ['.git', 'node_modules', 'dist', 'doc/.agents', 'QWEN', 'test-results', 'playwright-report'],
    )
  })
})

describe('listFilesBySuffix 大小写不敏感后缀过滤', () => {
  it('只留 .md(含 .MD), 大小写不敏感', () => {
    const f = makeFs({ doc: ['a.md', 'B.MD', 'c.txt'] })
    expect(listFilesBySuffix(f, 'md', 'doc')).toEqual(['doc/a.md', 'doc/B.MD'])
  })

  it('遍历 doc 树只取 .md', () => {
    expect(listFilesBySuffix(fs, 'md', 'doc')).toEqual(['doc/a.md', 'doc/sub/c.md'])
  })
})

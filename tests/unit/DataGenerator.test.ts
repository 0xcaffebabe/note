import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { ResolvedConfig } from 'vite'
import DataGenerator from '@/platform/node/plugins/DataGenerator'

const { mappings } = vi.hoisted(() => ({
  mappings: [] as Array<{ name: string; path: string; type?: string; method: () => Promise<unknown> }>,
}))
vi.mock('@/platform/node/plugins/ApiMappings', () => ({ default: mappings }))

const dirs: string[] = []
afterEach(() => {
  mappings.length = 0
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'note-data-generator-'))
  dirs.push(dir)
  const plugin = DataGenerator()
  // 直接执行 Vite 生命周期钩子，不加载实际分词、git 或文档生成服务。
  const configure = plugin.configResolved as (config: ResolvedConfig) => void
  const build = plugin.buildStart as () => Promise<void>
  configure({ build: { outDir: dir } } as ResolvedConfig)
  return { dir, build }
}

describe('DataGenerator 构建生命周期', () => {
  it('等待全部异步 JSON 写入后才完成，并跳过 runtime API', async () => {
    let resolve!: (data: unknown) => void
    const slow = new Promise(done => { resolve = done })
    const runtime = vi.fn()
    mappings.push(
      { name: '文档聚类散点', path: '/docClusterScatter.json', type: 'build&runtime', method: () => slow },
      { name: '目录', path: '/category.json', type: 'build', method: async () => ['目录'] },
      { name: '运行时', path: '/runtime.json', type: 'runtime', method: runtime },
      { name: '其他', path: '/other.json', method: runtime },
    )
    const { dir, build } = setup()
    let finished = false
    const task = build().then(() => { finished = true })
    await vi.waitFor(() => expect(fs.existsSync(path.join(dir, 'category.json'))).toBe(true))
    expect(finished).toBe(false)
    const data = { points: [{ id: '测试' }], clusters: [] }
    resolve(data)
    await task
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'docClusterScatter.json'), 'utf8'))).toEqual(data)
    expect(runtime).not.toHaveBeenCalled()
  })

  it('生成失败使构建失败，且先等其余任务结束，错误包含数据名称、路径与原因', async () => {
    let resolve!: (data: unknown) => void
    const slow = new Promise(done => { resolve = done })
    const failure = new Error('invalid metadata')
    mappings.push(
      { name: '文档聚类散点', path: '/docClusterScatter.json', type: 'build', method: async () => { throw failure } },
      { name: '目录', path: '/category.json', type: 'build', method: () => slow },
    )
    const { dir, build } = setup()
    let settled = false
    const result = build().catch(error => { settled = true; return error })
    await new Promise(resolve => setImmediate(resolve))
    expect(settled).toBe(false)
    resolve(['目录'])
    const error = await result
    expect(error).toBeInstanceOf(AggregateError)
    expect(error.message).toContain('文档聚类散点构建异常 (/docClusterScatter.json): Error: invalid metadata')
    expect(error.errors[0].cause).toBe(failure)
    expect(fs.existsSync(path.join(dir, 'category.json'))).toBe(true)
  })

  it('JSON 无法写入时同样阻止构建成功', async () => {
    mappings.push({ name: '聚类', path: '/blocked.json', type: 'build', method: async () => ({ points: [] }) })
    const { dir, build } = setup()
    fs.mkdirSync(path.join(dir, 'blocked.json'))
    await expect(build()).rejects.toThrow('聚类构建异常 (/blocked.json)')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensureJieba } from '@/platform/node/scripts/ensureJieba.mjs'

const ok = { status: 0, stderr: '' }
const incompatible = { status: 1, stderr: 'GLIBC_2.38 not found' }

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('Linux nodejieba 安装校验', () => {
  it('Windows/macOS 不强制编译原生依赖', () => {
    const run = vi.fn()
    ensureJieba('win32', run)
    ensureJieba('darwin', run)
    expect(run).not.toHaveBeenCalled()
  })

  it('Linux 可正常分词时保留现有二进制', () => {
    const run = vi.fn().mockReturnValue(ok)
    ensureJieba('linux', run)
    expect(run).toHaveBeenCalledTimes(1)
    expect(run.mock.calls[0][1][1]).toContain("require('nodejieba').cut(text)")
  })

  it('GLIBC 加载失败时针对 nodejieba 源码编译，并再次实际分词验证', () => {
    vi.stubEnv('npm_execpath', '/npm/npm-cli.js')
    const run = vi.fn().mockReturnValueOnce(incompatible).mockReturnValueOnce(ok).mockReturnValueOnce(ok)
    ensureJieba('linux', run)
    expect(run).toHaveBeenCalledTimes(3)
    expect(run.mock.calls[1][1]).toEqual(['/npm/npm-cli.js', 'rebuild', 'nodejieba'])
    expect(run.mock.calls[1][2].env.npm_config_build_from_source).toBe('true')
    expect(run.mock.calls[2]).toEqual(run.mock.calls[0])
  })

  it('编译失败不能使安装误报成功', () => {
    vi.stubEnv('npm_execpath', '/npm/npm-cli.js')
    const run = vi.fn().mockReturnValueOnce(incompatible).mockReturnValueOnce({ status: 1 })
    expect(() => ensureJieba('linux', run)).toThrow('源码编译失败')
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('编译退出成功但原生模块仍不可用时阻止安装完成', () => {
    vi.stubEnv('npm_execpath', '/npm/npm-cli.js')
    const run = vi.fn().mockReturnValueOnce(incompatible).mockReturnValueOnce(ok).mockReturnValueOnce(incompatible)
    expect(() => ensureJieba('linux', run)).toThrow('重新编译后仍无法分词')
  })
})

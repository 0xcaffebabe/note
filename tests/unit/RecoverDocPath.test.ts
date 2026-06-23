/**
 * 兜底路由自愈纯逻辑 (@/core/routing/recoverDocPath) 单测
 *
 * 背景: CDN(Cloudflare Pages)对 /xxx.html 做 308 去后缀重定向, 且 Location 头未按 RFC-3986
 * 编码中文(原始 UTF-8 字节被浏览器按 Latin-1 误读), 刷新/直访文档页会落到乱码无后缀路径,
 * 进 404 前 recoverDocPath 尝试: 修复 Latin-1 双重编码 + 为真实存在的文档补回 .html。
 *
 * 该逻辑已从 src/route/index.ts(会拉入 vue-router + 全部页面, 过重)抽出为纯函数, 通过参数
 * 注入 docIdExists(原走 CategoryService 目录)使其无需任何页面/服务依赖即可单测。
 * 这里覆盖: decodeURIComponent 抛错->404 分支 / 合法路径->自愈重定向 / 目录加载失败容错 / query 修复。
 *
 * to 仅消费 path/query/hash 三个字段, 故以最小对象 + as any 模拟 RouteLocationNormalized。
 */
import { describe, it, expect, vi } from 'vitest'
import { recoverDocPath } from '@/core/routing/recoverDocPath'

// 构造一个落到乱码路径的 to: 中文 UTF-8 字节被按 Latin-1 误读, 无 .html 后缀
function mojibakePath(realPath: string): string {
  return Buffer.from(realPath, 'utf8').toString('latin1')
}

// 最小路由对象: 只填 recoverDocPath 真正读取的字段
function makeTo(path: string, query: Record<string, any> = {}, hash = ''): any {
  return { path, query, hash }
}

describe('recoverDocPath - decodeURIComponent 抛错 -> 直接 404 分支', () => {
  it('路径含非法 %XX 序列时 decodeURIComponent 抛错, 返回 true(放行到 404)', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    // %E0%A4%A 是被截断的多字节序列 decodeURIComponent 会抛 URIError
    const res = await recoverDocPath(makeTo('/%E0%A4%A'), exists)
    expect(res).toBe(true)
    // 非法路径无从判定, 连目录校验都不该触发
    expect(exists).not.toHaveBeenCalled()
  })

  it('路径含非法十六进制(如 %zz)同样抛错 -> 返回 true', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const res = await recoverDocPath(makeTo('/%zz'), exists)
    expect(res).toBe(true)
    expect(exists).not.toHaveBeenCalled()
  })

  it('孤立的 % 结尾 -> 抛错 -> 返回 true', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const res = await recoverDocPath(makeTo('/foo%'), exists)
    expect(res).toBe(true)
  })
})

describe('recoverDocPath - 合法路径自愈成功 -> 返回重定向对象', () => {
  it('乱码无后缀路径 + 文档存在 -> 修复中文并补回 .html', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const to = makeTo(mojibakePath('/软件工程/架构'))
    const res = await recoverDocPath(to, exists)
    expect(res).toEqual({
      path: '/软件工程/架构.html',
      query: {},
      hash: '',
      replace: true,
    })
  })

  it('已带 .html 的乱码路径 -> 不重复追加后缀', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const to = makeTo(mojibakePath('/软件工程/架构.html'))
    const res: any = await recoverDocPath(to, exists)
    expect(res).not.toBe(true)
    expect(res.path).toBe('/软件工程/架构.html')
  })

  it('普通无后缀英文路径 + 文档存在 -> 补回 .html(无乱码也走自愈)', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const res: any = await recoverDocPath(makeTo('/docker/install'), exists)
    expect(res).not.toBe(true)
    expect(res.path).toBe('/docker/install.html')
    expect(res.replace).toBe(true)
  })

  it('结尾多余斜杠会被剥除后再补 .html', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const res: any = await recoverDocPath(makeTo('/docker/install///'), exists)
    expect(res.path).toBe('/docker/install.html')
  })

  it('保留 hash 原样透传', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const res: any = await recoverDocPath(makeTo('/docker/install', {}, '#section'), exists)
    expect(res.hash).toBe('#section')
  })
})

describe('recoverDocPath - 文档不存在 -> 返回 true(放行 404)', () => {
  it('decode 成功但目录中无此文档 -> 返回 true', async () => {
    const exists = vi.fn().mockResolvedValue(false)
    const res = await recoverDocPath(makeTo('/不存在的/文档'), exists)
    expect(res).toBe(true)
    // 应已用补全 .html 后路径推导的 docId 去查目录
    expect(exists).toHaveBeenCalledTimes(1)
  })
})

describe('recoverDocPath - 目录加载失败(docIdExists 抛错)容错', () => {
  it('确认乱码特征(repaired 非空)时 仍跳转自愈地址', async () => {
    const exists = vi.fn().mockRejectedValue(new Error('网络异常'))
    const to = makeTo(mojibakePath('/软件工程/架构'))
    const res: any = await recoverDocPath(to, exists)
    // 乱码已修复 -> 离线也敢跳
    expect(res).not.toBe(true)
    expect(res.path).toBe('/软件工程/架构.html')
  })

  it('无乱码特征(repaired 为空)且校验失败 -> 保守放行 404', async () => {
    const exists = vi.fn().mockRejectedValue(new Error('网络异常'))
    const res = await recoverDocPath(makeTo('/docker/install'), exists)
    expect(res).toBe(true)
  })
})

describe('recoverDocPath - query 值乱码一并修复', () => {
  it('字符串 query 值(如 headingId)的 Latin-1 乱码被还原', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const headingMojibake = mojibakePath('依赖关系规则')
    const to = makeTo('/docker/install', { headingId: headingMojibake })
    const res: any = await recoverDocPath(to, exists)
    expect(res.query.headingId).toBe('依赖关系规则')
  })

  it('数组 query 值逐项修复', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const to = makeTo('/docker/install', { tag: [mojibakePath('中文'), 'plain'] })
    const res: any = await recoverDocPath(to, exists)
    expect(res.query.tag).toEqual(['中文', 'plain'])
  })

  it('非字符串 query 值(null/数字经路由后通常为 null)原样保留', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const to = makeTo('/docker/install', { flag: null })
    const res: any = await recoverDocPath(to, exists)
    expect(res.query.flag).toBeNull()
  })

  it('无乱码的普通 query 值原样保留', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    const to = makeTo('/docker/install', { page: '2' })
    const res: any = await recoverDocPath(to, exists)
    expect(res.query.page).toBe('2')
  })
})

describe('recoverDocPath - docIdExists 入参 = 补全后路径推导的 docId', () => {
  it('传入 docIdExists 的 id 由 .html 路径(htmlUrl2Id 规则)推导', async () => {
    const exists = vi.fn().mockResolvedValue(true)
    await recoverDocPath(makeTo('/a/b'), exists)
    // htmlUrl2Id('/a/b.html') -> 去前导斜杠 去 .html 后以 '-' 连接层级 => 'a-b'
    expect(exists).toHaveBeenCalledWith('a-b')
  })
})

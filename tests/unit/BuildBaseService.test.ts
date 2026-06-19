import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import BaseService from '@/build/BaseService'

// BaseService 是构建期扫描文件系统的底座: listAllFile 递归收集文件,
// listFilesBySuffix 在其上按后缀过滤(文档生成器靠它找出全部 .md)。
// 本套件用 fs.mkdtempSync 在系统临时目录里搭一棵真实目录树(含嵌套子目录、
// 多种大小写后缀、以及名为 node_modules / QWEN 的忽略前缀目录), 守护:
//   1) 递归能下钻到任意深度的嵌套文件;
//   2) 后缀过滤对"全小写传参"会同时命中小写与全大写扩展名(其大小写策略的现状);
//   3) ignorePrefixs 的剪枝行为(及其已知边界缺陷)。
// 注意源码用 path.startsWith(prefix) 做剪枝, prefix 是裸相对名(如 'node_modules'),
// 因此当传入的是「绝对路径」根时, 嵌套的同名忽略目录并不会被剪掉 —— 这是已知 BUG,
// 下方以 characterization 测试锁定现状。

// 把绝对路径里的 root 段抹掉, 方便对结果做稳定断言(不依赖随机临时目录名)
let root: string
const rel = (p: string) => p.replace(root, '<ROOT>')

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'base-service-test-'))

  // 顶层文件: 同名不同大小写后缀, 用于验证后缀过滤的大小写策略
  fs.writeFileSync(path.join(root, 'a.md'), '# a')
  fs.writeFileSync(path.join(root, 'b.MD'), '# b')   // 全大写扩展名
  fs.writeFileSync(path.join(root, 'c.Md'), '# c')   // 混合大小写扩展名
  fs.writeFileSync(path.join(root, 'd.txt'), 'plain')

  // 一层嵌套
  fs.mkdirSync(path.join(root, 'sub'))
  fs.writeFileSync(path.join(root, 'sub', 'nested.md'), '# nested')
  fs.writeFileSync(path.join(root, 'sub', 'note.txt'), 'plain')

  // 二层嵌套, 验证递归能下钻多层
  fs.mkdirSync(path.join(root, 'sub', 'deep'))
  fs.writeFileSync(path.join(root, 'sub', 'deep', 'deep.md'), '# deep')

  // 忽略前缀目录(裸相对名命中 ignorePrefixs)
  fs.mkdirSync(path.join(root, 'node_modules'))
  fs.writeFileSync(path.join(root, 'node_modules', 'ignored.md'), '# should-be-ignored')
  fs.mkdirSync(path.join(root, 'QWEN'))
  fs.writeFileSync(path.join(root, 'QWEN', 'ignored2.md'), '# should-be-ignored')
})

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

describe('BaseService.listAllFile 递归收集文件', () => {
  it('递归下钻到任意深度, 收齐所有嵌套文件', () => {
    const files = BaseService.listAllFile(root).map(rel)
    // 顶层
    expect(files).toContain('<ROOT>/a.md')
    expect(files).toContain('<ROOT>/d.txt')
    // 一层嵌套
    expect(files).toContain('<ROOT>/sub/nested.md')
    expect(files).toContain('<ROOT>/sub/note.txt')
    // 二层嵌套(证明真递归而非只看一层)
    expect(files).toContain('<ROOT>/sub/deep/deep.md')
  })

  it('返回的是文件全路径而非目录: 结果里不含 sub / sub/deep 这些目录本身', () => {
    const files = BaseService.listAllFile(root).map(rel)
    expect(files).not.toContain('<ROOT>/sub')
    expect(files).not.toContain('<ROOT>/sub/deep')
    // 每个返回项都应是一个真实存在的文件(非目录)
    for (const f of BaseService.listAllFile(root)) {
      expect(fs.lstatSync(f).isFile()).toBe(true)
    }
  })

  it('传入的路径本身命中 ignorePrefixs 时, 直接返回空数组(剪枝在前缀匹配时生效)', () => {
    // 这些裸相对名 startsWith 某个忽略前缀 -> 不读盘, 直接返回 []
    expect(BaseService.listAllFile('node_modules')).toEqual([])
    expect(BaseService.listAllFile('node_modules/foo')).toEqual([])
    expect(BaseService.listAllFile('.git')).toEqual([])
    expect(BaseService.listAllFile('dist')).toEqual([])
    expect(BaseService.listAllFile('QWEN')).toEqual([])
    expect(BaseService.listAllFile('doc/.agents')).toEqual([])
  })

  it('已知 BUG: 以绝对路径为根时, 嵌套的忽略前缀目录不会被剪掉(其内文件照样被收入)（锁定现状, 待修复后更新断言）', () => {
    // 剪枝用 path.startsWith('node_modules') 这类裸前缀比较, 但此处子目录的完整路径是
    // <ROOT>/node_modules、<ROOT>/QWEN, 并不以裸前缀开头, 故剪枝失效, 忽略目录被穿透。
    const files = BaseService.listAllFile(root).map(rel)
    expect(files).toContain('<ROOT>/node_modules/ignored.md') // 本应被忽略却仍出现
    expect(files).toContain('<ROOT>/QWEN/ignored2.md')        // 同上
  })
})

describe('BaseService.listFilesBySuffix 按后缀过滤', () => {
  it('全小写传参命中小写与全大写扩展名, 但不命中混合大小写扩展名', () => {
    const md = BaseService.listFilesBySuffix('md', root).map(rel)
    expect(md).toContain('<ROOT>/a.md')           // .md 小写命中
    expect(md).toContain('<ROOT>/b.MD')           // .MD 全大写也命中
    expect(md).toContain('<ROOT>/sub/nested.md')  // 嵌套同样被过滤进来
    expect(md).toContain('<ROOT>/sub/deep/deep.md')
    // 过滤策略为 endsWith('.md') || endsWith('.MD'), 所以混合大小写 .Md 漏网, 非 md 文件排除
    expect(md).not.toContain('<ROOT>/c.Md')
    expect(md).not.toContain('<ROOT>/d.txt')
    expect(md).not.toContain('<ROOT>/sub/note.txt')
  })

  it('已知 BUG: 大小写并非真正不敏感 —— .Md 这类混合大小写扩展名永远匹配不到（锁定现状, 待修复后更新断言）', () => {
    // 源码只比对「原样后缀」与「全大写后缀」两种, 缺少 toLowerCase 归一,
    // 因此 .Md / .mD 等混合大小写一律漏掉。
    const md = BaseService.listFilesBySuffix('md', root).map(rel)
    expect(md.some((f) => f.endsWith('c.Md'))).toBe(false)
  })

  it('已知 BUG: 传入大写后缀 MD 时只命中 .MD, 反而漏掉小写 .md（锁定现状, 待修复后更新断言）', () => {
    // 过滤条件 endsWith('.'+suffix) || endsWith('.'+suffix.toUpperCase()) 在 suffix='MD' 时
    // 两个分支都等于 '.MD', 于是小写 .md 全部漏掉。
    const md = BaseService.listFilesBySuffix('MD', root).map(rel)
    expect(md).toContain('<ROOT>/b.MD')
    expect(md).not.toContain('<ROOT>/a.md')
    expect(md).not.toContain('<ROOT>/sub/nested.md')
  })

  it('普通后缀(txt)只过滤出对应文件, 含嵌套', () => {
    const txt = BaseService.listFilesBySuffix('txt', root).map(rel)
    expect(txt).toContain('<ROOT>/d.txt')
    expect(txt).toContain('<ROOT>/sub/note.txt')
    expect(txt).not.toContain('<ROOT>/a.md')
    // 仅 .txt
    for (const f of txt) expect(f.endsWith('.txt') || f.endsWith('.TXT')).toBe(true)
  })

  it('无匹配后缀返回空数组', () => {
    expect(BaseService.listFilesBySuffix('json', root)).toEqual([])
  })
})

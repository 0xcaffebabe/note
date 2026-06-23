import { describe, it, expect } from 'vitest'
import {
  parseGitShow,
  isValidCommitSegementHead,
  isValidCommitSegementHeadWithIndex,
  isGitDiffFileDesc,
} from "@/core/vcs/GitDiffParse"

/*
 * GitService 的 `git show` diff 解析纯函数测试。
 *
 * parseGitShow 接收 `git show <hash>` 的原始文本(在 gitShowUseHash 中已先经 octal2Chinese
 * 把八进制转义的文件名还原为中文), 用手写的向前看(look-ahead)逻辑逐行扫描:
 *  - 遇到 'diff --git' 且其后第 4 或第 5 行是有效 hunk 头(@@ ... @@) 时, 视为一个文件块的开始,
 *    从该行提取文件名(去掉 a/ 前缀与引号)。
 *  - 以 '-' / '+' 开头且不是 '--- a/xxx' / '+++ b/xxx' 文件描述行的行, 计入删除 / 新增。
 *  - 没有有效 hunk 头的块(纯重命名 / 模式变更 / 二进制) 被跳过, 不切换 currentFile。
 *  - 最终把同名文件的多个 changeItem 合并到同一个 Map 键下。
 *
 * 这里用贴近真实 `git show` 输出的样本(含引号包裹的中文文件名、多文件块、无 hunk 块)逐项锁定行为,
 * 并对若干微妙的当前真实行为以「已知 BUG」形式做特征化(不修复)。
 */

// 拼装一个真实的 git show 文件块的便捷函数
function block(file: string, hunkHeader: string, lines: string[]): string[] {
  return [
    `diff --git a/${file} b/${file}`,
    'index 1111111..2222222 100644',
    `--- a/${file}`,
    `+++ b/${file}`,
    hunkHeader,
    ...lines,
  ]
}

describe('isValidCommitSegementHead 判定一行是否为有效 hunk 头', () => {
  it('以 @@ 开头且第 3 位之后还有第二个 @@ 视为有效', () => {
    expect(isValidCommitSegementHead('@@ -31,70 +31,155 @@')).toBe(true)
    expect(isValidCommitSegementHead('@@ -1 +1 @@ some ctx')).toBe(true)
  })
  it('只有一个 @@ 或不以 @@ 开头则无效', () => {
    expect(isValidCommitSegementHead('@@ -1 +1')).toBe(false)
    expect(isValidCommitSegementHead('+ not a hunk @@')).toBe(false)
  })
  it('空串安全返回 false', () => {
    expect(isValidCommitSegementHead('')).toBe(false)
    // @ts-expect-error 显式探测 undefined 入参的空值保护
    expect(isValidCommitSegementHead(undefined)).toBe(false)
  })
})

describe('isValidCommitSegementHeadWithIndex 向前看第 4/5 行是否为 hunk 头', () => {
  const head = '@@ -1 +1 @@'
  it('hunk 头出现在 index+4 时命中', () => {
    const arr = ['diff', 'index', '---', '+++', head]
    expect(isValidCommitSegementHeadWithIndex(0, arr)).toBe(true)
  })
  it('hunk 头出现在 index+5 时命中(多一行模式头的情形)', () => {
    const arr = ['diff', 'old mode', 'new mode', 'index', '---', head]
    expect(isValidCommitSegementHeadWithIndex(0, arr)).toBe(true)
  })
  it('窗口内(+4/+5)都不是 hunk 头则不命中', () => {
    const arr = ['diff', 'index', '---', '+++', 'not a hunk', 'still not']
    expect(isValidCommitSegementHeadWithIndex(0, arr)).toBe(false)
  })
  it('越界(数组太短)安全返回 false 不抛异常', () => {
    expect(isValidCommitSegementHeadWithIndex(0, ['diff', 'index'])).toBe(false)
  })
})

describe('isGitDiffFileDesc 识别 +++/--- 文件描述行', () => {
  it('含当前文件名且以 --- / +++ 开头的行视为文件描述行', () => {
    expect(isGitDiffFileDesc('--- a/src/A.ts', 'src/A.ts')).toBe(true)
    expect(isGitDiffFileDesc('+++ b/src/A.ts', 'src/A.ts')).toBe(true)
  })
  it('不含当前文件名则不是文件描述行(于是会被当成普通增删行)', () => {
    expect(isGitDiffFileDesc('--- 删掉的内容', 'src/A.ts')).toBe(false)
  })
  it('以 -/+ 开头但不是三连符号(普通正文增删)不算文件描述行', () => {
    expect(isGitDiffFileDesc('-old line', 'old')).toBe(false)
  })
})

describe('parseGitShow 解析 git show 原始 diff', () => {
  it('解析单文件块的新增与删除行(去掉行首单个 +/- 符号)', () => {
    const raw = block('src/A.ts', '@@ -1,3 +1,4 @@ ctx', [
      ' keep',
      '-old line',
      '+new line',
      '+another new',
    ]).join('\n')
    const map = parseGitShow(raw)
    expect([...map.keys()]).toEqual(['src/A.ts'])
    const items = map.get('src/A.ts')!
    expect(items).toHaveLength(1)
    expect(items[0].deletions).toEqual(['old line'])
    expect(items[0].insertions).toEqual(['new line', 'another new'])
    expect(items[0].filename).toBe('src/A.ts')
  })

  it('引号包裹的中文文件名: 去掉 a/ 前缀与所有引号', () => {
    const raw = [
      ...block('"笔记/读书.md"', '@@ -10,2 +10,2 @@', ['-删除的中文', '+新增的中文']),
    ].join('\n')
    const map = parseGitShow(raw)
    // 文件名提取自 'diff --git "a/笔记/读书.md" ...', split(' ')[2] 取到 '"a/笔记/读书.md"'
    // 再 replace a/ 与去引号 => '笔记/读书.md'
    expect([...map.keys()]).toEqual(['笔记/读书.md'])
    const item = map.get('笔记/读书.md')![0]
    expect(item.deletions).toEqual(['删除的中文'])
    expect(item.insertions).toEqual(['新增的中文'])
  })

  it('多个不同文件块各自成一个 Map 键, 顺序保持', () => {
    const raw = [
      ...block('src/A.ts', '@@ -1 +1 @@', ['-a', '+b']),
      ...block('src/B.ts', '@@ -2 +2 @@', ['-c', '+d', '+e']),
    ].join('\n')
    const map = parseGitShow(raw)
    expect([...map.keys()]).toEqual(['src/A.ts', 'src/B.ts'])
    expect(map.get('src/A.ts')![0].insertions).toEqual(['b'])
    expect(map.get('src/B.ts')![0].insertions).toEqual(['d', 'e'])
    expect(map.get('src/B.ts')![0].deletions).toEqual(['c'])
  })

  it('同一文件名出现在多个 diff 块时合并到同一键下(数组追加, 不覆盖)', () => {
    const raw = [
      ...block('dup.ts', '@@ -1 +1 @@', ['-x', '+y']),
      ...block('dup.ts', '@@ -5 +5 @@', ['-p', '+q']),
    ].join('\n')
    const map = parseGitShow(raw)
    expect([...map.keys()]).toEqual(['dup.ts'])
    const items = map.get('dup.ts')!
    expect(items).toHaveLength(2)
    expect(items[0].insertions).toEqual(['y'])
    expect(items[0].deletions).toEqual(['x'])
    expect(items[1].insertions).toEqual(['q'])
    expect(items[1].deletions).toEqual(['p'])
  })

  it('没有有效 @@ hunk 头的块被跳过(如纯重命名/模式变更)', () => {
    const raw = [
      'diff --git a/old.ts b/renamed.ts',
      'similarity index 100%',
      'rename from old.ts',
      'rename to renamed.ts',
      ...block('real.ts', '@@ -1 +1 @@', ['-a', '+b']),
    ].join('\n')
    const map = parseGitShow(raw)
    // 重命名块没有 hunk, 不会成为键; 只有 real.ts 这个真实改动块入表
    expect([...map.keys()]).toEqual(['real.ts'])
    expect(map.get('real.ts')![0].insertions).toEqual(['b'])
  })

  it('属于当前文件的 --- a/xxx 与 +++ b/xxx 描述行不计入增删', () => {
    const raw = block('foo.ts', '@@ -1 +1 @@', ['-real del', '+real add']).join('\n')
    const map = parseGitShow(raw)
    const item = map.get('foo.ts')![0]
    // 仅正文 -real del / +real add 计入, 文件描述行 --- a/foo.ts / +++ b/foo.ts 被排除
    expect(item.deletions).toEqual(['real del'])
    expect(item.insertions).toEqual(['real add'])
  })

  it('空字符串返回空 Map', () => {
    const map = parseGitShow('')
    expect(map.size).toBe(0)
    expect([...map.keys()]).toEqual([])
  })

  it('只有提交头/无任何 diff 块时返回空 Map', () => {
    const raw = [
      'commit abcdef0123456789',
      'Author: 张三 <a@b.com>',
      'Date:   Wed Jun 17 16:32:00 2026 +0800',
      '',
      '    feat: 一些提交信息',
      '',
    ].join('\n')
    expect(parseGitShow(raw).size).toBe(0)
  })

  // 以 '--- ' / '+++ ' 开头的行是 diff 的文件描述头格式(无论是否含当前文件名),
  // 修复后一律不计入增删, 避免残留 '-- ' / '++ ' 前缀污染构建期统计。
  it('正文中 --- / +++ 开头的行按文件描述头排除, 不计入增删', () => {
    const raw = block('bar.ts', '@@ -1 +1 @@', [
      '--- 文档分隔线',
      '+++ 加号注释',
    ]).join('\n')
    const item = parseGitShow(raw).get('bar.ts')![0]
    expect(item.deletions).toEqual([])
    expect(item.insertions).toEqual([])
  })

  // 当一个 diff --git 块缺少有效 hunk 头(窗口内无 @@), 修复后 currentFile 被重置,
  // 该块后续的 +/- 行不再泄漏并入上一个文件(也不归属本块, 因本块未成为有效文件)。
  it('无 hunk 头的块后续增删行不再泄漏并入上一个文件', () => {
    const raw = [
      ...block('first.ts', '@@ -1 +1 @@', ['-aa', '+bb']),
      'diff --git a/second.ts b/second.ts',
      'Binary files a/second.ts and b/second.ts differ',
      '+leaked plus',
    ].join('\n')
    const map = parseGitShow(raw)
    expect([...map.keys()]).toEqual(['first.ts'])
    // 'leaked plus' 属于无效的 second.ts 块, 不再被并入 first.ts 的新增
    expect(map.get('first.ts')![0].insertions).toEqual(['bb'])
  })
})

import { describe, it, expect } from 'vitest'
import UrlUtils from '@/util/UrlUtils'

// 路由自愈链路的纯逻辑底座 必须随提交门禁运行(快、无网络、无密钥)
describe('UrlUtils.concatUrl', () => {
  it('两边都有斜杠时去重', () => {
    expect(UrlUtils.concatUrl('a/', '/b')).toBe('a/b')
  })
  it('两边都没斜杠时补一个', () => {
    expect(UrlUtils.concatUrl('a', 'b')).toBe('a/b')
  })
  it('仅一边有斜杠时原样拼接', () => {
    expect(UrlUtils.concatUrl('a/', 'b')).toBe('a/b')
    expect(UrlUtils.concatUrl('a', '/b')).toBe('a/b')
  })
  it('多段连续拼接', () => {
    // 对齐既有 src/test/UrlUtils.test.ts 的口径
    expect(UrlUtils.concatUrl('abcc/', '/fds', 'dsadas', 'dsadas')).toBe('abcc/fds/dsadas/dsadas')
  })
  it('单段或空入参', () => {
    expect(UrlUtils.concatUrl('a')).toBe('a')
    expect(UrlUtils.concatUrl()).toBe('')
  })
})

describe('UrlUtils.repairLatin1Mojibake', () => {
  it('还原 CDN 308 造成的 Latin-1 双重编码乱码', () => {
    const mojibake = Buffer.from('/软件工程/架构', 'utf8').toString('latin1')
    expect(UrlUtils.repairLatin1Mojibake(mojibake)).toBe('/软件工程/架构')
  })
  it('正常中文路径不误伤(码点超 0xFF)', () => {
    expect(UrlUtils.repairLatin1Mojibake('/软件工程/架构')).toBeNull()
  })
  it('纯 ASCII 不误伤', () => {
    expect(UrlUtils.repairLatin1Mojibake('/home.html')).toBeNull()
  })
  it('真 Latin-1 文本(café 非合法 UTF-8)不误伤', () => {
    expect(UrlUtils.repairLatin1Mojibake('café')).toBeNull()
  })
  it('空串不误伤', () => {
    expect(UrlUtils.repairLatin1Mojibake('')).toBeNull()
  })
  it('查询值乱码也能还原(headingId 场景)', () => {
    const mojibake = Buffer.from('依赖关系规则', 'utf8').toString('latin1')
    expect(UrlUtils.repairLatin1Mojibake(mojibake)).toBe('依赖关系规则')
  })
})

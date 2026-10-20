import { describe, it, expect } from 'vitest'
import { YAMLException } from 'js-yaml'
import { JsYamlAdapter } from '@/adapters/libs/JsYamlAdapter'

const yaml = new JsYamlAdapter()

describe('JsYamlAdapter', () => {
  it('解析文档元数据，保留标签和合法的 falsy 值', () => {
    expect(yaml.load('name: 示例\ntags: [java, spring]\nlevel: 0\nvisible: false')).toEqual({
      name: '示例',
      tags: ['java', 'spring'],
      level: 0,
      visible: false,
    })
  })

  it.each(['', ' \t\r\n', '# 只有注释\n', '\uFEFF\n# 注释\n'])('空 YAML 流 %j 返回 undefined', (content) => {
    expect(yaml.load(content)).toBeUndefined()
  })

  it.each(['null', '~', '---\n'])('显式空文档 %j 返回 null', (content) => {
    expect(yaml.load(content)).toBeNull()
  })

  it('保留字面量字符串 undefined', () => {
    expect(yaml.load('undefined')).toBe('undefined')
  })

  it('无效 YAML 仍然抛出解析错误', () => {
    expect(() => yaml.load('tags: [unclosed')).toThrow(YAMLException)
  })

  it('拒绝多个文档，避免静默忽略额外元数据', () => {
    expect(() => yaml.load('name: first\n---\nname: second')).toThrow(YAMLException)
  })
})

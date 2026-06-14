import { describe, it, expect } from 'vitest'
import Slugger, { slugify } from '@/util/Slugger'

// 标题锚点是 TOC 跳转 / ?headingId 路由定位 / MindGraph 节点同步的公共键
// slugify 的归一规则与 Slugger 的去重序号一旦漂移, 所有锚点链接会集体失配
describe('slugify 归一', () => {
  it('去 markdown #、空白转连字符、转小写', () => {
    expect(slugify('## Hello World')).toBe('hello-world')
  })
  it('保留中文, 标点剔除', () => {
    expect(slugify('中文 标题!')).toBe('中文-标题')
  })
  it('剥离 HTML 标签只留文本', () => {
    expect(slugify('<b>Tag</b> Title')).toBe('tag-title')
  })
  it('连续空白折叠为单个连字符', () => {
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
  })
  it('首尾连字符被裁掉', () => {
    expect(slugify('-a-b-')).toBe('a-b')
    expect(slugify('!!!hello!!!')).toBe('hello')
  })
  it('点号等标点直接删除(不留分隔)', () => {
    expect(slugify('a.b.c')).toBe('abc')
  })
  it('归一后为空时回退到 heading 兜底', () => {
    expect(slugify('   ')).toBe('heading')
    expect(slugify('***')).toBe('heading')
  })
})

describe('Slugger 同名去重', () => {
  it('同一标题重复出现追加递增序号', () => {
    const s = new Slugger()
    expect(s.slug('Intro')).toBe('intro')
    expect(s.slug('Intro')).toBe('intro-1')
    expect(s.slug('Intro')).toBe('intro-2')
  })
  it('不同标题各自独立计数', () => {
    const s = new Slugger()
    expect(s.slug('A')).toBe('a')
    expect(s.slug('B')).toBe('b')
    expect(s.slug('A')).toBe('a-1')
  })
  it('每个实例的去重状态相互隔离', () => {
    const a = new Slugger()
    const b = new Slugger()
    expect(a.slug('X')).toBe('x')
    expect(b.slug('X')).toBe('x') // 不受 a 影响
  })
  it('无法 slug 的标题各自基于 heading 兜底再去重(不全塌成同一个)', () => {
    const s = new Slugger()
    expect([s.slug('   '), s.slug('***'), s.slug('!!!')]).toEqual(['heading', 'heading-1', 'heading-2'])
  })
})

// 特征(characterization)测试: 锁定当前真实行为, 其中含已知缺陷; 一旦修复源码这些断言会失败, 需有意更新
describe('Slugger 已知缺陷(锚点唯一性隐患)', () => {
  it('[BUG] 显式编号标题与自动序号冲突, 产出重复锚点', () => {
    // occur 只按 base 计数, 不检测候选 base-seq 是否已被占用 -> 锚点碰撞
    const s = new Slugger()
    expect(s.slug('Intro')).toBe('intro')
    expect(s.slug('Intro 1')).toBe('intro-1')
    expect(s.slug('Intro')).toBe('intro-1') // 与上一行重复! 期望应为 intro-2
  })
  it('[BUG] 标题含游离 < 与后续 > 之间的正文被贪婪当作标签吞掉', () => {
    expect(slugify('<unclosed text>here')).toBe('here') // 'unclosed text' 丢失
    expect(slugify('a < b')).toBe('a-b') // 无闭合 > 时则正常
  })
})

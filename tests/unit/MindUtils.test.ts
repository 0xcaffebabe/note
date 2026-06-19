import { describe, it, expect } from 'vitest'
import { MindUtils } from '@/pages/doc/mind/MindUtils'
import type Content from '@/dto/Content'

/**
 * 本套件守护 MindUtils.mindConvert —— 把目录树(Content[])转成思维导图节点(MindNode[])。
 * 关注点(也是回归高发区):
 * 1. 字段重命名: 输入 DTO 真实字段名是拼错的 `chidren`(非 children),转换后必须输出正确的 `children`;
 *    若有人"顺手"把 src 里的 i.chidren 改成 i.children,递归会丢光所有子节点,本测试用 `chidren` 作输入锁死契约。
 * 2. direction 交替规则: counter 是每次递归调用内部的局部变量(从 0 起),所以
 *    - 同级兄弟在同一数组内 right/left/right/... 交替;
 *    - 不同父节点的「堂兄弟」各自从 right 重新开始(counter 不跨递归累计)。
 *    这是用户最容易误以为"全局连续编号"的地方,故重点覆盖。
 * 3. 顶层包裹规则: 顶层节点数 >1 时包一层 {id:'root', topic:rootTopic} 作为根;
 *    恰好 1 个时不包裹(直接返回裸节点);空数组返回 []。
 * 4. rootTopic 默认 '目录',可自定义,且仅在发生包裹时生效。
 *
 * 断言均基于真实当前行为(已用 tsx 探针核对),非臆测。
 */

// 构造 Content 节点的小助手(显式带上拼错的真实字段名 chidren)
function c(name: string, link: string, chidren: Content[] = []): Content {
  return { name, link, chidren, level: -1 } as Content
}

describe('MindUtils.mindConvert 字段映射(chidren -> children)', () => {
  it('输入用真实拼错字段 chidren,输出为正确的 children 且递归生效', () => {
    const toc = [
      c('父', 'p', [c('子', 's', [c('孙', 'g')])]),
    ]
    const out = MindUtils.mindConvert(toc)
    // 顶层只有 1 个 -> 不包裹,直接是「父」节点本身
    expect(out).toHaveLength(1)
    const father = out[0]
    expect(father.id).toBe('p')
    expect(father.topic).toBe('父')
    // children 字段名正确,且子/孙逐层递归映射
    expect(father.children).toHaveLength(1)
    expect(father.children[0].id).toBe('s')
    expect(father.children[0].children).toHaveLength(1)
    expect(father.children[0].children[0].id).toBe('g')
    expect(father.children[0].children[0].topic).toBe('孙')
    // 叶子节点 children 为空数组(而非 undefined)
    expect(father.children[0].children[0].children).toEqual([])
  })

  it('节点上既无 children 也不应出现 chidren 残留(只产出规范字段)', () => {
    const out = MindUtils.mindConvert([c('唯一', 'u')])
    const node = out[0] as Record<string, unknown>
    expect(node).toHaveProperty('children')
    expect(node).not.toHaveProperty('chidren')
    expect(node.id).toBe('u')
    expect(node.topic).toBe('唯一')
  })
})

describe('MindUtils.mindConvert direction 交替(局部计数器)', () => {
  it('同级兄弟在同一数组内 right/left/right... 交替', () => {
    // 3 个顶层 -> 会被包裹,真实兄弟序列在 root.children 里
    const toc = [c('A', 'a'), c('B', 'b'), c('C', 'c')]
    const out = MindUtils.mindConvert(toc)
    const siblings = out[0].children
    expect(siblings.map((n) => n.direction)).toEqual(['right', 'left', 'right'])
  })

  it('不同父节点的堂兄弟各自从 right 重新开始(计数器不跨递归累计)', () => {
    const toc = [
      c('A', 'a', [c('A1', 'a1'), c('A2', 'a2'), c('A3', 'a3')]),
      c('B', 'b', [c('B1', 'b1'), c('B2', 'b2')]),
    ]
    const out = MindUtils.mindConvert(toc)
    const [a, b] = out[0].children
    // A 的孩子: right/left/right
    expect(a.children.map((n) => n.direction)).toEqual(['right', 'left', 'right'])
    // B 的孩子: 重新从 right 起 -> right/left (而非接着 A 的计数继续)
    expect(b.children.map((n) => n.direction)).toEqual(['right', 'left'])
    // 顶层 A/B 本身作为同级也交替 right/left
    expect(a.direction).toBe('right')
    expect(b.direction).toBe('left')
  })

  it('单个顶层节点(不包裹)其自身 direction 为 right(局部计数从 0)', () => {
    const out = MindUtils.mindConvert([c('只我', 'me')])
    expect(out[0].direction).toBe('right')
  })
})

describe('MindUtils.mindConvert 顶层包裹规则', () => {
  it('顶层数量 > 1 时包裹成 root 节点', () => {
    const out = MindUtils.mindConvert([c('A', 'a'), c('B', 'b')])
    expect(out).toHaveLength(1)
    const root = out[0]
    expect(root.id).toBe('root')
    expect(root.topic).toBe('目录')
    expect(root.expanded).toBe(true)
    expect(root.direction).toBe('left')
    expect(root.children).toHaveLength(2)
    expect(root.children.map((n) => n.id)).toEqual(['a', 'b'])
  })

  it('顶层恰好 1 个时不包裹,直接返回该裸节点(无 root/无 expanded)', () => {
    const out = MindUtils.mindConvert([c('独苗', 'solo')])
    expect(out).toHaveLength(1)
    const node = out[0] as Record<string, unknown>
    expect(node.id).toBe('solo')
    expect(node.topic).toBe('独苗')
    // 不包裹分支不会写 expanded 字段
    expect(node).not.toHaveProperty('expanded')
    expect(node.id).not.toBe('root')
  })

  it('空数组输入返回空数组(既不报错也不生成 root)', () => {
    expect(MindUtils.mindConvert([])).toEqual([])
  })
})

describe('MindUtils.mindConvert rootTopic 参数', () => {
  it('默认 rootTopic 为「目录」', () => {
    const out = MindUtils.mindConvert([c('A', 'a'), c('B', 'b')])
    expect(out[0].topic).toBe('目录')
  })

  it('自定义 rootTopic 在发生包裹时生效', () => {
    const out = MindUtils.mindConvert([c('A', 'a'), c('B', 'b')], '我的导图')
    expect(out[0].id).toBe('root')
    expect(out[0].topic).toBe('我的导图')
  })

  it('单节点不包裹时 rootTopic 被忽略(不会改写裸节点 topic)', () => {
    const out = MindUtils.mindConvert([c('真实标题', 'x')], '我的导图')
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('x')
    // rootTopic 仅作用于 root 包裹节点,裸节点保留自身 topic
    expect(out[0].topic).toBe('真实标题')
  })
})

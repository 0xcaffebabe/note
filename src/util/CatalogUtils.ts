import Category from '@/dto/Category'
import categoryService from '@/service/CategoryService'
import { slugify } from './Slugger'

// 名称开头的连续 emoji 簇(含 ZWJ 序列/变体选择符/肤色修饰符/keycap), 用作分类图标
// ‍=ZWJ ️=变体选择符16 ⃣=keycap \u{1F3FB}-\u{1F3FF}=肤色修饰符
const LEADING_EMOJI_RE = /^(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*[\u{1F3FB}-\u{1F3FF}]*⃣?)+/u
// 全量 emoji 相关码点(剥离时用), 比 LEADING_EMOJI_RE 宽松, 仅用于生成纯文字 slug
const EMOJI_CHARS_RE = /[\p{Extended_Pictographic}‍️⃣\u{1F3FB}-\u{1F3FF}]/gu

/**
 * 取名称开头的 emoji 作为图标(无则空串)
 * 项目分类名形如「💎算法与数据结构」「👨‍💻编程语言」(后者含零宽连字符)
 */
export function leadingEmoji(name: string): string {
  const m = (name || '').match(LEADING_EMOJI_RE)
  return m ? m[0] : ''
}

/**
 * 去除名称中的 emoji 与零宽连字符, 返回纯文字
 */
export function stripEmoji(name: string): string {
  return (name || '').replace(EMOJI_CHARS_RE, '').trim()
}

/**
 * 由分类名生成稳定的锚点 slug
 * 注意: 不能直接用 Slugger.slugify —— 它不剥 emoji(「💎算法…」会原样保留 emoji),
 * 会让锚点/IntersectionObserver/深链静默失效; 这里先剥 emoji 再 slug
 */
export function categorySlug(name: string): string {
  return slugify(stripEmoji(name)) || 'cat'
}

/**
 * 递归统计分类下「有链接的文档」数(纯分组节点不计)
 * 口径与 HomeQuickAccess 的 countDocs 一致, 保证同一分类首页与总目录页数字不打架
 * (区别于 Category.childrenSize —— 后者统计所有后代节点含分组节点)
 */
export function countDocs(cat: Category): number {
  let count = cat.link ? 1 : 0
  for (const child of cat.chidren || []) {
    count += countDocs(child)
  }
  return count
}

/**
 * 判断节点是否匹配过滤词, 个别节点链接异常(decodeURI 失败)不应中断渲染
 */
export function safeMatch(node: Category, kw: string): boolean {
  try {
    return categoryService.categoryIsMatch(node, kw)
  } catch {
    return false
  }
}

// 与 CategoryTree.vue 的 renderName 同源(HTML 转义 + 正则转义), 复制以避免新页引入侧边栏组件
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 渲染目录名: 字面命中片段用 <mark> 高亮, 仅拼音命中(无法定位字面位置)时整名用 .pinyin-hit 主色
 * 与 CategoryTree.renderName 行为一致, pinyinHit 由调用方经 safeMatch 预先算好
 */
export function highlightName(name: string, filterText: string, pinyinHit: boolean): string {
  const escaped = escapeHtml(name || '')
  const kw = (filterText || '').trim()
  if (!kw) {
    return escaped
  }
  let literalHit = false
  let html = escaped
  for (const k of kw.split(' ').filter(v => v)) {
    const reg = new RegExp(escapeRegExp(escapeHtml(k)), 'gi')
    html = html.replace(reg, (s: string) => {
      literalHit = true
      return `<mark>${s}</mark>`
    })
  }
  if (literalHit) {
    return html
  }
  if (pinyinHit) {
    return `<span class="pinyin-hit">${escaped}</span>`
  }
  return escaped
}

import Category from '../domain/Category'
import DocUtils from './DocUtils'

/**
 * 目录树通用算法(纯逻辑): 父链、查找、计数、相邻、按谓词过滤裁剪。
 * 匹配规则由调用方以回调注入(matcher), 故 core 不依赖 CategoryService。
 */

/** 从某节点沿 parent 上溯, 返回 root→该节点 的链。对应 DocBreadcrumbNav.getCategoryChain。 */
export function parentChain(value: Category): Category[] {
  const chain: Category[] = [value]
  while (value.parent) {
    chain.push(value.parent)
    value = value.parent
  }
  return chain.reverse()
}

/** 深度优先按 link 查找节点。对应 DocTabNav.findTarget。 */
export function findByLink(list: Category[] | undefined, link: string): Category | null {
  if (!list) {
    return null
  }
  for (const cate of list) {
    if (cate.link == link) {
      return cate
    }
    const fromChildren = findByLink(cate.chidren, link)
    if (fromChildren) {
      return fromChildren
    }
  }
  return null
}

/** 统计子树中"有链接"的节点数(含自身)。对应 HomeQuickAccess.countDocs。 */
export function countLeaves(cat: Category): number {
  let count = cat.link ? 1 : 0
  for (const child of cat.chidren || []) {
    count += countLeaves(child)
  }
  return count
}

/** 子树中第一个有链接节点的 .html 规范地址(空串表示无)。对应 HomeQuickAccess.firstDoc。 */
export function firstLeafHtmlPath(cat: Category): string {
  if (cat.link) {
    return DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(cat.link))
  }
  for (const child of cat.chidren || []) {
    const found = firstLeafHtmlPath(child)
    if (found) {
      return found
    }
  }
  return ''
}

/** 在按阅读序展开的文档列表里, 取与 docId 相邻的上一/下一篇。对应 DocPrevNext。 */
export function adjacentByDocId(orderedList: Category[], docId: string): { prev: Category | null; next: Category | null } {
  const i = orderedList.findIndex(c => DocUtils.docUrl2Id(c.link) == docId)
  return {
    prev: i > 0 ? orderedList[i - 1] : null,
    next: i >= 0 && i < orderedList.length - 1 ? orderedList[i + 1] : null,
  }
}

/**
 * 按谓词裁剪目录树: 保留"自身命中或任一后代命中"的节点, 克隆返回避免污染原树。
 * matcher 由调用方注入(通常是 categoryService.categoryIsMatch 绑定关键词)。
 * markShow=true 时给克隆节点置 show=true(配合 CategoryTree 懒渲染)。
 * 对应 CategoryList.filterTree 与 CatalogPage.filterTree。
 */
export function filterCategoryTree(
  list: Category[],
  matcher: (cate: Category) => boolean,
  markShow = false,
): Category[] {
  const result: Category[] = []
  for (const cate of list) {
    const children = filterCategoryTree(cate.chidren || [], matcher, markShow)
    if (children.length !== 0 || matcher(cate)) {
      const clone = new Category()
      clone.name = cate.name
      clone.link = cate.link
      clone.parent = cate.parent
      clone.chidren = children
      if (markShow) {
        clone.show = true
      }
      result.push(clone)
    }
  }
  return result
}

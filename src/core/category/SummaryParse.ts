import Category from '../domain/Category'
import type { MarkdownPort, DomParserPort } from '../ports'

// SUMMARY.md 目录解析(平台无关, 端口注入)。build 与 runtime 共用同一口径——
// 消除两端历史分叉(原 runtime 的 resolveCategory 对 section 类目误把首个后代 <a> 的
// href 当作该 section 的 link; 此处采用 build 的正确口径: section 不取后代链接)。
// 不设 parent(可被 JSON.stringify 为 category.json, 无循环引用); 需要父链导航的运行期
// 解析后另调 assignParents。

export function resolveCategory(cate: Element): Category {
  const category = new Category()
  category.name = cate.firstChild?.textContent || '';
  const children = Array.from(cate.getElementsByTagName("ul")[0]?.children || []).filter(v => v.tagName == 'LI')
  category.link = cate.querySelector(':first-child')?.getAttribute('href')! ||
                    cate.querySelector(':first-child')?.querySelector('a')?.getAttribute('href')!
  if (!children || children.length == 0) {
    category.link = cate.querySelector('a')?.getAttribute("href")!
    return category
  }
  for (let i = 0; i < children.length; i++) {
    const c = resolveCategory(children[i])
    category.chidren.push(c)
  }
  return category
}

export function categoryParse(html: string, dom: DomParserPort): Category[] {
  const doc = dom.parse(html)
  const topCate = doc.querySelectorAll('body > ul > li')
  const categoryList: Category[] = []
  for (let i = 0; i < topCate.length; i++) {
    categoryList.push(resolveCategory(topCate[i]))
  }
  return categoryList
}

export function parseSummary(md: string, markdown: MarkdownPort, dom: DomParserPort): Category[] {
  return categoryParse(markdown.render(md), dom)
}

/** 为已解析的目录树递归设置 parent 指针(父链/面包屑导航用)。构建期不调用(避免序列化循环引用)。 */
export function assignParents(categories: Category[]): void {
  const stack = [...categories]
  while (stack.length != 0) {
    const category = stack.pop()
    if (category?.chidren) {
      category.chidren.forEach(i => i.parent = category)
      stack.push(...category.chidren)
    }
  }
}

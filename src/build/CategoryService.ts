import Category from "../dto/Category";
import BaseService from "./BaseService";
import {marked} from 'marked'
import fs from 'fs';
import {JSDOM} from 'jsdom';

/**
 * 纯函数 seam: 把 SUMMARY.md(markdown 文本)解析为嵌套目录树。
 * marked 渲染为 HTML 后用 JSDOM 解析 body>ul>li, 递归还原 Category 树。
 * 无文件系统 / 无单例依赖, 可直接单测。getCategoryList 与原私有 categoryParse 均委托此实现。
 */
export function parseSummary(md: string): Category[] {
  const html = marked(md) as string;
  return categoryParse(html);
}

export function categoryParse(html: string): Category[] {
  const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body></html>`)
  const elm = dom.window.document.body
  const topCate = elm.querySelectorAll('body > ul > li')
  const categoryList: Category[] = []
  for (let i = 0; i < topCate.length; i++) {
    categoryList.push(resolveCategory(topCate[i]))
  }
  return categoryList
}

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
    // c.parent = category
    category.chidren.push(c)
  }
  return category
}

class CategoryService extends BaseService {
  private static dom = new JSDOM()
  private static instance: CategoryService

  public static newInstance(): CategoryService {
    if (!this.instance) {
      this.instance = new CategoryService()
    }
    return this.instance
  }
  /**
   *
   * 获取当前文档的目录列表
   * @return {*}  {Promise<Category[]>}
   * @memberof CategoryService
   */
   public async getCategoryList() : Promise<Category[]>{
     const rawData = (await fs.promises.readFile('doc/SUMMARY.md')).toString();
     const home = new Category();
     home.name = '首页';
     home.link = './README.md';
     return [
       home,
       ...parseSummary(rawData)
     ]
   }

   private categoryParse(html: string): Category[]{
    return categoryParse(html)
  }

  private resolveCategory(cate: Element): Category {
    return resolveCategory(cate)
  }
}

export default CategoryService.newInstance()

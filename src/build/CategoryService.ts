import Category from "../dto/Category";
import BaseService from "./BaseService";
import {marked} from 'marked'
import fs from 'fs';
import {JSDOM} from 'jsdom';

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
     const html = marked(rawData);
     const home = new Category();
     home.name = '首页';
     home.link = './README.md';
     return [
       home,
       ...this.categoryParse(html)
     ]
   }

   private categoryParse(html: string): Category[]{
    const dom =  new JSDOM(`<!DOCTYPE html><body>${html}</body></html>`)
    const elm = dom.window.document
    const topCate = elm.querySelectorAll('body > ul > li')
    const categoryList: Category[] = []
    for(let i = 0;i<topCate.length;i++){
      categoryList.push(this.resolveCategory(topCate[i]))
    }
    return categoryList
  }

  private resolveCategory(cate: Element): Category {
    const category = new Category()
    category.name = cate.firstChild?.textContent || '';
    category.link = cate.querySelector('a')?.getAttribute("href")!
    const children = cate.querySelector("ul")?.querySelectorAll(':scope > li')
    if (!children) {
      return category
    }
    for(let i = 0;i<children.length;i++){
      const c = this.resolveCategory(children[i])
      // c.parent = category
      category.chidren.push(c)
    }
    return category
  }
}

export default CategoryService.newInstance()
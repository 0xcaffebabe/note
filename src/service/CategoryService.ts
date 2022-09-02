import {marked} from 'marked'
import api from '@/api'
import Category from '@/dto/Category'
import Cacheable from '@/decorator/Cacheable'
import Cache from '@/decorator/Cache'
import { PinyinUtils } from '@/util/PinyinUtils'
const cache = Cache()

const searchRecordKey = 'category-service::search-record-list';
class CategoryService implements Cacheable {

  private static instance : CategoryService

  private constructor(){}
  name(): string {
    return 'category-service'
  }

  public static getInstance(){
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
  @cache
  public async getCategoryList() : Promise<Category[]>{
    const rawData = await api.getCategory()
    const html = marked(rawData.content)
    const home = new Category();
    home.name = '首页';
    home.link = './README.md';
    return [
      home,
      ...this.categoryParse(html)
    ]
  }

  /**
   *
   * 获取编译过后的文档目录列表
   * @return {*}  {Promise<Category[]>}
   * @memberof CategoryService
   */
  @cache
  public async getCompiledCategoryList(): Promise<Category[]> {
    const categoryList = await api.getCompiledCategory();
    const stack = [...categoryList]
    // 设置目录父目录
    while(stack.length != 0) {
      const category = stack.pop()
      if (category?.chidren) {
        category.chidren.forEach(i => i.parent = category)
        stack.push(...category.chidren)
      }
    }
    return categoryList
  }


  /**
   *
   * 记录目录搜索点击记录
   * @param {Category} cate
   * @memberof CategoryService
   */
  public addCategorySearchRecord(cate: Category) {
    const rawData = localStorage.getItem(searchRecordKey)
    let searchRecordList :Category[] = []
    if (rawData) {
      searchRecordList = JSON.parse(rawData)
    }
    const index = searchRecordList.findIndex(v => v.link == cate.link)
    if (index != -1) {
      searchRecordList.splice(index, 1)
    }
    searchRecordList.push(cate);
    if (searchRecordList.length > 20) {
      searchRecordList.shift()
    }
    localStorage.setItem(searchRecordKey, JSON.stringify(searchRecordList))
  }


  /**
   *
   * 获取目录搜索点击记录
   * @return {*}  {Category[]}
   * @memberof CategoryService
   */
  public getCategorySearchRecords(): Category[] {
    const rawData = localStorage.getItem(searchRecordKey)
    let searchRecordList :Category[] = []
    if (rawData) {
      searchRecordList = JSON.parse(rawData)
    }
    searchRecordList = searchRecordList.reverse();
    return searchRecordList;
  }

  /**
   *
   * 判断目录是否匹配搜索字符串
   * @param {Category} category
   * @param {string} queryString
   * @return {*}  {boolean}
   * @memberof CategoryService
   */
  public categoryIsMatch(category: Category, queryString: string): boolean {
    const kwList = queryString.split(" ")
    let allMatched = true
    for(let kw of kwList) {
      allMatched &&= this.categoryNameIsMatch(category, kw) || this.categoryLinkIsMatch(category, kw)
    }
    return allMatched
  }

  private categoryLinkIsMatch(category: Category, queryString: string): boolean {
    const link = decodeURI(category.link).replace(/\//gi, '')
    return link.toLowerCase().indexOf(queryString.toLowerCase()) != -1 || // 目录名包含完全匹配
            PinyinUtils.fullPinyinContains(link, queryString) || // 目录名包含拼音完全匹配
            PinyinUtils.firstLetterPinyinContains(link, queryString)  // 目录名包含拼音首字母匹配
  }
  
  private categoryNameIsMatch(category: Category, queryString: string): boolean {
    return category.name?.toLowerCase().indexOf(queryString.toLowerCase()) != -1 || // 文档名包含完全匹配
            PinyinUtils.fullPinyinContains(category.name, queryString) || // 文档名包含拼音完全匹配
            PinyinUtils.firstLetterPinyinContains(category.name, queryString)  // 文档名包含拼音首字母匹配
  }

  private categoryParse(html: string): Category[]{
    const elm = new DOMParser().parseFromString(html, 'text/html')
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
      c.parent = category
      category.chidren.push(c)
    }
    return category
  }
}

export default CategoryService.getInstance()
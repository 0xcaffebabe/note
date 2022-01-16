import {marked} from 'marked'
import api from '@/api'
import Category from '@/dto/Category'
import Cacheable from '@/decorator/Cacheable'
import Cache from '@/decorator/Cache'
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
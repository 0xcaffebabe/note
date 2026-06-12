import {marked} from 'marked'
import api from '@/api'
import Category from '@/dto/Category'
import Cacheable from '@/decorator/Cacheable'
import Cache from '@/decorator/Cache'
import { PinyinUtils } from '@/util/PinyinUtils'
const cache = Cache()

const searchRecordKey = 'category-service::search-record-list';

/**
 * 目录节点的匹配索引缓存项
 * 预先算好小写字面串与拼音变体(全拼+首字母 含多音字展开) 匹配时只做字符串包含判断
 */
interface CategoryMatchIndex {
  // 小写文档名(name可能为空 保留可选语义)
  nameLower?: string
  // 去除路径分隔符后的小写链接
  linkLower: string
  namePinyin: PinyinUtils.PinyinIndex
  linkPinyin: PinyinUtils.PinyinIndex
}

class CategoryService implements Cacheable {

  private static instance : CategoryService

  private cahedCategoryList: Category[] = []

  // 目录匹配索引缓存 key为name+link 编译目录时预热 未命中时首次访问构建
  private matchIndexCache = new Map<string, CategoryMatchIndex>()

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
    const html = marked(rawData.content) as string
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
    // 设置目录父目录 同时预热每个节点的拼音匹配索引
    while(stack.length != 0) {
      const category = stack.pop()
      if (category) {
        try {
          this.getMatchIndex(category)
        } catch (e) {
          // 个别节点链接异常(如decodeURI失败)不应阻断目录加载 留到匹配时再处理
          console.warn('预热目录拼音索引失败', category.name, e)
        }
      }
      if (category?.chidren) {
        category.chidren.forEach(i => i.parent = category)
        stack.push(...category.chidren)
      }
    }
    this.cahedCategoryList = categoryList
    return categoryList
  }

  /**
   *
   * 获取平铺开的目录列表
   * @return {*}  {Promise<Category[]>}
   * @memberof CategoryService
   */
  @cache
  public async getFlatCategoryList(): Promise<Category[]> {
    const categoryList = await this.getCompiledCategoryList();
    const res:Category[] = []
    const stack = [...categoryList];
    while(stack.length != 0) {
      const category = stack.pop();
      if (category?.link) {
        res.push(category);
      }
      if (category?.chidren) {
        stack.push(...category.chidren)
      }
    }
    return res;
  }

  /**
   *
   * 按目录树自然阅读顺序展开的文档列表(用于上一篇/下一篇等线性导航)
   * @return {*}  {Promise<Category[]>}
   * @memberof CategoryService
   */
  @cache
  public async getOrderedDocList(): Promise<Category[]> {
    const categoryList = await this.getCompiledCategoryList();
    const res: Category[] = []
    const walk = (list: Category[]) => {
      for (const category of list) {
        if (category.link) {
          res.push(category)
        }
        if (category.chidren?.length) {
          walk(category.chidren)
        }
      }
    }
    walk(categoryList)
    return res
  }

  public getCategory(predicate: (cate :Category) => boolean): Category[] {
    const stack: Category[] = [...this.cahedCategoryList];
    const result: Category[] = []
    while(stack.length != 0) {
      const i = stack.pop()!;
      if (predicate(i)) {
        result.push(i);
      }
      stack.push(...i.chidren);
    }
    return result;
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
    const index = this.getMatchIndex(category)
    const kwList = queryString.split(" ")
    let allMatched = true
    for(const kw of kwList) {
      allMatched &&= this.categoryNameIsMatch(index, kw) || this.categoryLinkIsMatch(index, kw)
    }
    return allMatched
  }

  /**
   *
   * 获取目录节点的匹配索引 优先读缓存 未命中时构建并缓存
   * @param {Category} category
   * @return {*}  {CategoryMatchIndex}
   * @memberof CategoryService
   */
  private getMatchIndex(category: Category): CategoryMatchIndex {
    const key = category.name + '\n' + category.link
    let index = this.matchIndexCache.get(key)
    if (!index) {
      const link = decodeURI(category.link).replace(/\//gi, '')
      index = {
        nameLower: category.name?.toLowerCase(),
        linkLower: link.toLowerCase(),
        namePinyin: PinyinUtils.buildIndex(category.name || ''),
        linkPinyin: PinyinUtils.buildIndex(link)
      }
      this.matchIndexCache.set(key, index)
    }
    return index
  }

  private categoryLinkIsMatch(index: CategoryMatchIndex, queryString: string): boolean {
    return index.linkLower.indexOf(queryString.toLowerCase()) != -1 || // 目录名包含完全匹配
            PinyinUtils.indexFullContains(index.linkPinyin, queryString) || // 目录名包含拼音完全匹配
            PinyinUtils.indexFirstLetterContains(index.linkPinyin, queryString)  // 目录名包含拼音首字母匹配
  }

  private categoryNameIsMatch(index: CategoryMatchIndex, queryString: string): boolean {
    return index.nameLower?.indexOf(queryString.toLowerCase()) != -1 || // 文档名包含完全匹配
            PinyinUtils.indexFullContains(index.namePinyin, queryString) || // 文档名包含拼音完全匹配
            PinyinUtils.indexFirstLetterContains(index.namePinyin, queryString)  // 文档名包含拼音首字母匹配
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
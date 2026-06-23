import Category from '../domain/Category'
import Cacheable from '../cache/Cacheable'
import Cache from '../cache/Cache'
import type { CachePort } from '../ports/CachePort'
import { Pinyin, PinyinIndex } from '../util/Pinyin'
import type { Api } from '../data/Api'
import type { MarkdownPort, DomParserPort, StoragePort } from '../ports'
import { categoryParse, assignParents } from '../category/SummaryParse'

const cache = Cache()

const searchRecordKey = 'category-service::search-record-list'

/**
 * 目录节点的匹配索引缓存项
 */
interface CategoryMatchIndex {
  nameLower?: string
  linkLower: string
  namePinyin: PinyinIndex
  linkPinyin: PinyinIndex
}

/**
 * 目录树管理: 解析 SUMMARY、维护层级、拼音匹配。
 * marked/DOMParser/localStorage/tiny-pinyin 全部经端口注入。
 */
export class CategoryService implements Cacheable {
  private cahedCategoryList: Category[] = []
  private matchIndexCache = new Map<string, CategoryMatchIndex>()

  constructor(
    private readonly api: Api,
    private readonly markdown: MarkdownPort,
    private readonly dom: DomParserPort,
    private readonly storage: StoragePort,
    private readonly pinyin: Pinyin,
    private readonly cache: CachePort,
  ) {}

  name(): string {
    return 'category-service'
  }

  @cache
  public async getCategoryList(): Promise<Category[]> {
    const rawData = await this.api.getCategory()
    const html = this.markdown.render(rawData.content)
    const home = new Category()
    home.name = '首页'
    home.link = './README.md'
    const list = [home, ...categoryParse(html, this.dom)]
    assignParents(list)
    return list
  }

  @cache
  public async getCompiledCategoryList(): Promise<Category[]> {
    const categoryList = await this.api.getCompiledCategory()
    const stack = [...categoryList]
    while (stack.length != 0) {
      const category = stack.pop()
      if (category) {
        try {
          this.getMatchIndex(category)
        } catch (e) {
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

  @cache
  public async getFlatCategoryList(): Promise<Category[]> {
    const categoryList = await this.getCompiledCategoryList()
    const res: Category[] = []
    const stack = [...categoryList]
    while (stack.length != 0) {
      const category = stack.pop()
      if (category?.link) {
        res.push(category)
      }
      if (category?.chidren) {
        stack.push(...category.chidren)
      }
    }
    return res
  }

  @cache
  public async getOrderedDocList(): Promise<Category[]> {
    const categoryList = await this.getCompiledCategoryList()
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

  public getCategory(predicate: (cate: Category) => boolean): Category[] {
    const stack: Category[] = [...this.cahedCategoryList]
    const result: Category[] = []
    while (stack.length != 0) {
      const i = stack.pop()!
      if (predicate(i)) {
        result.push(i)
      }
      stack.push(...i.chidren)
    }
    return result
  }

  public addCategorySearchRecord(cate: Category) {
    const rawData = this.storage.getItem(searchRecordKey)
    let searchRecordList: Category[] = []
    if (rawData) {
      searchRecordList = JSON.parse(rawData)
    }
    const index = searchRecordList.findIndex(v => v.link == cate.link)
    if (index != -1) {
      searchRecordList.splice(index, 1)
    }
    searchRecordList.push(cate)
    if (searchRecordList.length > 20) {
      searchRecordList.shift()
    }
    this.storage.setItem(searchRecordKey, JSON.stringify(searchRecordList))
  }

  public getCategorySearchRecords(): Category[] {
    const rawData = this.storage.getItem(searchRecordKey)
    let searchRecordList: Category[] = []
    if (rawData) {
      searchRecordList = JSON.parse(rawData)
    }
    searchRecordList = searchRecordList.reverse()
    return searchRecordList
  }

  public categoryIsMatch(category: Category, queryString: string): boolean {
    const index = this.getMatchIndex(category)
    const kwList = queryString.split(' ')
    let allMatched = true
    for (const kw of kwList) {
      allMatched &&= this.categoryNameIsMatch(index, kw) || this.categoryLinkIsMatch(index, kw)
    }
    return allMatched
  }

  private getMatchIndex(category: Category): CategoryMatchIndex {
    const key = category.name + '\n' + category.link
    let index = this.matchIndexCache.get(key)
    if (!index) {
      const link = decodeURI(category.link).replace(/\//gi, '')
      index = {
        nameLower: category.name?.toLowerCase(),
        linkLower: link.toLowerCase(),
        namePinyin: this.pinyin.buildIndex(category.name || ''),
        linkPinyin: this.pinyin.buildIndex(link),
      }
      this.matchIndexCache.set(key, index)
    }
    return index
  }

  private categoryLinkIsMatch(index: CategoryMatchIndex, queryString: string): boolean {
    return index.linkLower.indexOf(queryString.toLowerCase()) != -1 ||
      Pinyin.indexFullContains(index.linkPinyin, queryString) ||
      Pinyin.indexFirstLetterContains(index.linkPinyin, queryString)
  }

  private categoryNameIsMatch(index: CategoryMatchIndex, queryString: string): boolean {
    return (index.nameLower?.indexOf(queryString.toLowerCase()) ?? -1) != -1 ||
      Pinyin.indexFullContains(index.namePinyin, queryString) ||
      Pinyin.indexFirstLetterContains(index.namePinyin, queryString)
  }

  // categoryParse/resolveCategory 已下沉 core/category/SummaryParse(与构建期共用同一口径),
  // getCategoryList 解析后调 assignParents 设父链。
}

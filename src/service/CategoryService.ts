import marked from 'marked'
import api from '@/api'
import Category from '@/dto/Category'
import Cacheable from '@/decorator/Cacheable'
import Cache from '@/decorator/Cache'
const cache = Cache()

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

  @cache
  public async getCategoryList() : Promise<Category[]>{
    const rawData = await api.getCategory()
    const html = marked(rawData.content)
    return [
      {
        name: '首页',
        link: './README.md',
        chidren: []
      },
      ...this.categoryParse(html)
    ]
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
    category.name = cate.querySelector('a')?.innerText!
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
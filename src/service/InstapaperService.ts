import InstapaperItem from "@/dto/InstapaperItem";
import Cache from '@/decorator/Cache'
import Cacheable from '@/decorator/Cacheable'
import api from "@/api";

const cache = Cache()

class InstapaperService implements Cacheable {

  private static instance: InstapaperService

  private constructor(){}

  public name(): string {
    return 'instapaper-service'
  }

  public static getInstance(): InstapaperService {
    if (!InstapaperService.instance) {
      InstapaperService.instance = new InstapaperService()
    }
    return InstapaperService.instance
  }

  public async getUnreadList(): Promise<InstapaperItem[]> {
    const html = await api.getInstapaperRawData()
    const elm = new DOMParser().parseFromString(html, 'text/html')
    const articlesElm = elm.querySelectorAll('.articles .js_article_item')
    const list: InstapaperItem[] = []
    for(let article of articlesElm) {
      const id = article.querySelector('.article_title')?.getAttribute('href')?.replace('/read/', '')!
      const title = article.querySelector('.article_title')?.textContent?.trim()!
      const originLink = article.querySelector('.js_domain_linkout')?.getAttribute('href')!
      const preview = article.querySelector('.article_preview')?.textContent!
      const thumbnail = article.querySelector('.article_image')?.getAttribute('style')?.replace("background-image: url('", "")
        .replace("')", "")
        .replace(";", "")!;
      list.push({
        title, originLink, thumbnail, preview, id
      })
    }
    return list
  }
}

export default InstapaperService.getInstance()
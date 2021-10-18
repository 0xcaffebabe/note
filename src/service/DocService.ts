import api from '@/api'
import marked from 'marked'
import prism from 'prismjs'
import Content from '@/dto/Content'
import Cacheable from '@/decorator/Cacheable'
import Cache from '@/decorator/Cache'
import ReadHistoryItem from '@/dto/ReadHistoryItem'
import DocUtils from '@/util/DocUtils'
const cache = Cache()

const LANGUAGE_MAP = {
  'c': 'clike',
  'java': 'clike',
  'cpp': 'clike',
  'c++': 'clike',
  'html': 'markup',
  'xml': 'markup',
  'python': 'clike',
  'c#': 'clike',
  'ts': 'javascript',
  'js': 'javascript',
  'typesscript': 'javascript',
  'go': 'clike',
  'conf': 'markup',
  'ruby': 'clike',
} as Record<string, string>

class DocService implements Cacheable{

  private static instance: DocService

  private constructor(){}

  name(): string {
    return 'doc-service'
  }

  public static getInstance(): DocService {
    if (!this.instance) {
      this.instance = new DocService()
    }
    return this.instance
  }

  @cache
  public renderMd(mdContent: string) : string {
    const render = new marked.Renderer()
    // 自定义url渲染
    render.link = (href: string | null, title: string | null, text: string | null) : string => {
      if (!href?.startsWith('http')) {
        return `<a href='/doc/${this.docUrl2Id(href!)}'>${text}</a>`
      }else {
        return `<a href='${href}' target="_blank">${text}</a>`
      }
    }
    // 自定义代码块渲染
    render.code = (code: string, language: string | undefined, isEscaped: boolean) :string => {
      return `<pre><code class="language-${language}">${this.hightlightCode(code, language)}</code></pre>`
    }
    // 自定义图片渲染
    render.image = (href: string | null, title: string | null, text: string): string => {
      return `<p class="img-wrapper" style="text-align:center"><img src='${href}'/></p>`
    }
    return  marked(mdContent, {
      renderer: render
    })
  }


  /**
   *
   * 保存文档阅读记录
   * @param {string} doc
   * @param {number} position
   * @memberof DocService
   */
  public setDocReadRecrod(doc: string, position: number) {
    const readingRecords = this.getReadingRecords()
    readingRecords.set(doc, position)
    this.setLastReadRecord(doc)
    localStorage.setItem('doc-service::read-record', JSON.stringify([...readingRecords]))
  }

  /**
   * 保存最后一次阅读的文档
   *
   * @param {string} doc
   * @memberof DocService
   */
  public setLastReadRecord(doc: string) {
    localStorage.setItem("doc-service:last-read", doc)
    const rawData = localStorage.getItem('doc-service::read-history-list')
    let readHistoryList :ReadHistoryItem[] = []
    if (rawData) {
      readHistoryList = JSON.parse(rawData)
    }
    const index = readHistoryList.findIndex(v => v.doc == doc)
    if (index != -1) {
      readHistoryList.splice(index, 1)
    }
    readHistoryList.push({
      doc, time: new Date().toISOString()
    })
    if (readHistoryList.length > 20) {
      readHistoryList.shift()
    }
    localStorage.setItem('doc-service::read-history-list', JSON.stringify(readHistoryList))
  }

  public getReadHistoryList(): ReadHistoryItem[] {
    const rawData = localStorage.getItem('doc-service::read-history-list')
    let readHistoryList :ReadHistoryItem[] = []
    if (rawData) {
      readHistoryList = JSON.parse(rawData)
    }
    return readHistoryList.reverse()
  }


  /**
   *
   * 获取最后一次阅读的文档
   * @return {*}  {string}
   * @memberof DocService
   */
  public getLastReadRecord(): string {
    return localStorage.getItem("doc-service:last-read") || ''
  }


  /**
   *
   * 获取文档阅读记录
   * @param {string} doc
   * @return {*}  {number}
   * @memberof DocService
   */
  public getDocReadRecord(doc: string) :number{
    const readingRecords = this.getReadingRecords()
    return readingRecords.get(doc) || 0
  }

  private getReadingRecords(): Map<string, number>{
    let rawData = localStorage.getItem('doc-service::read-record')
    let readingRecords : Map<string, number>
    if (!rawData) {
      readingRecords = new Map()
    }else{
      readingRecords = new Map(JSON.parse(rawData))
    }
    return readingRecords
  }


  private hightlightCode(code: string, lang: string | undefined): string {
    if (!lang) {
      lang = 'clike'
    }else {
      if (LANGUAGE_MAP[lang]) {
        lang = LANGUAGE_MAP[lang]
      }else {
        lang = 'clike'
      }
    }
    return prism.highlight(code, prism.languages[lang], lang)
  }

  public docUrl2Id(url :string): string {
    return DocUtils.docUrl2Id(url)
  }

  public docId2Url(id: string): string {
    return DocUtils.docId2Url(id)
  }


  /**
   *
   * 根据文档html生成目录
   * @static
   * @param {string} docHtml
   * @return {*}  {Promise<Content[]>}
   * @memberof DocService
   */
  @cache
  public getContent(docHtml: string): Content[] {
    const elm = new DOMParser().parseFromString(docHtml, 'text/html')
    const allHead = elm.querySelectorAll('h1, h2, h3, h4, h5, h6')
    // 用来存储最近的Hx节点
    /* 
      算法概要：
      获取所有h1 - h6 节点
      每次迭代将dom元素转为Content类 并将转换后的对象存储到contentMap（key: level, value: content）里
      除了顶级目录 其他目录每次都会通过ContentMap找寻其最近的一个父节点 并将自己添加到父节点的孩子列表
    */
    let contentMap = []
    let result : Content[] = []
    for(let i = 0;i<allHead.length;i++){
      const head = allHead[i]
      let level = parseInt(head.tagName.replace('H', ''))
      let content = new Content()
      content.name = head.innerHTML
      content.link = head.getAttribute("id")!
      contentMap[level] = content
      if (level == 1) {
        result.push(content)
      }else {
        for(let i = level - 1;i >= 1; i--) {
          if (contentMap[i]) {
            contentMap[i].chidren.push(content)
            break
          }
        }
      }
    }
    return result
  }
}

export default DocService.getInstance()
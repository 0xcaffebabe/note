import api from '@/api'
import {marked} from 'marked'
import prism from 'prismjs'
import Content from '@/dto/Content'
import Cacheable from '@/decorator/Cacheable'
import Cache from '@/decorator/Cache'
import ReadHistoryItem from '@/dto/ReadHistoryItem'
import DocUtils from '@/util/DocUtils'
import DatasourceService from '@/service/DatasourceService'
import yaml from 'js-yaml';
import DocFileInfo from '@/dto/DocFileInfo'
import DocMetadata from '@/dto/doc/DocMetadata'
import TagService from './TagService'
import TagSumItem from '@/dto/tag/TagSumItem'
import TagUtils from '@/pages/tag/TagUtils'
import { KnowledgeLinkNode } from '@/dto/KnowledgeNode'
import KnowledgeNetworkService from './KnowledgeNetworkService'
import DocSegement from '@/dto/doc/DocSegement'
import IdGenUtils from '@/util/IdGenUtils'

const cache = Cache()

const baseUrl = () => {
  return DatasourceService.getCurrentDatasource().url
}

function localImageProxy(url: string | null): string | null{
  if (!url) {
    return url;
  }
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }
  if (url.startsWith('/')) {
    url = url.replace('/', '');
  }else {
    url = url.replace('./', '');
  }
  return baseUrl() + url;
}

function buildDocLink(id: string, headingId: string): string {
  if (!id) {
    return ""
  }
  let url = "/doc/" + id;
  if (headingId) {
    url += "?headingId=" + headingId
  }
  return url;
}


class DocService implements Cacheable{

  private static instance: DocService;

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

  /**
   * 渲染doc 转为结构化数据
   *
   * @param {DocFileInfo} file
   * @return {*}  {DocSegement[]}
   * @memberof DocService
   */
  @cache
  public renderMdWithStructed(file: DocFileInfo): DocSegement[] {
    const html = this.renderMd(file)
    const doc = new DOMParser().parseFromString(html, 'text/html').querySelector('body')!;
    const allHead:NodeListOf<HTMLElement> = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const HEADING_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

    // 用来存储节点<id-该节点到下一节点前的html>
    const segementMap = new Map<string, string>();
    let previousHeading: string | null = null;
    let htmlBuffer = "";
    for(let i of Array.from(doc.children)) {
      if (HEADING_TAGS.some(v => v == i.tagName)) {
        if (!previousHeading) {
          segementMap.set(allHead[0].id, htmlBuffer);
        }else {
          segementMap.set(previousHeading, htmlBuffer);
        }
        htmlBuffer = "";
        previousHeading = i.id;
      }else {
        htmlBuffer += i.outerHTML;
      }
    }
    segementMap.set(previousHeading!, htmlBuffer);

    function content2DocSegement(contents: Content[]): DocSegement[] {
      const segements: DocSegement[] = []
      for(let i of contents) {
        segements.push({
          id: i.link,
          title: i.name,
          level: i.level,
          content: segementMap.get(i.link) || '',
          children: content2DocSegement(i.chidren)
        })
      }
      return segements
    }

    const contents = this.getContent(html);
    return content2DocSegement(contents)
  }

  /**
   * 渲染doc 转为html
   *
   * @param {DocFileInfo} file
   * @return {*}  {string}
   * @memberof DocService
   */
  @cache
  public renderMd(file: DocFileInfo) : string {
    const mdContent = file.content;

    const render = new marked.Renderer();
    const tagList: TagSumItem[] = TagService.getTagSumList();
    const knowledgeLinkList: KnowledgeLinkNode[] = KnowledgeNetworkService.getAllLinks();

    // 自定义url渲染
    render.link = (href: string | null, title: string | null, text: string | null) : string => {
      if (!href?.startsWith('http')) {
        const {id, headingId} = DocUtils.resloveDocUrl(href!)
        // 当text为html的情况下 排除掉dom中sup节点 文本化
        text = Array.from(new DOMParser().parseFromString(text!, 'text/html').body.childNodes)
                    .filter(n => (n as HTMLElement).tagName != 'SUP')
                    .map(n => n.textContent)
                    .join('');
        return `<a href='${buildDocLink(id, headingId!)}' origin-link='${href}'>${text}</a>`
      }else {
        return `<a href='${href}' target="_blank">${text}</a>`
      }
    }
    // 自定义代码块渲染
    render.code = (code: string, language: string | undefined, isEscaped: boolean) :string => {
      // 如果语言是mermaid 特殊处理 转为mermaid
      if (language == 'mermaid') {
        return `<div class='mermaid' id='mermaid-${IdGenUtils.uuid()}'>${code}</div>`
      }
      return `<pre><code class="language-${language}">${this.hightlightCode(code, language)}</code></pre>`
    }
    // 自定义图片渲染
    render.image = (href: string | null, title: string | null, text: string): string => {
      if (href?.startsWith('/')) {
        href = baseUrl() + href.replace('/', '')
      }
      return `<p class="img-wrapper"><img src='${localImageProxy(href)}' crossorigin="anonymous"/><p class="img-title">${text}</p></p>`
    }
    const reg = new RegExp(knowledgeLinkList.map(v => v.name).join('|'))
    render.text = (text: string): string => {
      // 自定义文本渲染 若发现关键字包含标签 则插入标记
      for(let i of tagList) {
        if (text.indexOf(i.tag) != -1) {
          text = text.replace(i.tag, (str: string) =>`<u class="doc-tag-main" tag="${i.tag}">${str}</u><sup class="doc-tag" tag="${i.tag}" style="background-color: ${TagUtils.calcTagColor(i.tag)}">${i.count}</sup>`);
        }
      }
      // 自定义文本渲染 若发现关键字包含已存在的知识网络连接 则转为链接
      text = text.replace(reg, (str: string) => {
        const i = knowledgeLinkList.filter(v => v.name == str)[0];
        // 如果被插入的链接为当前渲染的文档 跳过
        if (i.id == file.id) {
          return str;
        }
        // 如果被替换的关键字是标签 跳过
        if (tagList.some(v => v.tag == str)) {
          return str;
        }
        return `<a href='${buildDocLink(i.id, i.headingId!)}' class="potential-link" origin-link="${DocUtils.docId2Url(i.id)}">${str}</a>`
      })
      return text;
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
    readHistoryList = readHistoryList.reverse();
    readHistoryList.forEach(v => v.time = new Date(v.time).toLocaleString())
    return readHistoryList;
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
      lang = 'clike';
    }
    if (!prism.languages[lang]) {
      lang = 'clike';
    }
    return prism.highlight(code, prism.languages[lang], lang)
  }

  public docUrl2Id(url :string): string {
    return DocUtils.docUrl2Id(url)
  }

  public docId2Url(id: string): string {
    return DocUtils.docId2Url(id)
  }

  @cache
  public async getContentByDocId(id: string): Promise<Content[]> {
    const fileInfo = await api.getDocFileInfo(id)
    const html = this.renderMd(fileInfo)
    return this.getContent(html)
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
    const allHead:NodeListOf<HTMLElement> = elm.querySelectorAll('h1, h2, h3, h4, h5, h6')
    // 用来存储最近的Hx节点
    /* 
      算法概要：
      获取所有h1 - h6 节点
      计算顶级目录层级：查找出来的第一个Hx节点的level
      每次迭代将dom元素转为Content类 并将转换后的对象存储到contentMap（key: level, value: content）里
      除了顶级目录 其他目录每次都会通过ContentMap找寻其最近的一个父节点 并将自己添加到父节点的孩子列表
    */
    let contentMap = []
    let result : Content[] = []
    let topLevel = -1
    for(let i = 0;i<allHead.length;i++){
      const head = allHead[i]
      let level = parseInt(head.tagName.replace('H', ''))
      if (topLevel == -1) {
        topLevel = level
      }
      let content = new Content();
      // 这里考虑到标题里面可能由html标签构成 排除掉sup标签 转为文本内容
      content.name = Array.from(head.childNodes).filter(v => v.nodeName.toUpperCase() != 'SUP').map(v => v.textContent).join('');
      content.link = head.getAttribute("id")!
      content.level = level;
      contentMap[level] = content
      if (level == topLevel) {
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


  /**
   *
   * 根据传入的html获取图片url列表
   * @param {string} docHtml
   * @return {*}  {string[]}
   * @memberof DocService
   */
  public getImageUrlList(docHtml: string): string[] {
    const document = new DOMParser().parseFromString(docHtml, 'text/html')
      const imgList = document.querySelectorAll('.img-wrapper img');
      const result: string[] = []
      for(let i of imgList) {
        result.push(i.getAttribute('src') || '')
      }
      return result;
  }


  /**
   *
   * 解析出html里面的所有 a 标签
   * @param {string} docHtml
   * @return {*}  {{text:string, link: string}[]}
   * @memberof DocService
   */
  public resolveLinkList(docHtml: string): {text:string, link: string}[] {
    const document = new DOMParser().parseFromString(docHtml, 'text/html');
    const aList = document.querySelectorAll('a');
    const result: {text:string, link: string}[] = []
    for(let i of aList) {
      result.push({text: i.innerText, link: i.getAttribute('href') || ''})
    }
    return result;
  }


  /**
   *
   * 解析markdown标签列表
   * @param {DocFileInfo} file
   * @return {*}  {string[]}
   * @memberof DocService
   */
  @cache
  public resolveTagList(file: DocFileInfo): string[] {
    const json = yaml.load(file.metadata) as DocMetadata;
    return json?.tags
  }
}

export default DocService.getInstance()
import Content from '../../domain/Content'
import DocFileInfo from '../../domain/DocFileInfo'
import DocSegement from '../../domain/doc/DocSegement'
import type { DocMetadata } from '../../domain/doc/DocMetadata'
import type { Api } from '../../data/Api'
import type DocRender from '../../render/DocRender'
import type { TagService } from '../TagService'
import type { KnowledgeNetworkService } from '../KnowledgeNetworkService'
import type { DomParserPort } from '../../ports'
import { extractRelatedContent } from './RelatedContentExtractor'

export { extractRelatedContent } from './RelatedContentExtractor'

/**
 * 跨方法调用回调: 渲染链里若干步骤本应命中 DocService 外层 @cache(同一作用域 id/键),
 * 故这些"对另一个被缓存的公开方法的调用"由 DocService 把其装饰后的方法绑定注入进来,
 * 子服务经由它们调用以保持记忆化行为与原内联实现逐字节一致。
 */
export interface DocRenderCachedCalls {
  /** -> DocService.resolveMetadata (@cacheByFileId) */
  resolveMetadata(file: DocFileInfo): DocMetadata
  /** -> DocService.getDocFileInfo (@cache) */
  getDocFileInfo(id: string): Promise<DocFileInfo>
  /** -> DocService.renderMd (@cacheByFileId) */
  renderMd(file: DocFileInfo): string
  /** -> DocService.renderMdFromText (@cacheByDocId) */
  renderMdFromText(mdContent: string, docId: string): string
  /** -> DocService.getContent (@cacheByHtml) */
  getContent(docHtml: string): Content[]
}

/**
 * 文档渲染子服务: 取文档信息 / Markdown 渲染 / 分段渲染 / 目录(TOC)抽取 / 关联内容剥离。
 *
 * 从 DocService 原样搬出, 行为字节级保持。所有记忆化仍由 DocService 外层装饰器承担,
 * 子服务持纯实现体; 链路内"对另一被缓存方法的再调用"经 cached 回调透传, 命中同一缓存作用域。
 */
export class DocRenderService {
  constructor(
    private readonly docRender: DocRender,
    private readonly tagService: TagService,
    private readonly knowledgeService: KnowledgeNetworkService,
    private readonly dom: DomParserPort,
    private readonly api: Api,
    private readonly cached: DocRenderCachedCalls,
  ) {}

  public async getDocFileInfo(id: string): Promise<DocFileInfo> {
    const fileInfo = await this.api.getDocFileInfo(id)
    fileInfo.formattedMetadata = this.cached.resolveMetadata(fileInfo)
    this.extractRelatedContent(fileInfo)
    return fileInfo
  }

  // 取文档时一次性把正文末尾"关联内容(自动生成)"章节抽取为 relatedLinks 并从 content 剥离
  public extractRelatedContent(file: DocFileInfo): void {
    extractRelatedContent(file)
  }

  public renderMdWithStructed(file: DocFileInfo): DocSegement[] {
    const html = this.cached.renderMd(file)
    const doc = this.dom.parse(html).querySelector('body')!
    const allHead: NodeListOf<HTMLElement> = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const HEADING_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']

    const segementMap = new Map<string, string>()
    let previousHeading: string | null = null
    let htmlBuffer = ''
    for (const i of Array.from(doc.children)) {
      if (HEADING_TAGS.some(v => v == i.tagName)) {
        if (!previousHeading) {
          segementMap.set(allHead[0].id, htmlBuffer)
        } else {
          segementMap.set(previousHeading, htmlBuffer)
        }
        htmlBuffer = ''
        previousHeading = i.id
      } else {
        htmlBuffer += i.outerHTML
      }
    }
    segementMap.set(previousHeading!, htmlBuffer)

    function content2DocSegement(contents: Content[]): DocSegement[] {
      const segements: DocSegement[] = []
      for (const i of contents) {
        segements.push({
          id: i.link,
          title: i.name,
          level: i.level,
          content: segementMap.get(i.link) || '',
          children: content2DocSegement(i.chidren),
        })
      }
      return segements
    }

    const contents = this.cached.getContent(html)
    return content2DocSegement(contents)
  }

  public renderMd(file: DocFileInfo): string {
    if (!file.content) {
      return ''
    }
    return this.cached.renderMdFromText(file.content, file.id)
  }

  public renderMdFromText(mdContent: string, docId: string): string {
    return this.docRender.render(
      mdContent,
      docId,
      this.tagService.getTagSumList(),
      this.knowledgeService.getAllLinks(),
    )
  }

  public async getContentByDocId(id: string): Promise<Content[]> {
    const fileInfo = await this.cached.getDocFileInfo(id)
    const html = this.cached.renderMd(fileInfo)
    return this.cached.getContent(html)
  }

  public getContent(docHtml: string): Content[] {
    const elm = this.dom.parse(docHtml)
    const allHead: NodeListOf<HTMLElement> = elm.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const contentMap = []
    const result: Content[] = []
    let topLevel = -1
    for (let i = 0; i < allHead.length; i++) {
      const head = allHead[i]
      const level = parseInt(head.tagName.replace('H', ''))
      if (topLevel == -1) {
        topLevel = level
      }
      if (level <= topLevel) {
        contentMap.length = 0
      }
      const content = new Content()
      content.name = Array.from(head.childNodes)
        .filter(v => v.nodeName.toUpperCase() != 'SUP')
        .filter(v => !((v as HTMLElement).classList?.contains('heading-anchor')))
        .map(v => v.textContent).join('')
      content.link = head.getAttribute('id')!
      content.level = level
      contentMap[level] = content
      if (level == topLevel) {
        result.push(content)
      } else {
        for (let i = level - 1; i >= 1; i--) {
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

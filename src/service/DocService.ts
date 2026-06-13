import api from '@/api'
import Content from '@/dto/Content'
import Cacheable from '@/decorator/Cacheable'
import Cache from '@/decorator/Cache'
import ReadHistoryItem from '@/dto/ReadHistoryItem'
import DocUtils from '@/util/DocUtils'
import yaml from 'js-yaml';
import DocFileInfo from '@/dto/DocFileInfo'
import {DocMetadata, EMPTY_DOC_METADATA} from '@/dto/doc/DocMetadata'
import DocSegement from '@/dto/doc/DocSegement'
import DocQuality from '@/dto/doc/DocQuality'
import { cleanText } from '@/util/StringUtils'
import MindNode from '@/dto/mind/MindNode'
import { MindUtils } from '@/pages/doc/mind/MindUtils'
import ClusterNode from '@/dto/ClusterNode'
import DocRender from '../render/DocRender'
import { KnowledgeNode } from '@/dto/KnowledgeNode'
import TagService from '../service/TagService'
import KnowledgeNetworkService from '../service/KnowledgeNetworkService'
import { RelatedLink } from '@/dto/RelatedLink'

const cache = Cache()
// 以下方法的参数包含整篇文档内容/HTML 用自定义键避免每次缓存查找都序列化大参数
// 文档内容在会话内不变（getDocFileInfo按id缓存）以id/原串做键是安全的
const cacheByFileId = Cache((file: DocFileInfo) => file.id)
const cacheByDocId = Cache((_mdContent: string, docId: string) => docId)
const cacheByHtml = Cache((docHtml: string) => docHtml)


class DocService implements Cacheable{

  private static instance: DocService;
  
  /**
   *
   * 文档质量源数据
   * @private
   * @type {DocQuality[]}
   * @memberof DocService
   */
  private docQaulity: DocQuality[] = []

  /**
   *
   * 文档质量中位数
   * @private
   * @type {number}
   * @memberof DocService
   */
  private medianQuality: number = 1

  /**
   *
   * 每个文档对应的质量数据
   * @private
   * @memberof DocService
   */
  private docQualityMap = new Map<string, DocQuality>()

  /**
   *
   * 每个文档对应的排序
   * @private
   * @memberof DocService
   */
  private docQualityOrderMap = new Map<string, number>()

  private qualityRequested = false

  private constructor(){
  }

  /**
   * 懒加载文档质量数据: 非首屏关键 且dev端按需生成耗时极长(约30-60s的git分析)会阻塞文档请求
   * 由文档页在正文渲染完成后触发 消费方(侧栏tooltip/知识回顾)在数据就绪前按空值降级
   */
  public ensureQualityLoaded() {
    if (this.qualityRequested) {
      return
    }
    this.qualityRequested = true
    this.init()
  }

  private async init() {
    this.docQaulity = await api.getDocQualityData()
    // 中位数计算
    const sorted = this.docQaulity.map(v => v.quality).sort((a,b) => a - b)
    const midPos = Math.floor(sorted.length / 2)
    if (sorted.length % 2 == 0) {
      this.medianQuality = (sorted[midPos] + sorted[midPos - 1]) / 2
    }else {
      this.medianQuality = sorted[midPos]
    }
    for(let i = 0; i < this.docQaulity.length; i++) {
      const quality = this.docQaulity[i]
      this.docQualityMap.set(quality.id, quality)
      this.docQualityOrderMap.set(quality.id, i + 1)
    }
  }

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
  public async getDocFileInfo(id: string): Promise<DocFileInfo>{
    const fileInfo = await api.getDocFileInfo(id)
    fileInfo.formattedMetadata = this.resolveMetadata(fileInfo)
    this.extractRelatedContent(fileInfo)
    return fileInfo
  }

  // 取文档时一次性把正文末尾"关联内容（自动生成）"章节抽取为 relatedLinks 并从 content 剥离
  // 之后 renderMd/目录/脑图/移动端拿到的都是剥离后的正文 关联内容由 RelatedContent 组件单独展示
  private extractRelatedContent(file: DocFileInfo): void {
    if (file.relatedLinks !== undefined) {
      return // api 层按 id 缓存同一对象 只处理一次
    }
    file.relatedLinks = []
    const content = file.content
    if (!content || !/关联内容/.test(content)) {
      return
    }
    const lines = content.split('\n')
    const startIdx = lines.findIndex(l => /^#{2,3}\s*关联内容/.test(l))
    if (startIdx === -1) {
      return
    }
    const level = (lines[startIdx].match(/^(#+)/) as RegExpMatchArray)[1].length
    // 章节范围: 标题到下一个同级/更高级标题 或文末
    let endIdx = lines.length
    for (let i = startIdx + 1; i < lines.length; i++) {
      const hm = lines[i].match(/^(#{1,6})\s/)
      if (hm && hm[1].length <= level) {
        endIdx = i
        break
      }
    }
    const linkRe = /^-\s*\[([^\]]+)\]\(([^)]+)\)\s*(.*)$/
    for (let i = startIdx + 1; i < endIdx; i++) {
      const m = lines[i].match(linkRe)
      if (!m) {
        continue
      }
      try {
        const { id } = DocUtils.resloveDocUrl(m[2].trim())
        file.relatedLinks.push({
          href: DocUtils.docId2HtmlPath(id),
          path: m[1].trim(),
          desc: m[3].trim(),
        })
      } catch {
        // 跳过无法解析的链接
      }
    }
    // 从正文剥离该章节 并清理尾部遗留空行
    lines.splice(startIdx, endIdx - startIdx)
    while (lines.length && lines[lines.length - 1].trim() === '') {
      lines.pop()
    }
    file.content = lines.join('\n')
  }

  /**
   * 渲染doc 转为结构化数据
   *
   * @param {DocFileInfo} file
   * @return {*}  {DocSegement[]}
   * @memberof DocService
   */
  @cacheByFileId
  public renderMdWithStructed(file: DocFileInfo): DocSegement[] {
    const html = this.renderMd(file)
    const doc = new DOMParser().parseFromString(html, 'text/html').querySelector('body')!;
    const allHead:NodeListOf<HTMLElement> = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const HEADING_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

    // 用来存储节点<id-该节点到下一节点前的html>
    const segementMap = new Map<string, string>();
    let previousHeading: string | null = null;
    let htmlBuffer = "";
    for(const i of Array.from(doc.children)) {
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
      for(const i of contents) {
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
  @cacheByFileId
  public renderMd(file: DocFileInfo) : string {
    if (!file.content) {
      return ''
    }
    return this.renderMdFromText(file.content, file.id)
  }

  @cacheByDocId
  public renderMdFromText(mdContent: string, docId: string): string {
    return new DocRender(mdContent, docId, 
              TagService.getTagSumList(), KnowledgeNetworkService.getAllLinks()).render()
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
    const rawData = localStorage.getItem('doc-service::read-record')
    let readingRecords : Map<string, number>
    if (!rawData) {
      readingRecords = new Map()
    }else{
      readingRecords = new Map(JSON.parse(rawData))
    }
    return readingRecords
  }

  // 不做缓存：本身是廉价的字符串拼接 且依赖异步加载的文档质量数据和当前时间
  // 旧实现用JSON.stringify(arguments)做键 会把整个知识网络数组序列化进缓存键
  public buildSummaryDocInfo(file: DocFileInfo, knowledgeNetwork?: KnowledgeNode[]): string {
    // 计算入度和出度
    let inDegree = 0;
    let outDegree = 0;

    if (knowledgeNetwork) {
      // 出度：当前节点指向其他节点的数量
      const currentNode = knowledgeNetwork.find(node => node.id === file.id);
      outDegree = currentNode?.links?.length || 0;

      // 入度：其他节点指向当前节点的数量
      inDegree = [...new Set(knowledgeNetwork.filter(node =>
        node.links && node.links.some(link => link.id === file.id)
      ).map(v => v.id))].length;
    }

    let connectDegree = '';
    if (knowledgeNetwork) {
      connectDegree = `<div>📈 入度: ${inDegree}, 出度: ${outDegree}</div>`;
    }

    return [
      `<p>${file.name}(${file.id})</p>`,
      `<div>创建时间: ${new Date(file.createTime).toLocaleString()}</div>`,
      `<div>最后更新: ${new Date(file.commitList[0].date).toLocaleString()}</div>`,
      `<div>⏰${
        Math.ceil(
          (new Date().getTime() - new Date(file.commitList[0].date).getTime()) / (3600 * 24 * 1000)
        )
        }天前更新, ✏️${cleanText(file.content).length}字, ⚽${this.calcQuanlityStr(file.id)}</div>`,
      `${connectDegree}`,
      `<div>${this.resolveTagList(file) || ''}</div>`
    ].join("\n")
  }

  public docUrl2Id(url :string): string {
    return DocUtils.docUrl2Id(url)
  }

  public docId2Url(id: string): string {
    return DocUtils.docId2Url(id)
  }

  @cache
  public async getContentByDocId(id: string): Promise<Content[]> {
    const fileInfo = await this.getDocFileInfo(id)
    // content 在 getDocFileInfo 阶段已剥离"关联内容"章节 目录/脑图自然不含该项
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
  @cacheByHtml
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
    const contentMap = []
    const result : Content[] = []
    let topLevel = -1
    for(let i = 0;i<allHead.length;i++){
      const head = allHead[i]
      const level = parseInt(head.tagName.replace('H', ''))
      if (topLevel == -1) {
        topLevel = level
      }
      const content = new Content();
      // 这里考虑到标题里面可能由html标签构成 排除掉sup标签与锚点图标 转为文本内容
      content.name = Array.from(head.childNodes)
        .filter(v => v.nodeName.toUpperCase() != 'SUP')
        .filter(v => !((v as HTMLElement).classList?.contains('heading-anchor')))
        .map(v => v.textContent).join('');
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
      for(const i of imgList) {
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
    for(const i of aList) {
      result.push({text: i.innerText, link: i.getAttribute('href') || ''})
    }
    return result;
  }

  // 解析正文里指向"其他文档"的站内链接(供关联面板"其他链接"分组)
  // 只取.html站内文档 排除外链/锚点/当前文档自身/已在关联内容中的 并按文档去重
  public resolveDocLinks(docHtml: string, currentDocId: string, excludeHrefs: string[] = []): RelatedLink[] {
    const exclude = new Set(excludeHrefs)
    const seen = new Set<string>()
    const result: RelatedLink[] = []
    for (const { link } of this.resolveLinkList(docHtml)) {
      if (!/\.html(\?|#|$)/.test(link)) {
        continue // 非站内文档页(外链/mailto等)跳过
      }
      const cleanLink = link.split(/[?#]/)[0]
      let docId: string
      try {
        docId = DocUtils.htmlUrl2Id(cleanLink)
      } catch {
        continue
      }
      if (!docId || docId === currentDocId) {
        continue // 自链/标题锚点跳过
      }
      const href = DocUtils.docId2HtmlPath(docId)
      if (exclude.has(href) || seen.has(docId)) {
        continue // 已在关联内容 或 重复
      }
      seen.add(docId)
      result.push({ href, path: DocUtils.docId2Url(docId), desc: '' })
    }
    return result
  }


  /**
   *
   * 解析markdown标签列表
   * @param {DocFileInfo} file
   * @return {*}  {string[]}
   * @memberof DocService
   */
  @cacheByFileId
  public resolveTagList(file: DocFileInfo): string[] {
    const json = yaml.load(file.metadata) as DocMetadata;
    return json?.tags
  }


  /**
   *
   * 解析文档的元数据
   * @param {DocFileInfo} file
   * @return {*}  {DocMetadata}
   * @memberof DocService
   */
  @cacheByFileId
  public resolveMetadata(file: DocFileInfo): DocMetadata {
    const metadata = yaml.load(file.metadata) as DocMetadata;
    if (metadata as any == 'undefined') {
      return EMPTY_DOC_METADATA
    }
    if (metadata) {
      for(const key in EMPTY_DOC_METADATA) {
        if (!(metadata as any)[key]) {
          (metadata as any)[key] = (EMPTY_DOC_METADATA as any)[key]
        }
      }
      return metadata
    }
    return EMPTY_DOC_METADATA
  }

  // 不做缓存：Map查找本身就是O(1) 且质量数据由异步init填充 过早缓存会冻结空结果
  public getDocQuality(id: string): DocQuality | null {
    return this.docQualityMap.get(id) || null
  }

  // 不做缓存：理由同getDocQuality
  public calcQuanlityStr(id: string): string {
    const docQuality = this.getDocQuality(id)
    if (!docQuality) {
      return '未知'
    }
    const farToMid = ((docQuality.quality / this.medianQuality ) * 100).toFixed(0)
    return `${docQuality.quality.toFixed(2)}(${this.docQualityOrderMap.get(id) || -1}/${this.docQaulity.length}, ${farToMid}%)`
  }

  @cache
  public async generateMindData(id: string): Promise<MindNode> {
    const toc = await this.getContentByDocId(id);
    const minds = MindUtils.mindConvert(toc);
    return minds[0];
  }

  /**
   *
   * 获取相似的文档
   * @param {string} id
   * @return {*}  {Promise<string[]>}
   * @memberof DocService
   */
  @cache
  public async getSimliarDoc(id: string): Promise<string[]> {
    const clusters = await api.getDocCluster()
    let node: ClusterNode | null = null
    function travel(root: ClusterNode, round: number[]): [ClusterNode, boolean] {
        if (DocUtils.docUrl2Id(root.name) == id) {
          return [root, true]
        }
        const ret: [ClusterNode, boolean] | null = null
        for(const i of root.children) {
          const r = travel(i, round)
          if (r[1] && round[0] > 0) {
            node = root
            round[0]--
            return r
          }
        }
        return ret || [root, false]
    }
    function all(root: ClusterNode): string[] {
      return [root.name, ...root.children.map(all).flatMap(v => v)].filter(v => v)
    }
    travel(clusters[0], [3])
    if (!node) {
      return []
    }
    return all(node).filter(v => this.docUrl2Id(v) != id)
  }
}

export default DocService.getInstance()
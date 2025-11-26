import DocFileInfo from "../dto/DocFileInfo";
import BaseService from "./BaseService";
import GitService from "./GitService";
import {JSDOM} from 'jsdom'
import fs from 'fs'
import {marked} from "marked";
import SearchIndexSegment from "../dto/search/SearchIndexSegement";
import { getMidString } from '../util/StringUtils';
import {KnowledgeNode, KnowledgeLinkNode} from "../dto/KnowledgeNode";
import DocUtils from "../util/DocUtils";
import yaml from 'js-yaml'
import fm from 'front-matter';
import {DocMetadata} from "@/dto/doc/DocMetadata";
import Cacheable from "@/decorator/Cacheable";
import ArrayUtils from "../util/ArrayUtils";
import CommitInfo from "@/dto/CommitInfo";
import ClusterNode from "@/dto/ClusterNode";
import DocQuality from "../dto/doc/DocQuality";
import Cache from "../decorator/Cache";
import generateDocCluster from '../scripts/generateDocCluster'
import Slugger from "../util/Slugger";
import KnowledgeRichnessNode from "../dto/KnowledgeRichnessNode";
import CategoryService from "./CategoryService";
import Category from "../dto/Category";
import DocQualityCalculator, { QualityInputData } from "../util/DocQualityCalculator";

const cache = Cache()


class DocService extends BaseService implements Cacheable {
  private static dom = new JSDOM()
  private static instance: DocService;

  private constructor(){
    super()
  }
  name(): string {
    return 'build::doc-service';
  }

  public static getInstance(): DocService {
    if (!this.instance) {
      this.instance = new DocService();
    }
    return this.instance;
  }

  @cache
  public async getFileInfo(path: string): Promise<DocFileInfo> {
    const callResult = await Promise.all([GitService.getFileCommitList(path), fs.promises.readFile(path)])
    const { body, frontmatter } = fm(callResult[1].toString())
    return {
      name: path.split('/')[path.split('/').length-1].replace('.md', ''),
      id: DocUtils.docUrl2Id(path),
      content: body,
      metadata: frontmatter || '',
      hasMoreCommit: callResult[0].length > 10,
      totalCommits: callResult[0].length,
      commitList: ArrayUtils.topN(callResult[0], 10),
      createTime: ArrayUtils.last(callResult[0])?.date || '',
    } as DocFileInfo
  }


  /**
   *
   * 解析出markdown里的元数据
   * @static
   * @param {string} content
   * @return {*}  {string}
   * @memberof DocService
   */
  public resolveMetadata(content: string): string {
    if (!content.trim().startsWith("---")) {
      return "";
    }
    // 匹配开头的 metadata 块，使用多行模式 (m) 和单行匹配 (s)，确保只匹配开头的元数据部分
    const reg = new RegExp('^---[\\s\\S]+?^---', 'm');
    const result = content.match(reg);
    if (result != null && result.length != 0) {
      return result[0].replace(/---/g, '').trim();  // 去除前后 '---' 和多余的空白
    }
    return '';
  }


  /**
   *
   * 构建标签映射
   * @static
   * @return {*}  {Promise<TagMappingItem[]>}
   * @memberof DocService
   */
  @cache
  public async  buildTagMapping(): Promise<Map<string, string[]>> {
    const files = BaseService.listFilesBySuffix('md', 'doc');
    interface TagAndFilename{
      tags: string[]
      filename: string
    }
    const taskList: Promise<TagAndFilename>[] = [];
    // 将markdown转换为 标签列表, 文件名 映射
    for(let file of files) {
      taskList.push(
        fs.promises.readFile(file)
          .then(buffer => {
            const metadata = yaml.load(this.resolveMetadata(buffer.toString())) as DocMetadata;
            if (!metadata) {
              return {tags:[], filename: file}
            }
            return {tags: metadata.tags, filename: file}
          })
      )
    }
    // 构建映射
    const tagMap = new Map<string, string[]>();
    const TagAndFilenameList = await Promise.all(taskList);
    for(let tagAndFilename of TagAndFilenameList) {
      for(let tag of tagAndFilename.tags || []) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, []);
        }
        tagMap.get(tag)?.push(tagAndFilename.filename);
      }
    }
    return tagMap
  }

  public md2text(md: string): string {
    const html = marked(md)
    const dom =  new JSDOM(`<!DOCTYPE html><body>${html}</body></html>`)
    const text = dom.window.document.body.textContent || ''
    return this.cleanText(text)
  }


  /**
   *
   * 生成某一md文件的显式(手动链接)知识网络节点
   * @static
   * @param {string} path md文件
   * @return {*}  {Promise<KnowledgeNode>}
   * @memberof DocService
   */
  @cache
  public async getKnowledgeNode(path: string): Promise<KnowledgeNode> {
    return fs.promises.readFile(path).then(buffer => {
      const md = buffer.toString();
      const html = marked(md);
      DocService.dom.window.document.body.innerHTML = `<!DOCTYPE html><body>${html}</body></html>`;
      const linkElemetns = DocService.dom.window.document.body.querySelectorAll('a');
      const links: KnowledgeLinkNode[] = []
      for(let i = 0;i<linkElemetns.length;i++){
        const a = linkElemetns[i]
        const uri = a.getAttribute('href')
        if (uri?.indexOf('md') != -1) {
          links.push({name: a.textContent || '', ...DocUtils.resloveDocUrl(uri!)})
        }
      }
      return {id: DocUtils.docUrl2Id(path), links}
    })
  }


  /**
   *
   * 生成某一md文件的隐式(手动链接 + 自动链接)知识网络节点
   * @param {string} path
   * @param {Map<string, KnowledgeLinkNode>} map
   * @return {*}  {Promise<KnowledgeNode>}
   * @memberof DocService
   */
  public async getPotentialKnowledgeNode(path: string, map: Map<string, KnowledgeLinkNode>): Promise<KnowledgeNode> {
    return fs.promises.readFile(path).then(buffer => {
      const md = buffer.toString()
      const links: KnowledgeLinkNode[] = []
      map.forEach(e => {
        if (md.indexOf(e.name) != -1) {
          links.push(e)
        }
      })
      return {id: DocUtils.docUrl2Id(path), links}
    })
  }

  @cache
  public async getDocCluster(): Promise<ClusterNode[]> {
    return generateDocCluster.main(true)
  }

  public async getDocTagPrediction() {
    return (await generateDocCluster.generateDocTagPrediction())
  }

  /**
   *
   * 生成显式知识网络
   * @return {*}  {Promise<KnowledgeNode[]>}
   * @memberof DocService
   */
  @cache
  public async generateKnowledgeNetwork(): Promise<KnowledgeNode[]>{
    const ignoreDoc = ['README', 'SUMMARY'];
    const fileList = BaseService.listFilesBySuffix('md', 'doc')
    const taskList :Promise<KnowledgeNode>[] = []
    for(let file of fileList) {
      taskList.push(this.getKnowledgeNode(file))
    }
    return (await Promise.all(taskList)).filter(v => ignoreDoc.indexOf(v.id) == -1).filter(v => v.links?.length != 0)
  }


  /**
   *
   * 生成所有文档的质量分数
   * @return {*}  {Promise<DocQuality[]>}
   * @memberof DocService
   */
  @cache
  public async generateDocQualityData(): Promise<DocQuality[]> {
    const knowledgeNodes = await this.generateKnowledgeNetwork()
    
    // 每个文档的外链数 外部 -> 自己
    const outLinksMap = new Map<string, number>()
    // 每个文档的内链数 自己 -> 外部
    const inLinksMap = new Map<string, number>()
    for(let node of knowledgeNodes) {
      if (!inLinksMap.has(node.id)) {
        inLinksMap.set(node.id, node.links?.length || 0)
      }
      for(let child of node.links || []) {
        outLinksMap.set(node.id, 1 + (outLinksMap.get(node.id) || 0))
      }
    }

    const ignoreDoc = ['README', 'SUMMARY', '参考文献'];
    const fileList = BaseService.listFilesBySuffix('md', 'doc')
    
    // 准备输入数据
    const inputDataList: QualityInputData[] = []
    const fileContents = new Map<string, string>()
    const commitLists = new Map<string, CommitInfo[]>()
    
    // 并行读取所有文件和提交历史
    const fileReadPromises = fileList.map(async file => {
      const content = (await fs.promises.readFile(file)).toString()
      const id = DocUtils.docUrl2Id(file)
      fileContents.set(id, content)
      return { id, content }
    })
    
    const commitPromises = fileList.map(async file => {
      const commitList = await GitService.getFileCommitList(file)
      const id = DocUtils.docUrl2Id(file)
      commitLists.set(id, commitList)
      return { id, commitList }
    })
    
    await Promise.all([...fileReadPromises, ...commitPromises])
    
    // 构建输入数据
    for(const file of fileList) {
      const id = DocUtils.docUrl2Id(file)
      const content = fileContents.get(id) || ''
      const commitList = commitLists.get(id) || []
      
      const inputData: QualityInputData = {
        contentLength: this.cleanText(content).length,
        outLinksCount: outLinksMap.get(id) || 0,
        inLinksCount: inLinksMap.get(id) || 0,
        commitList: commitList,
        metadata: this.resolveMetadata(content),
        knowledgeNodes: knowledgeNodes,
        docId: id
      }
      
      inputDataList.push(inputData)
    }
    
    // 使用文档质量计算器批量计算
    return DocQualityCalculator.calculateBatchQuality(inputDataList)
      .filter(v => ignoreDoc.indexOf(v.id) == -1)
      .sort((a, b) => b.totalQuality - a.totalQuality)
  }


  /**
   *
   * 生成一份根据最后提交时间正序排序的文档列表
   * @return {*}  {Promise<[string, string]>}
   * @memberof DocService
   */
  public async generateDocListOrderByLastCommit(): Promise<[string, CommitInfo][]> {
    const fileList = BaseService.listFilesBySuffix('md', 'doc')
    const taskList :Promise<[string,CommitInfo]>[] = []
    for(let file of fileList) {
      taskList.push(GitService.getFileLastCommit(file).then(commit => [file, commit]))
    }
    const ignoreDoc = ['README', 'SUMMARY'];
    return (await Promise.all(taskList))
      .sort((a, b) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime())
      .filter(v => ignoreDoc.indexOf(DocUtils.docUrl2Id(v[0])) == -1)
      .map(v => [DocUtils.docUrl2Id(v[0]), v[1]])
  }


  /**
   *
   * 生成知识丰富度
   * @return {*}  {Promise<KnowledgeRichnessNode[]>}
   * @memberof DocService
   */
  public async generateKnwoledgeRichness(): Promise<KnowledgeRichnessNode[]> {
    const cateList = (await CategoryService.getCategoryList())
      .filter(v => v.name.indexOf('首页') == -1 && v.name.indexOf('参考文献') == -1 && v.name.indexOf('MyBook') == -1)
    const taskList: Promise<void>[] = []
    function toKnowledgeRichnessNode(value: Category): KnowledgeRichnessNode {
      const node = new KnowledgeRichnessNode()
      node.link = value.link
      node.name = value.name
      if (value.chidren) {
        for(const i of value.chidren) {
          node.chidren.push(toKnowledgeRichnessNode(i))
        }
        if (!node.link) {
          return node
        }
        taskList.push(fs.promises.readFile("./doc/" + decodeURI(node.link.substring(2))).then(data => {
          node.size = data.toString().length
        }))
        if (value.chidren.length == 0) {
        }
      }
      return node
    }
    const result = cateList.map(toKnowledgeRichnessNode)
    await Promise.all(taskList)
    return result
  }

  public async generatePotentialKnowledgeNetwork(): Promise<KnowledgeNode[]> {
    const explicitKnowlegeNetwork = await this.generateKnowledgeNetwork();
    // 将显式知识网络转换为kw-知识节点结构
    const linkList = explicitKnowlegeNetwork
      .map(v => v.links)
      .flatMap(v => v);
    const kwNodeMap = new Map<string, KnowledgeLinkNode>();
    for(let i of linkList) {
      kwNodeMap.set(i?.name!, i!)
    }
    const ignoreDoc = ['README', 'SUMMARY'];
    const fileList = BaseService.listFilesBySuffix('md', 'doc')
    const taskList :Promise<KnowledgeNode>[] = []
    for(let file of fileList) {
      taskList.push(this.getPotentialKnowledgeNode(file, kwNodeMap))
    }
    return (await Promise.all(taskList)).filter(v => ignoreDoc.indexOf(v.id) == -1).filter(v => v.links?.length != 0)
  }

  public md2TextSegement(md: string): SearchIndexSegment[] {
    md = md.replace(/^---$.*^---$/ms, '') // 去除markdown里的元数据
    const render = new marked.Renderer();
    const slugger = new Slugger();
    render.heading = function(token) {
      const text = this.parser.parseInline(token.tokens);
      const level = token.depth + 1
      const raw = token.raw
      .toLowerCase()
      .trim()
      .replace(/<[!\/a-z].*?>/gi, '');
      const id = slugger.slug(raw);

      return `<h${level} id="${id}">${text}</h${level}>\n`;
    }
    const html = marked(md, {renderer: render}) as string
    DocService.dom.window.document.body.innerHTML = `<!DOCTYPE html><body>${html}</body></html>`
    const elemts = DocService.dom.window.document.body.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const segments: SearchIndexSegment[] = []
    for(let i = 0;i<elemts.length;i++){
      let text = '';
      const leftHeading = elemts[i].outerHTML
      if (i == elemts.length - 1) {
        text = html.substring(html.indexOf(leftHeading) + leftHeading.length)
      }else {
        const rightHeading = elemts[i+1].outerHTML
        text = getMidString(html, leftHeading, rightHeading)
      }
      text = this.cleanText(this.stringify(text))
      segments.push({
        id: elemts[i].getAttribute('id') || '',
        txt: text
      })
    }
    return segments
  }

  public stringify(html: string):string {
    DocService.dom.window.document.body.innerHTML = `<!DOCTYPE html><body>${html}</body></html>`
    const result =  DocService.dom.window.document.body.textContent || ''
    return result
  }

  private closeDom(dom :JSDOM) {
    dom.window.document.body.innerHTML = '<html></html>'
    dom.window.close()
  }

  public cleanText(text: string):string {
    return text.replace(/\t/g, '')
              .split('\n') // 按行分割
              .filter(v => v.indexOf('```') == -1) // 去除代码块标记
              .filter(v => v.length != 0) // 去除空文本
              .join('\n')
  }
}

export default DocService.getInstance()

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
import DocMetadata from "@/dto/doc/DocMetadata";
import Cacheable from "@/decorator/Cacheable";
import ArrayUtils from "../util/ArrayUtils";
import CommitInfo from "@/dto/CommitInfo";


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

  public async getFileInfo(path: string): Promise<DocFileInfo> {
    const callResult = await Promise.all([GitService.getFileCommitList(path), fs.promises.readFile(path)])
    return {
      name: path.split('/')[path.split('/').length-1].replace('.md', ''),
      id: DocUtils.docUrl2Id(path),
      content: callResult[1].toString().replace(/^---$.*^---$/ms, ''), // 去除markdown里的元数据
      metadata: this.resolveMetadata(callResult[1].toString()),
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
    const reg = new RegExp('^---$.*^---$', 'ms');
    const result = content.match(reg)
    if (result != null && result.length != 0) {
      return result[0].replace(/---/g, '');
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
      for(let tag of tagAndFilename.tags) {
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

  /**
   *
   * 生成显式知识网络
   * @return {*}  {Promise<KnowledgeNode[]>}
   * @memberof DocService
   */
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
    return (await Promise.all(taskList))
      .sort((a, b) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime())
      .map(v => [DocUtils.docUrl2Id(v[0]), v[1]])
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
    const html = marked(md)
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

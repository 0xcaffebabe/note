import DocFileInfo from "../dto/DocFileInfo";
import BaseService from "./BaseService";
import GitService from "./GitService";
import {JSDOM} from 'jsdom'
import fs from 'fs'
import marked from "marked";
import SearchIndexSegment from "../dto/search/SearchIndexSegement";
import { getMidString } from '../util/StringUtils';
import {KnowledgeNode, KnowledgeLinkNode} from "../dto/KnowledgeNode";
import DocUtils from "../util/DocUtils";

class DocService extends BaseService {
  private static dom = new JSDOM()

  static async getFileInfo(path: string): Promise<DocFileInfo> {
    const callResult = await Promise.all([GitService.getFileCommitList(path), fs.promises.readFile(path)])
    return {
      content: callResult[1].toString(),
      hasMoreCommit: callResult[0].length > 10,
      totalCommits: callResult[0].length,
      commitList: callResult[0].splice(0, Math.min(callResult[0].length, 10)),
    } as DocFileInfo
  }

  static md2text(md: string): string {
    const html = marked(md)
    const dom =  new JSDOM(`<!DOCTYPE html><body>${html}</body></html>`)
    const text = dom.window.document.body.textContent || ''
    return this.cleanText(text)
  }


  /**
   *
   * 生成某一md文件的知识网络节点
   * @static
   * @param {string} path md文件
   * @return {*}  {Promise<KnowledgeNode>}
   * @memberof DocService
   */
  static async getKnowledgeNode(path: string): Promise<KnowledgeNode> {
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
          links.push(DocUtils.resloveDocUrl(uri!))
        }
      }
      return {id: DocUtils.docUrl2Id(path), links}
    })
  }

  static async generateKnowledgeNetwork(): Promise<KnowledgeNode[]>{
    const ignoreDoc = ['README', 'SUMMARY'];
    const fileList = BaseService.listFilesBySuffix('md', 'doc')
    const taskList :Promise<KnowledgeNode>[] = []
    for(let file of fileList) {
      taskList.push(DocService.getKnowledgeNode(file))
    }
    return (await Promise.all(taskList)).filter(v => ignoreDoc.indexOf(v.id) == -1).filter(v => v.links?.length != 0)
  }

  static md2TextSegement(md: string): SearchIndexSegment[] {
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

  static stringify(html: string):string {
    DocService.dom.window.document.body.innerHTML = `<!DOCTYPE html><body>${html}</body></html>`
    const result =  DocService.dom.window.document.body.textContent || ''
    return result
  }

  static closeDom(dom :JSDOM) {
    dom.window.document.body.innerHTML = '<html></html>'
    dom.window.close()
  }

  static cleanText(text: string):string {
    return text.replace(/\t/g, '')
              .split('\n') // 按行分割
              .filter(v => v.indexOf('```') == -1) // 去除代码块标记
              .filter(v => v.length != 0) // 去除空文本
              .join('\n')
  }
}

export default DocService
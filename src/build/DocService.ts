import DocFileInfo from "../dto/DocFileInfo";
import BaseService from "./BaseService";
import GitService from "./GitService";
import {JSDOM} from 'jsdom'
import fs from 'fs'
import marked from "marked";

class DocService extends BaseService {

  static async getFileInfo(path: string): Promise<DocFileInfo> {
    const callResult = await Promise.all([GitService.getFileCommitList(path), fs.promises.readFile(path)])
    return {
      content: callResult[1].toString(),
      commitList: callResult[0].splice(0, Math.min(callResult[0].length, 10)),
      hasMoreCommit: callResult[0].length > 10,
      totalCommits: callResult[0].length
    } as DocFileInfo
  }

  static md2text(md: string): string {
    const html = marked(md)
    const dom =  new JSDOM(`<!DOCTYPE html><body>${html}</body></html>`)
    const text = dom.window.document.body.textContent || ''
    return text.replace(/\t/g, '')
              .split('\n') // 按行分割
              .filter(v => v.indexOf('```') == -1) // 去除代码块标记
              .filter(v => v.length != 0) // 去除空文本
              .join('\n')
  }
}

export default DocService
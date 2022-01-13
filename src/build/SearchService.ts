import BaseService from "./BaseService";
import DocService from "./DocService";
import fs from 'fs'
import algoliasearch from 'algoliasearch';
import SearchIndexSegment from "@/dto/search/SearchIndexSegement";

interface IndexItem {
  url: string
  objectID: string
  segments: SearchIndexSegment[]
  createTime: string
}

// 忽略文件
const ignoreFiles: string[] = ['doc/README.md', 'doc/SUMMARY.md', 'doc/个人/书单.md', 
'doc/个人/学习计划.md', 'doc/个人/技术栈参考.md', 'doc/参考文献.md', 'doc/算法与数据结构/leetcode/leetcode.md']

class SearchService extends BaseService {


  /**
   *
   * 将doc文档转为json索引数据
   * @static
   * @return {*}  {Promise<IndexItem[]>}
   * @memberof SearchService
   */
  static async generateIndex(): Promise<IndexItem[]> {
    const mdFiles = BaseService.listFilesBySuffix('md', 'doc')
      .filter(v => ignoreFiles.indexOf(v) == -1)
    const taskList: Promise<{ file: string, content: string }>[] = []
    for (let file of mdFiles) {
      taskList.push(
        fs.promises.readFile(file).then(data => {
          return {
            file,
            content: data.toString()
          }
        })
      )
    }
    const dataList = Promise.all(taskList);
    return (await dataList).map(v => {
      if (v.file.startsWith("doc") || v.file.startsWith("./doc")) {
        v.file = v.file.replace('doc/', '')
      }
      return v
    })
      .map(v => {
        return {
          url: v.file,
          objectID: v.file,
          segments: DocService.md2TextSegement(v.content),
          createTime: new Date().toISOString()
        } as IndexItem
      })
  }


  /**
   *
   * 全量更新索引
   * @static
   * @memberof SearchService
   */
  static async totalAmountUpdateIndex(appId: string, secret: string, indexName: string, indexData: IndexItem[]) {
    const client = algoliasearch(appId, secret);
    const index = client.initIndex(indexName)
    await index.replaceAllObjects(indexData)
  }
}

export default SearchService